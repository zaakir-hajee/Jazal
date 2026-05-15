import { useState, useEffect, useRef } from 'react';
import { useScrollToTop } from '@react-navigation/native';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { TRANSLATIONS } from '@/constants/data';
import { useLang } from '@/lib/lang';

const GOLD = '#c4a46a';
const MUTED = '#6a7a6a';
const DIM = '#4a5a4a';
const BG_CARD = 'rgba(196,164,106,0.05)';
const BORDER = 'rgba(196,164,106,0.12)';

type RankData = {
  user_rank: number;
  total_users: number;
  user_count: number;
  percentile: number;
};

type LeaderEntry = {
  rank: number;
  display_name: string;
  total_count: number;
  is_me: boolean;
};

function getTodayString() { return new Date().toISOString().slice(0, 10); }

export default function RankingScreen() {
  const insets = useSafeAreaInsets();
  const { user, signIn, signUp } = useAuth();
  const { lang } = useLang();
  const [mode, setMode] = useState<'percentage' | 'numbers' | 'off'>('percentage');
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [globalStats, setGlobalStats] = useState<{ total_users: number; total_dhikr: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const today = getTodayString();

    Promise.all([
      // User rank
      supabase.rpc('get_user_rank_today', { p_user_id: user.id }),
      // Top 10 leaderboard
      supabase
        .from('daily_stats')
        .select('user_id, total_count')
        .eq('date', today)
        .order('total_count', { ascending: false })
        .limit(10),
      // Profiles for names
      supabase.from('profiles').select('id, display_name'),
    ]).then(async ([rankRes, leaderRes, profilesRes]) => {
      if (rankRes.data?.[0]) {
        const r = rankRes.data[0];
        setRankData({
          user_rank: Number(r.user_rank),
          total_users: Number(r.total_users),
          user_count: Number(r.user_count),
          percentile: Number(r.percentile),
        });
        setGlobalStats({
          total_users: Number(r.total_users),
          total_dhikr: 0,
        });
      }

      if (leaderRes.data && profilesRes.data) {
        const profileMap = new Map(profilesRes.data.map((p: any) => [p.id, p.display_name || 'Anonymous']));
        const entries: LeaderEntry[] = leaderRes.data.map((row: any, i: number) => ({
          rank: i + 1,
          display_name: profileMap.get(row.user_id) || 'Anonymous',
          total_count: row.total_count,
          is_me: row.user_id === user.id,
        }));
        setLeaderboard(entries);
      }
      setLoading(false);
    });
  }, [user]);

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

  function getRankMedal(rank: number) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a1a15', '#0d2818', '#132e1f']} style={StyleSheet.absoluteFill} />
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Text style={styles.screenTitle}>{t.rankTitle}</Text>
          <Text style={styles.screenSub}>{t.rankSub}</Text>
        </View>

        {/* Mode tabs */}
        <View style={styles.modeTabs}>
          {([
            { id: 'percentage', label: 'Top %' },
            { id: 'numbers', label: 'Leaderboard' },
            { id: 'off', label: '🤫 Private' },
          ] as const).map(m => (
            <Pressable key={m.id} onPress={() => setMode(m.id)} style={[styles.modeTab, mode === m.id && styles.modeTabActive]}>
              <Text style={[styles.modeTabText, mode === m.id && styles.modeTabTextActive]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'off' ? (
          <View style={styles.privateCard}>
            <Text style={styles.privateEmoji}>🤫</Text>
            <Text style={styles.privateText}>{t.rankOffMsg}</Text>
          </View>
        ) : !user ? (
          <View style={styles.lockCard}>
            <Text style={styles.lockEmoji}>🏆</Text>
            <Text style={styles.lockTitle}>Sign in to see your ranking</Text>
            <Text style={styles.lockDesc}>Compare your dhikr count with other users and track your position in the community.</Text>
            <Pressable onPress={() => { setAuthMode('signin'); setShowAuth(true); }} style={styles.signInBtn}>
              <Text style={styles.signInBtnText}>{t.signInFree}</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={GOLD} />
            <Text style={styles.loadingText}>{t.loading}</Text>
          </View>
        ) : (
          <>
            {mode === 'percentage' && rankData && (
              <>
                {/* User rank card */}
                <View style={styles.rankHeroCard}>
                  <Text style={styles.rankHeroLabel}>{t.yourRank}</Text>
                  <Text style={styles.rankHeroValue}>#{rankData.user_rank}</Text>
                  <Text style={styles.rankHeroSub}>
                    {t.topPercent} {rankData.percentile}% {t.ofAllUsers}
                  </Text>
                  <View style={styles.rankProgressBar}>
                    <View style={[styles.rankProgressFill, { width: `${Math.max(5, 100 - rankData.percentile)}%` }]} />
                  </View>
                </View>

                {/* Stats row */}
                <View style={styles.rankStatsRow}>
                  <View style={styles.rankStat}>
                    <Text style={styles.rankStatValue}>{rankData.user_count.toLocaleString()}</Text>
                    <Text style={styles.rankStatLabel}>Your Today</Text>
                  </View>
                  <View style={styles.rankStatDivider} />
                  <View style={styles.rankStat}>
                    <Text style={styles.rankStatValue}>{rankData.total_users.toLocaleString()}</Text>
                    <Text style={styles.rankStatLabel}>{t.totalUsers}</Text>
                  </View>
                </View>

                {/* Motivation */}
                <View style={styles.motivationCard}>
                  <Text style={styles.motivationText}>
                    {rankData.user_count === 0
                      ? '🌟 Start counting today to enter the rankings!'
                      : rankData.user_rank === 1
                      ? '👑 You are the top dhikr counter today! Masha\'Allah!'
                      : `💪 ${t.rankKeep}`}
                  </Text>
                </View>
              </>
            )}

            {mode === 'numbers' && (
              <>
                <Text style={styles.leaderboardTitle}>Today's Top 10</Text>
                {leaderboard.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>{t.rankNoData}</Text>
                  </View>
                ) : (
                  leaderboard.map((entry) => (
                    <View key={entry.rank} style={[styles.leaderRow, entry.is_me && styles.leaderRowMe]}>
                      <Text style={styles.leaderRank}>{getRankMedal(entry.rank)}</Text>
                      <View style={styles.leaderInfo}>
                        <Text style={[styles.leaderName, entry.is_me && styles.leaderNameMe]}>
                          {entry.display_name}{entry.is_me ? ' (You)' : ''}
                        </Text>
                      </View>
                      <View style={styles.leaderCount}>
                        <Text style={[styles.leaderCountText, entry.is_me && styles.leaderCountMe]}>
                          {entry.total_count.toLocaleString()}
                        </Text>
                        <Text style={styles.leaderCountLabel}>dhikr</Text>
                      </View>
                    </View>
                  ))
                )}
                {leaderboard.length > 0 && rankData && rankData.user_rank > 10 && (
                  <View style={[styles.leaderRow, styles.leaderRowMe]}>
                    <Text style={styles.leaderRank}>#{rankData.user_rank}</Text>
                    <View style={styles.leaderInfo}>
                      <Text style={[styles.leaderName, styles.leaderNameMe]}>You</Text>
                    </View>
                    <View style={styles.leaderCount}>
                      <Text style={[styles.leaderCountText, styles.leaderCountMe]}>{rankData.user_count.toLocaleString()}</Text>
                      <Text style={styles.leaderCountLabel}>dhikr</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Global stats */}
            {rankData && (
              <View style={styles.globalCard}>
                <Text style={styles.globalTitle}>Global Community</Text>
                <Text style={styles.globalText}>
                  {rankData.total_users.toLocaleString()} users counting dhikr today. Every count matters.
                </Text>
              </View>
            )}
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
  modeTabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 16, backgroundColor: 'rgba(196,164,106,0.04)', borderRadius: 12, padding: 3, gap: 3 },
  modeTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  modeTabActive: { backgroundColor: 'rgba(196,164,106,0.15)' },
  modeTabText: { color: DIM, fontSize: 10, fontWeight: '400' },
  modeTabTextActive: { color: GOLD, fontWeight: '600' },
  privateCard: { margin: 20, padding: 32, backgroundColor: BG_CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  privateEmoji: { fontSize: 36, marginBottom: 12 },
  privateText: { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  lockCard: { margin: 20, padding: 28, backgroundColor: BG_CARD, borderRadius: 20, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  lockEmoji: { fontSize: 36, marginBottom: 10 },
  lockTitle: { color: GOLD, fontSize: 15, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  lockDesc: { color: MUTED, fontSize: 11, textAlign: 'center', lineHeight: 18, marginBottom: 20, maxWidth: 260 },
  signInBtn: { backgroundColor: GOLD, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28 },
  signInBtnText: { color: '#0a1a15', fontSize: 13, fontWeight: '700' },
  loadingContainer: { padding: 60, alignItems: 'center', gap: 12 },
  loadingText: { color: MUTED, fontSize: 12 },
  rankHeroCard: { marginHorizontal: 20, marginBottom: 12, padding: 28, backgroundColor: 'rgba(196,164,106,0.07)', borderRadius: 20, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  rankHeroLabel: { color: MUTED, fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
  rankHeroValue: { color: GOLD, fontSize: 52, fontWeight: '700', lineHeight: 56 },
  rankHeroSub: { color: MUTED, fontSize: 12, marginTop: 6, marginBottom: 14 },
  rankProgressBar: { width: '100%', height: 6, backgroundColor: 'rgba(196,164,106,0.1)', borderRadius: 3, overflow: 'hidden' },
  rankProgressFill: { height: '100%', backgroundColor: GOLD, borderRadius: 3 },
  rankStatsRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 12, padding: 20, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
  rankStat: { flex: 1, alignItems: 'center' },
  rankStatDivider: { width: 1, backgroundColor: BORDER },
  rankStatValue: { color: GOLD, fontSize: 24, fontWeight: '700' },
  rankStatLabel: { color: MUTED, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 },
  motivationCard: { marginHorizontal: 20, marginBottom: 12, padding: 16, backgroundColor: BG_CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER },
  motivationText: { color: '#b0a890', fontSize: 12, textAlign: 'center', lineHeight: 20 },
  leaderboardTitle: { paddingHorizontal: 20, marginBottom: 10, color: GOLD, fontSize: 13, fontWeight: '600' },
  emptyCard: { margin: 20, padding: 24, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
  emptyText: { color: MUTED, fontSize: 12, textAlign: 'center' },
  leaderRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 6, padding: 14, backgroundColor: BG_CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER },
  leaderRowMe: { borderColor: GOLD, backgroundColor: 'rgba(196,164,106,0.08)' },
  leaderRank: { width: 36, fontSize: 16, textAlign: 'center', color: '#e8e0d0' },
  leaderInfo: { flex: 1, paddingHorizontal: 10 },
  leaderName: { color: '#e8e0d0', fontSize: 13, fontWeight: '500' },
  leaderNameMe: { color: GOLD, fontWeight: '700' },
  leaderCount: { alignItems: 'flex-end' },
  leaderCountText: { color: '#e8e0d0', fontSize: 16, fontWeight: '700' },
  leaderCountMe: { color: GOLD },
  leaderCountLabel: { color: DIM, fontSize: 8, textTransform: 'uppercase' },
  globalCard: { marginHorizontal: 20, marginTop: 8, marginBottom: 12, padding: 16, backgroundColor: BG_CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER },
  globalTitle: { color: GOLD, fontSize: 11, fontWeight: '600', marginBottom: 6 },
  globalText: { color: MUTED, fontSize: 11, lineHeight: 18 },
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
