import { useState, useEffect, useMemo, useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { TRANSLATIONS, LANG_LABELS } from '@/constants/data';
import { useLang } from '@/lib/lang';
import { registerScroll } from '@/lib/scrollRegistry';

const GOLD = '#c4a46a';
const MUTED = '#6a7a6a';
const DIM = '#4a5a4a';
const BG_CARD = 'rgba(196,164,106,0.05)';
const BORDER = 'rgba(196,164,106,0.12)';

type DailyStat = { date: string; total_count: number; completed_cycles: number };

function getTodayString() { return new Date().toISOString().slice(0, 10); }

function getWeekDates() {
  const days = [];
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), label: labels[d.getDay()], isToday: i === 0 });
  }
  return days;
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signIn, signUp } = useAuth();
  const { lang, setLang } = useLang();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [profile, setProfile] = useState<{ streak_days: number; best_day_count: number; best_day_label: string; first_use_date: string } | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  useEffect(() => { registerScroll('stats', scrollRef); }, []);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // Load last 30 days of stats
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    Promise.all([
      supabase.from('daily_stats')
        .select('date, total_count, completed_cycles')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().slice(0, 10))
        .order('date', { ascending: true }),
      supabase.from('profiles')
        .select('streak_days, best_day_count, best_day_label, first_use_date')
        .eq('id', user.id)
        .maybeSingle(),
    ]).then(([statsRes, profileRes]) => {
      if (statsRes.data) setStats(statsRes.data);
      if (profileRes.data) setProfile(profileRes.data);
      setLoading(false);
    });
  }, [user]);

  const weekDates = useMemo(() => getWeekDates(), []);
  const today = getTodayString();

  const weekData = weekDates.map(d => ({
    ...d,
    count: stats.find(s => s.date === d.date)?.total_count ?? 0,
  }));

  const todayCount = weekData.find(d => d.isToday)?.count ?? 0;

  const weekTotal = weekData.reduce((sum, d) => sum + d.count, 0);

  const monthTotal = useMemo(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return stats.filter(s => s.date.startsWith(monthKey)).reduce((sum, s) => sum + s.total_count, 0);
  }, [stats]);

  const allTimeTotal = useMemo(() => stats.reduce((sum, s) => sum + s.total_count, 0), [stats]);

  const bestDay = useMemo(() => {
    if (!stats.length) return { count: 0, date: '' };
    const best = stats.reduce((a, b) => a.total_count > b.total_count ? a : b);
    return { count: best.total_count, date: best.date };
  }, [stats]);

  const weekMax = Math.max(...weekData.map(d => d.count), 1);

  async function handleAuth() {
    setAuthError('');
    setAuthLoading(true);
    let err: string | null = null;
    if (authMode === 'signin') {
      err = await signIn(email.trim(), password);
    } else {
      err = await signUp(email.trim(), password, displayName.trim());
    }
    setAuthLoading(false);
    if (err) {
      setAuthError(err);
    } else {
      setShowAuth(false);
      setEmail(''); setPassword(''); setDisplayName('');
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingAccount(true);
            await supabase.rpc('delete_user');
            await supabase.auth.signOut();
            setDeletingAccount(false);
            router.replace('/(tabs)');
          },
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a1a15', '#0d2818', '#132e1f']} style={StyleSheet.absoluteFill} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.header, { paddingTop: insets.top + 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View>
            <Text style={styles.screenTitle}>{t.statsTitle}</Text>
            <Text style={styles.screenSub}>{t.statsSub}</Text>
          </View>
          <Pressable onPress={() => setShowLangPicker(v => !v)} style={styles.langToggle}>
            <Text style={styles.langToggleText}>{LANG_LABELS[lang]?.slice(0, 2).toUpperCase()}</Text>
          </Pressable>
        </View>

        {showLangPicker && (
          <View style={styles.langDropdown}>
            {Object.entries(LANG_LABELS).map(([code, label]) => (
              <Pressable key={code} onPress={() => { setLang(code); setShowLangPicker(false); }} style={[styles.langItem, lang === code && styles.langItemActive]}>
                <Text style={[styles.langItemText, lang === code && styles.langItemTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {!user ? (
          <View style={styles.lockCard}>
            <Text style={styles.lockEmoji}>🔐</Text>
            <Text style={styles.lockTitle}>{t.signInUnlock}</Text>
            <Text style={styles.lockDesc}>{t.signInDesc}</Text>
            <Pressable onPress={() => { setAuthMode('signin'); setShowAuth(true); }} style={styles.signInBtn}>
              <Text style={styles.signInBtnText}>{t.signInFree}</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={GOLD} />
          </View>
        ) : (
          <>
            {/* TODAY HERO */}
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>{t.today}</Text>
              <Text style={styles.heroValue}>{todayCount.toLocaleString()}</Text>
              <Text style={styles.heroSub}>{t.dhikrCounted}</Text>
            </View>

            {/* WEEKLY CHART */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t.thisWeek}</Text>
              {weekTotal === 0 ? (
                <Text style={styles.emptyText}>{t.startCounting}</Text>
              ) : (
                <View style={styles.chart}>
                  {weekData.map((d, i) => {
                    const barH = Math.max((d.count / weekMax) * 80, d.count > 0 ? 4 : 2);
                    return (
                      <View key={i} style={styles.chartBar}>
                        <Text style={styles.chartValue}>{d.count > 0 ? d.count : ''}</Text>
                        <View style={[styles.bar, { height: barH }, d.isToday ? styles.barToday : d.count > 0 ? styles.barDone : styles.barEmpty]} />
                        <Text style={[styles.chartDay, d.isToday && styles.chartDayToday]}>{d.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
              <Text style={styles.weekTotalText}>Week total: {weekTotal.toLocaleString()} dhikr</Text>
            </View>

            {/* STATS GRID */}
            <View style={styles.statsGrid}>
              {[
                { label: t.thisMonth, value: monthTotal.toLocaleString() },
                { label: t.streak, value: `${profile?.streak_days ?? 0} ${t.days}` },
                { label: t.bestDay, value: bestDay.count.toLocaleString(), sub: bestDay.date || '—' },
                { label: t.totalAll, value: allTimeTotal.toLocaleString(), sub: t.sinceJoining },
              ].map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <Text style={styles.statLabel}>{s.label}</Text>
                  <Text style={styles.statValue}>{s.value}</Text>
                  {s.sub && <Text style={styles.statSub}>{s.sub}</Text>}
                </View>
              ))}
            </View>

            {/* LAST 30 DAYS HEATMAP */}
            {stats.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Last 30 Days</Text>
                <View style={styles.heatmap}>
                  {Array.from({ length: 30 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (29 - i));
                    const key = d.toISOString().slice(0, 10);
                    const dayStats = stats.find(s => s.date === key);
                    const cnt = dayStats?.total_count ?? 0;
                    const intensity = cnt === 0 ? 0 : Math.min(cnt / 200, 1);
                    return (
                      <View
                        key={i}
                        style={[styles.heatCell, {
                          backgroundColor: cnt === 0
                            ? 'rgba(196,164,106,0.06)'
                            : `rgba(196,164,106,${0.2 + intensity * 0.8})`,
                        }]}
                        accessibilityLabel={`${key}: ${cnt}`}
                      />
                    );
                  })}
                </View>
                <View style={styles.heatLegend}>
                  <Text style={styles.heatLegendText}>Less</Text>
                  {[0.06, 0.25, 0.5, 0.75, 1].map(op => (
                    <View key={op} style={[styles.heatLegendCell, { backgroundColor: `rgba(196,164,106,${op})` }]} />
                  ))}
                  <Text style={styles.heatLegendText}>More</Text>
                </View>
              </View>
            )}

            {/* EMAIL */}
            <View style={styles.accountCard}>
              <Text style={styles.accountLabel}>Signed in as</Text>
              <Text style={styles.accountEmail}>{user.email}</Text>
            </View>

            {/* DELETE ACCOUNT */}
            <Pressable onPress={handleDeleteAccount} style={styles.deleteBtn} disabled={deletingAccount}>
              {deletingAccount
                ? <ActivityIndicator color="#e05555" />
                : <Text style={styles.deleteBtnText}>Delete Account</Text>}
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal visible={showAuth} transparent animationType="slide" onRequestClose={() => setShowAuth(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.authModal}>
            <View style={styles.authHeader}>
              <Text style={styles.authTitle}>{authMode === 'signin' ? t.signIn : t.signUp}</Text>
              <Pressable onPress={() => setShowAuth(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>
            {authMode === 'signup' && (
              <TextInput style={styles.input} placeholder={t.name} placeholderTextColor="#4a5a4a" value={displayName} onChangeText={setDisplayName} />
            )}
            <TextInput style={styles.input} placeholder={t.email} placeholderTextColor="#4a5a4a" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder={t.password} placeholderTextColor="#4a5a4a" value={password} onChangeText={setPassword} secureTextEntry />
            {authError ? <Text style={styles.authError}>{authError}</Text> : null}
            <Pressable onPress={handleAuth} style={styles.authSubmitBtn} disabled={authLoading}>
              {authLoading ? <ActivityIndicator color="#0a1a15" /> : <Text style={styles.authSubmitText}>{authMode === 'signin' ? t.signIn : t.signUp}</Text>}
            </Pressable>
            <Pressable onPress={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthError(''); }}>
              <Text style={styles.authToggle}>{authMode === 'signin' ? t.noAccount : t.hasAccount} {authMode === 'signin' ? t.signUp : t.signIn}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  scroll: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  screenTitle: { fontSize: 26, fontWeight: '700', color: GOLD },
  screenSub: { fontSize: 10, color: MUTED, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },
  langToggle: { backgroundColor: 'rgba(196,164,106,0.1)', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  langToggleText: { color: GOLD, fontSize: 11, fontWeight: '600' },
  langDropdown: { alignSelf: 'flex-end', marginRight: 20, marginTop: -4, marginBottom: 4, backgroundColor: '#132e1f', borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 4, minWidth: 130 },
  langItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  langItemActive: { backgroundColor: 'rgba(196,164,106,0.15)' },
  langItemText: { color: MUTED, fontSize: 13 },
  langItemTextActive: { color: GOLD, fontWeight: '600' },
  lockCard: { margin: 20, padding: 28, backgroundColor: BG_CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  lockEmoji: { fontSize: 36, marginBottom: 10 },
  lockTitle: { color: GOLD, fontSize: 15, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  lockDesc: { color: MUTED, fontSize: 11, textAlign: 'center', lineHeight: 18, marginBottom: 20, maxWidth: 260 },
  signInBtn: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  signInBtnText: { color: '#0a1a15', fontSize: 13, fontWeight: '700' },
  loadingContainer: { padding: 60, alignItems: 'center' },
  heroCard: { marginHorizontal: 20, marginBottom: 12, padding: 24, backgroundColor: 'rgba(196,164,106,0.07)', borderRadius: 20, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  heroLabel: { color: MUTED, fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  heroValue: { color: GOLD, fontSize: 48, fontWeight: '700', lineHeight: 52 },
  heroSub: { color: MUTED, fontSize: 11, marginTop: 4 },
  card: { marginHorizontal: 20, marginBottom: 12, padding: 18, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
  cardTitle: { color: GOLD, fontSize: 12, fontWeight: '600', marginBottom: 14 },
  emptyText: { color: DIM, fontSize: 11, textAlign: 'center', paddingVertical: 16 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 6 },
  chartBar: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  chartValue: { color: GOLD, fontSize: 8, marginBottom: 3, height: 12 },
  bar: { width: '100%', borderRadius: 4 },
  barToday: { backgroundColor: GOLD },
  barDone: { backgroundColor: 'rgba(196,164,106,0.3)' },
  barEmpty: { backgroundColor: 'rgba(196,164,106,0.08)' },
  chartDay: { color: DIM, fontSize: 8, marginTop: 4 },
  chartDayToday: { color: GOLD, fontWeight: '600' },
  weekTotalText: { color: DIM, fontSize: 10, marginTop: 12, textAlign: 'right' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  statCard: { width: '47%', padding: 14, backgroundColor: BG_CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER },
  statLabel: { color: MUTED, fontSize: 8, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  statValue: { color: GOLD, fontSize: 20, fontWeight: '700' },
  statSub: { color: DIM, fontSize: 8, marginTop: 2 },
  heatmap: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  heatCell: { width: 20, height: 20, borderRadius: 4 },
  heatLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, justifyContent: 'flex-end' },
  heatLegendText: { color: DIM, fontSize: 8 },
  heatLegendCell: { width: 12, height: 12, borderRadius: 2 },
  accountCard: { marginHorizontal: 20, marginBottom: 12, padding: 14, backgroundColor: BG_CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER },
  accountLabel: { color: MUTED, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 },
  accountEmail: { color: '#e8e0d0', fontSize: 13 },
  deleteBtn: { marginHorizontal: 20, marginBottom: 12, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(224,85,85,0.3)', alignItems: 'center' },
  deleteBtnText: { color: '#e05555', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  authModal: { backgroundColor: '#0d2818', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, borderTopWidth: 1, borderColor: BORDER },
  authHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  authTitle: { color: GOLD, fontSize: 20, fontWeight: '700' },
  closeBtn: { color: MUTED, fontSize: 18 },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 14, color: '#e8e0d0', fontSize: 14, marginBottom: 12 },
  authError: { color: '#e05555', fontSize: 12, marginBottom: 10 },
  authSubmitBtn: { backgroundColor: GOLD, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 14 },
  authSubmitText: { color: '#0a1a15', fontSize: 15, fontWeight: '700' },
  authToggle: { color: MUTED, fontSize: 12, textAlign: 'center' },
});
