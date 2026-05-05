import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Platform,
  Dimensions, Modal, TextInput, ActivityIndicator, Animated, Alert,
} from 'react-native';
import Purchases from 'react-native-purchases';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { playTap, playCompletion, speakText, resumeAudioContext, TAP_SOUNDS, COMPLETION_SOUNDS, VOICE_OPTIONS } from '@/lib/sound';
import { trackEvent, trackDhikrCount } from '@/lib/analytics';
import { DHIKR_SEQUENCE, DAILY_DHIKR_DB, LANG_LABELS, TRANSLATIONS } from '@/constants/data';
import { useLang } from '@/lib/lang';

const { width: SCREEN_W } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(SCREEN_W - 60, 280);

const COUNT_OPTIONS = [11, 33, 50, 100];

function getDailyDhikr() {
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_DHIKR_DB[dayOfYear % DAILY_DHIKR_DB.length];
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

export default function CounterScreen() {
  const { user, signIn, signUp, signOut } = useAuth();
  const { lang, setLang } = useLang();

  // Session config
  const [countPerDhikr, setCountPerDhikr] = useState(33);
  const [startingDhikr, setStartingDhikr] = useState(0);
  const [showSessionSetup, setShowSessionSetup] = useState(false);
  // Pending values while modal is open
  const [pendingCount, setPendingCount] = useState(33);
  const [pendingStart, setPendingStart] = useState(0);

  const [currentDhikr, setCurrentDhikr] = useState(0);
  const [count, setCount] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [tapSound, setTapSound] = useState('soft');
  const [compSound, setCompSound] = useState('chime');
  const [voiceOpt, setVoiceOpt] = useState('arabic');
  const [showSettings, setShowSettings] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const pendingCountRef = useRef(0);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDateRef = useRef(getTodayString());

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isRTL = lang === 'ar';
  const dailyDhikr = useMemo(() => getDailyDhikr(), []);

  const handlePurchase = useCallback(async (productId: string) => {
    try {
      const products = await Purchases.getProducts([productId]);
      if (!products.length) {
        Alert.alert('Not Available', 'This option is not available yet. Please try again later.');
        return;
      }
      await Purchases.purchaseStoreProduct(products[0]);
      Alert.alert('JazakAllah Khayran', 'Thank you for your support!');
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase Failed', e.message ?? 'Something went wrong. Please try again.');
      }
    }
  }, []);

  // Build effective sequence: start from startingDhikr, override target with countPerDhikr
  const activeSequence = useMemo(() => {
    const reordered = [
      ...DHIKR_SEQUENCE.slice(startingDhikr),
      ...DHIKR_SEQUENCE.slice(0, startingDhikr),
    ];
    return reordered.map(d => ({ ...d, target: countPerDhikr }));
  }, [startingDhikr, countPerDhikr]);

  const dhikr = activeSequence[currentDhikr];
  const progress = dhikr ? count / dhikr.target : 0;

  // Load today's count from Supabase if logged in
  useEffect(() => {
    if (!user) return;
    const today = getTodayString();
    supabase
      .from('daily_stats')
      .select('total_count, completed_cycles')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTotalToday(data.total_count ?? 0);
          setCompletedCycles(data.completed_cycles ?? 0);
        }
      });
    trackEvent('session_start', user.id, { date: today });
  }, [user]);

  // Daily reset check
  useEffect(() => {
    const today = getTodayString();
    if (lastDateRef.current !== today) {
      lastDateRef.current = today;
      setTotalToday(0);
      setCompletedCycles(0);
      setCount(0);
      setCurrentDhikr(0);
    }
  });

  // Batch sync to Supabase every 5 seconds
  function scheduleSyncToSupabase(extra: number) {
    pendingCountRef.current += extra;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      if (user && pendingCountRef.current > 0) {
        trackDhikrCount(user.id, pendingCountRef.current, getTodayString());
        pendingCountRef.current = 0;
      }
    }, 5000);
  }

  const handleTap = useCallback(() => {
    resumeAudioContext();
    if (!isMuted) playTap(tapSound);

    const nc = count + 1;
    setTotalToday(prev => prev + 1);
    scheduleSyncToSupabase(1);

    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    if (nc >= dhikr.target) {
      setCount(0);
      if (!isMuted) playCompletion(compSound);
      if (currentDhikr < activeSequence.length - 1) {
        setShowTransition(true);
        const nextIdx = currentDhikr + 1;
        setTimeout(() => {
          setCurrentDhikr(nextIdx);
          if (!isMuted) speakText(activeSequence[nextIdx].arabic, voiceOpt);
          setShowTransition(false);
        }, 900);
      } else {
        setCompletedCycles(p => p + 1);
        setCurrentDhikr(0);
        setShowTransition(true);
        setTimeout(() => {
          if (!isMuted) speakText(activeSequence[0].arabic, voiceOpt);
          setShowTransition(false);
        }, 900);
        if (user) {
          supabase.from('daily_stats').upsert({
            user_id: user.id,
            date: getTodayString(),
            completed_cycles: completedCycles + 1,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,date', ignoreDuplicates: false });
        }
      }
    } else {
      setCount(nc);
    }
  }, [count, currentDhikr, dhikr, isMuted, tapSound, compSound, voiceOpt, completedCycles, user, activeSequence]);

  const resetCounter = () => {
    setCount(0);
    setCurrentDhikr(0);
  };

  function openSessionSetup() {
    setPendingCount(countPerDhikr);
    setPendingStart(startingDhikr);
    setShowSessionSetup(true);
    setShowSettings(false);
  }

  function applySessionSetup() {
    setCountPerDhikr(pendingCount);
    setStartingDhikr(pendingStart);
    setCount(0);
    setCurrentDhikr(0);
    setShowSessionSetup(false);
  }

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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a1a15', '#0d2818', '#132e1f']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* HEADER */}
        <View style={[styles.header, isRTL && styles.rowReverse]}>
          <View>
            <Text style={styles.appName}>{t.appName}</Text>
            <Text style={styles.appSub}>{t.appSub}</Text>
          </View>
          <View style={styles.headerButtons}>
            <Pressable onPress={() => setShowLangPicker(!showLangPicker)} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>{LANG_LABELS[lang]?.slice(0, 2)}</Text>
            </Pressable>
            <Pressable onPress={() => setShowSettings(!showSettings)} style={styles.iconBtn}>
              <Text style={styles.iconBtnEmoji}>⚙️</Text>
            </Pressable>
            <Pressable onPress={() => setIsMuted(!isMuted)} style={styles.iconBtn}>
              <Text style={styles.iconBtnEmoji}>{isMuted ? '🔇' : '🔊'}</Text>
            </Pressable>
            {!user ? (
              <Pressable onPress={() => { setAuthMode('signin'); setShowAuth(true); }} style={styles.signInBtn}>
                <Text style={styles.signInBtnText}>{t.signIn}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => { signOut(); }} style={styles.avatarBtn}>
                <Text style={styles.avatarText}>
                  {user.user_metadata?.display_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* LANG PICKER */}
        {showLangPicker && (
          <View style={[styles.dropdown, isRTL ? styles.dropdownLeft : styles.dropdownRight]}>
            {Object.entries(LANG_LABELS).map(([code, label]) => (
              <Pressable key={code} onPress={() => { setLang(code); setShowLangPicker(false); }} style={[styles.langItem, lang === code && styles.langItemActive]}>
                <Text style={[styles.langItemText, lang === code && styles.langItemTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* SETTINGS PANEL */}
        {showSettings && (
          <View style={styles.settingsPanel}>
            <View style={styles.settingsHeader}>
              <Text style={styles.settingsTitle}>{t.soundSettings}</Text>
              <Pressable onPress={() => setShowSettings(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            {/* Session setup shortcut */}
            <Pressable onPress={openSessionSetup} style={styles.sessionShortcut}>
              <View style={styles.sessionShortcutLeft}>
                <Text style={styles.sessionShortcutTitle}>{t.customizeCounter}</Text>
                <Text style={styles.sessionShortcutSub}>
                  {countPerDhikr}× {t.eachX} · {t.startsWith} {activeSequence[0]?.transliteration}
                </Text>
              </View>
              <Text style={styles.sessionShortcutArrow}>›</Text>
            </Pressable>

            <Text style={styles.settingsSectionLabel}>{t.tapSound}</Text>
            <View style={styles.chipRow}>
              {Object.entries(TAP_SOUNDS).map(([key, val]) => (
                <Pressable key={key} onPress={() => { setTapSound(key); if (!isMuted) playTap(key); }} style={[styles.chip, tapSound === key && styles.chipActive]}>
                  <Text style={[styles.chipText, tapSound === key && styles.chipTextActive]}>{val.name}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.settingsSectionLabel}>{t.completionSound}</Text>
            <View style={styles.chipRow}>
              {Object.entries(COMPLETION_SOUNDS).map(([key, val]) => (
                <Pressable key={key} onPress={() => { setCompSound(key); if (!isMuted) playCompletion(key); }} style={[styles.chip, compSound === key && styles.chipActive]}>
                  <Text style={[styles.chipText, compSound === key && styles.chipTextActive]}>{val.name}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.settingsSectionLabel}>{t.voiceStyle}</Text>
            <View style={styles.chipRow}>
              {Object.entries(VOICE_OPTIONS).map(([key, val]) => (
                <Pressable key={key} onPress={() => setVoiceOpt(key)} style={[styles.chip, voiceOpt === key && styles.chipActive]}>
                  <Text style={[styles.chipText, voiceOpt === key && styles.chipTextActive]}>{val.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SESSION BADGE — shows current config when not default */}
        {(countPerDhikr !== 33 || startingDhikr !== 0) && (
          <Pressable onPress={openSessionSetup} style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>
              {countPerDhikr}× {t.eachX} · {t.startsWith} {activeSequence[0]?.transliteration}
            </Text>
            <Text style={styles.sessionBadgeEdit}>{t.editBtn} ›</Text>
          </Pressable>
        )}

        {/* DHIKR PROGRESS DOTS */}
        <View style={styles.progressDots}>
          {activeSequence.map((d, i) => (
            <View key={i} style={[styles.dot, i === currentDhikr ? styles.dotActive : i < currentDhikr ? styles.dotDone : styles.dotInactive]} />
          ))}
        </View>

        {/* MAIN CIRCLE */}
        <Animated.View style={[styles.circleWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <Pressable onPress={handleTap} style={styles.circle} android_ripple={{ color: 'rgba(196,164,106,0.2)', borderless: false }}>
            <LinearGradient colors={['rgba(196,164,106,0.08)', 'rgba(10,26,21,0.95)']} style={styles.circleGradient}>
              {showTransition ? (
                <View style={styles.transitionContent}>
                  <Text style={styles.completedText}>✓ {t.completed}</Text>
                  <Text style={styles.nextLoadingText}>{t.nextLoading}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.arabicText}>{dhikr?.arabic}</Text>
                  <Text style={styles.transliterationText}>{dhikr?.transliteration}</Text>
                  <Text style={styles.meaningText}>{dhikr ? ((dhikr.meaning as Record<string, string>)[lang] || dhikr.meaning.en) : ''}</Text>
                  <Text style={styles.countText}>{count}</Text>
                  <Text style={styles.ofTargetText}>{t.of} {dhikr?.target}</Text>
                </>
              )}
            </LinearGradient>
            <View style={styles.progressRing} pointerEvents="none">
              <SvgRing progress={progress} size={CIRCLE_SIZE} />
            </View>
          </Pressable>
        </Animated.View>

        <Text style={styles.tapHint}>{t.tapHint}</Text>

        {/* STATS ROW */}
        <View style={styles.statsRow}>
          {[
            { label: t.today, value: totalToday },
            { label: t.cycles, value: completedCycles },
            { label: t.current, value: `${currentDhikr + 1}/${activeSequence.length}` },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bottomButtons}>
          <Pressable onPress={resetCounter} style={styles.resetBtn}>
            <Text style={styles.resetText}>{t.reset}</Text>
          </Pressable>
          <Pressable onPress={openSessionSetup} style={styles.setupBtn}>
            <Text style={styles.setupBtnText}>⚙ {t.customizeCounter}</Text>
          </Pressable>
        </View>

        {/* DHIKR OF THE DAY */}
        <View style={styles.dotdCard}>
          <Text style={styles.dotdLabel}>{t.dhikrOfDay}</Text>
          <Text style={styles.dotdArabic}>{dailyDhikr.arabic}</Text>
          <Text style={styles.dotdTranslit}>{dailyDhikr.transliteration}</Text>
          <Text style={styles.dotdMeaning}>{(dailyDhikr as Record<string, string>)[lang] || dailyDhikr.en}</Text>
        </View>

        {/* COMING SOON */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonText}>✨ {t.moreTasbeehs}</Text>
        </View>

        {/* SUPPORT */}
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>💛 {t.supportBtn}</Text>
          <Text style={styles.supportMsg}>{t.supportMsg}</Text>
          <View style={styles.supportTiers}>
            {[
              { amount: '$2.99', emoji: '☕', productId: 'com.tasbeeh.support_low' },
              { amount: '$4.99', emoji: '🌟', productId: 'com.tasbeeh.support1' },
              { amount: '$9.99', emoji: '💎', productId: 'com.tasbeeh.support_high' },
            ].map(tier => (
              <Pressable
                key={tier.amount}
                style={[styles.tierBtn, tier.amount === '$4.99' && styles.tierBtnPrimary]}
                onPress={() => handlePurchase(tier.productId)}
              >
                <Text style={[styles.tierText, tier.amount === '$4.99' && styles.tierTextPrimary]}>{tier.emoji} {tier.amount}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.version}>TASBEEH v1.0</Text>
      </ScrollView>

      {/* ══ SESSION SETUP MODAL ══ */}
      <Modal visible={showSessionSetup} transparent animationType="slide" onRequestClose={() => setShowSessionSetup(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sessionModal}>
            <View style={styles.modalHandle} />
            <View style={styles.authHeader}>
              <Text style={styles.authTitle}>{t.customizeCounter}</Text>
              <Pressable onPress={() => setShowSessionSetup(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            {/* Count per dhikr */}
            <Text style={styles.sectionLabel}>{t.repsPerDhikr}</Text>
            <Text style={styles.sectionHint}>{t.repsHint}</Text>
            <View style={styles.countGrid}>
              {COUNT_OPTIONS.map(n => (
                <Pressable key={n} onPress={() => setPendingCount(n)} style={[styles.countOption, pendingCount === n && styles.countOptionActive]}>
                  <Text style={[styles.countOptionNum, pendingCount === n && styles.countOptionNumActive]}>{n}</Text>
                  <Text style={[styles.countOptionLabel, pendingCount === n && styles.countOptionLabelActive]}>
                    {n === 11 ? t.quick : n === 33 ? t.sunnah : n === 50 ? t.extended : t.full}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Starting dhikr */}
            <Text style={[styles.sectionLabel, { marginTop: 20 }]}>{t.startingDhikr}</Text>
            <Text style={styles.sectionHint}>{t.startingDhikrHint}</Text>
            <View style={styles.dhikrList}>
              {DHIKR_SEQUENCE.map((d, i) => (
                <Pressable key={i} onPress={() => setPendingStart(i)} style={[styles.dhikrOption, pendingStart === i && styles.dhikrOptionActive]}>
                  <View style={styles.dhikrOptionLeft}>
                    <Text style={[styles.dhikrOptionArabic, pendingStart === i && styles.dhikrOptionArabicActive]}>{d.arabic}</Text>
                    <Text style={[styles.dhikrOptionTranslit, pendingStart === i && styles.dhikrOptionTranslitActive]}>{d.transliteration}</Text>
                  </View>
                  <View style={[styles.dhikrOptionCheck, pendingStart === i && styles.dhikrOptionCheckActive]}>
                    {pendingStart === i && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.sessionPreview}>
              <Text style={styles.sessionPreviewLabel}>{t.counterPreview}</Text>
              <Text style={styles.sessionPreviewText}>
                {[
                  ...DHIKR_SEQUENCE.slice(pendingStart),
                  ...DHIKR_SEQUENCE.slice(0, pendingStart),
                ].map(d => `${d.transliteration} ×${pendingCount}`).join('  →  ')}
              </Text>
            </View>

            <Pressable onPress={applySessionSetup} style={styles.applyBtn}>
              <Text style={styles.applyBtnText}>{t.apply}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* AUTH MODAL */}
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
              <TextInput style={styles.input} placeholder={t.name} placeholderTextColor="#4a5a4a" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" />
            )}
            <TextInput style={styles.input} placeholder={t.email} placeholderTextColor="#4a5a4a" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder={t.password} placeholderTextColor="#4a5a4a" value={password} onChangeText={setPassword} secureTextEntry />
            {authError ? <Text style={styles.authError}>{authError}</Text> : null}
            <Pressable onPress={handleAuth} style={styles.authSubmitBtn} disabled={authLoading}>
              {authLoading ? <ActivityIndicator color="#0a1a15" /> : <Text style={styles.authSubmitText}>{authMode === 'signin' ? t.signIn : t.signUp}</Text>}
            </Pressable>
            <Pressable onPress={() => { setAuthMode(authMode === 'signin' ? 'signup' : 'signin'); setAuthError(''); }}>
              <Text style={styles.authToggle}>
                {authMode === 'signin' ? t.noAccount : t.hasAccount} {authMode === 'signin' ? t.signUp : t.signIn}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SvgRing({ progress, size }: { progress: number; size: number }) {
  if (Platform.OS !== 'web') return null;
  const r = (size / 2) * 0.92;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(progress, 1));
  return (
    <svg style={{ position: 'absolute' as any, top: 0, left: 0 } as any} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(196,164,106,0.08)" strokeWidth="3" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#c4a46a" strokeWidth="3"
        strokeDasharray={`${circ - offset} ${offset}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: 'drop-shadow(0 0 6px rgba(196,164,106,0.5))' } as any}
      />
    </svg>
  );
}

const GOLD = '#c4a46a';
const MUTED = '#6a7a6a';
const DIM = '#4a5a4a';
const BG_CARD = 'rgba(196,164,106,0.05)';
const BORDER = 'rgba(196,164,106,0.12)';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1a15' },
  scroll: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  rowReverse: { flexDirection: 'row-reverse' },
  appName: { fontSize: 26, fontWeight: '700', color: GOLD, letterSpacing: 0.5 },
  appSub: { fontSize: 10, color: MUTED, letterSpacing: 2, textTransform: 'uppercase', marginTop: 1 },
  headerButtons: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  iconBtn: { backgroundColor: 'rgba(196,164,106,0.1)', borderWidth: 1, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  iconBtnText: { color: GOLD, fontSize: 11, fontWeight: '600' },
  iconBtnEmoji: { fontSize: 14 },
  signInBtn: { backgroundColor: GOLD, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  signInBtnText: { color: '#0a1a15', fontSize: 10, fontWeight: '700' },
  avatarBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0a1a15', fontSize: 13, fontWeight: '700' },
  dropdown: { position: 'absolute', top: 56, zIndex: 99, backgroundColor: '#132e1f', borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 4, minWidth: 130 },
  dropdownRight: { right: 20 },
  dropdownLeft: { left: 20 },
  langItem: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  langItemActive: { backgroundColor: 'rgba(196,164,106,0.12)' },
  langItemText: { color: '#e8e0d0', fontSize: 12 },
  langItemTextActive: { color: GOLD, fontWeight: '600' },
  settingsPanel: { marginHorizontal: 20, marginBottom: 12, padding: 16, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER },
  settingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  settingsTitle: { color: GOLD, fontSize: 14, fontWeight: '600' },
  closeBtn: { color: MUTED, fontSize: 18 },
  sessionShortcut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: 'rgba(196,164,106,0.08)', borderRadius: 10, borderWidth: 1, borderColor: BORDER, marginBottom: 14 },
  sessionShortcutLeft: { flex: 1 },
  sessionShortcutTitle: { color: GOLD, fontSize: 12, fontWeight: '600' },
  sessionShortcutSub: { color: MUTED, fontSize: 10, marginTop: 2 },
  sessionShortcutArrow: { color: GOLD, fontSize: 20, marginLeft: 8 },
  settingsSectionLabel: { color: MUTED, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6, marginTop: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  chipActive: { borderColor: GOLD, backgroundColor: 'rgba(196,164,106,0.12)' },
  chipText: { color: '#8a9a8a', fontSize: 10 },
  chipTextActive: { color: GOLD },
  sessionBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(196,164,106,0.08)', borderRadius: 8, borderWidth: 1, borderColor: BORDER },
  sessionBadgeText: { color: MUTED, fontSize: 10 },
  sessionBadgeEdit: { color: GOLD, fontSize: 10, fontWeight: '600' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 16, paddingHorizontal: 20 },
  dot: { height: 10, borderRadius: 5 },
  dotActive: { width: 28, backgroundColor: GOLD },
  dotDone: { width: 10, backgroundColor: 'rgba(196,164,106,0.5)' },
  dotInactive: { width: 10, backgroundColor: 'rgba(196,164,106,0.15)' },
  circleWrapper: { alignSelf: 'center', marginBottom: 8 },
  circle: {
    width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2, borderColor: 'rgba(196,164,106,0.2)',
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  } as any,
  circleGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 20 },
  progressRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  transitionContent: { alignItems: 'center' },
  completedText: { color: GOLD, fontSize: 16, fontWeight: '500', marginBottom: 6 },
  nextLoadingText: { color: MUTED, fontSize: 12 },
  arabicText: { color: '#e8e0d0', fontSize: CIRCLE_SIZE > 260 ? 32 : 26, fontWeight: '700', textAlign: 'center', lineHeight: 50, marginBottom: 4 },
  transliterationText: { color: GOLD, fontSize: 12, fontWeight: '500', letterSpacing: 0.5, marginBottom: 2 },
  meaningText: { color: MUTED, fontSize: 9, textAlign: 'center', marginBottom: 12, paddingHorizontal: 16 },
  countText: { color: GOLD, fontSize: 52, fontWeight: '700', lineHeight: 56 },
  ofTargetText: { color: DIM, fontSize: 11, marginTop: 2 },
  tapHint: { textAlign: 'center', color: DIM, fontSize: 10, marginBottom: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 10 },
  statCard: { flex: 1, padding: 12, backgroundColor: BG_CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  statValue: { color: GOLD, fontSize: 20, fontWeight: '700' },
  statLabel: { color: MUTED, fontSize: 8, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 2 },
  bottomButtons: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 12 },
  resetBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  resetText: { color: MUTED, fontSize: 11 },
  setupBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: BORDER, alignItems: 'center', backgroundColor: 'rgba(196,164,106,0.06)' },
  setupBtnText: { color: GOLD, fontSize: 11, fontWeight: '500' },
  dotdCard: { marginHorizontal: 20, marginBottom: 12, padding: 16, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  dotdLabel: { color: MUTED, fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 },
  dotdArabic: { color: '#e8e0d0', fontSize: 18, fontWeight: '600', textAlign: 'center', lineHeight: 32, marginBottom: 5 },
  dotdTranslit: { color: GOLD, fontSize: 10, fontWeight: '500' },
  dotdMeaning: { color: MUTED, fontSize: 9, fontStyle: 'italic', marginTop: 3, textAlign: 'center' },
  comingSoonCard: { marginHorizontal: 20, marginBottom: 10, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(196,164,106,0.04)', borderRadius: 10, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  comingSoonText: { color: MUTED, fontSize: 11, fontStyle: 'italic', letterSpacing: 0.3 },
  supportCard: { marginHorizontal: 20, marginBottom: 12, padding: 16, backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER, alignItems: 'center' },
  supportTitle: { color: GOLD, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  supportMsg: { color: '#9a9580', fontSize: 10, lineHeight: 16, textAlign: 'center', marginBottom: 12, maxWidth: 300 },
  supportTiers: { flexDirection: 'row', gap: 6 },
  tierBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  tierBtnPrimary: { backgroundColor: GOLD, borderColor: GOLD },
  tierText: { color: GOLD, fontSize: 11, fontWeight: '600' },
  tierTextPrimary: { color: '#0a1a15' },
  version: { textAlign: 'center', color: '#1a2a1a', fontSize: 8, letterSpacing: 1, marginTop: 8 },
  // Session modal
  sessionModal: { backgroundColor: '#0d2818', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36, borderTopWidth: 1, borderColor: BORDER, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, backgroundColor: 'rgba(196,164,106,0.2)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sectionLabel: { color: GOLD, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  sectionHint: { color: MUTED, fontSize: 10, marginBottom: 12, lineHeight: 15 },
  countGrid: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  countOption: {
    flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER,
    alignItems: 'center', backgroundColor: BG_CARD,
  },
  countOptionActive: { borderColor: GOLD, backgroundColor: 'rgba(196,164,106,0.12)' },
  countOptionNum: { color: '#e8e0d0', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  countOptionNumActive: { color: GOLD },
  countOptionLabel: { color: DIM, fontSize: 9, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  countOptionLabelActive: { color: MUTED },
  dhikrList: { gap: 6, marginBottom: 4 },
  dhikrOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: BORDER, backgroundColor: BG_CARD,
  },
  dhikrOptionActive: { borderColor: GOLD, backgroundColor: 'rgba(196,164,106,0.1)' },
  dhikrOptionLeft: { flex: 1 },
  dhikrOptionArabic: { color: '#e8e0d0', fontSize: 18, fontWeight: '600', marginBottom: 2 },
  dhikrOptionArabicActive: { color: '#f0e8d0' },
  dhikrOptionTranslit: { color: MUTED, fontSize: 11 },
  dhikrOptionTranslitActive: { color: GOLD },
  dhikrOptionCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  dhikrOptionCheckActive: { borderColor: GOLD, backgroundColor: GOLD },
  checkMark: { color: '#0a1a15', fontSize: 11, fontWeight: '700' },
  sessionPreview: { marginTop: 16, marginBottom: 20, padding: 12, backgroundColor: 'rgba(196,164,106,0.04)', borderRadius: 10, borderWidth: 1, borderColor: BORDER },
  sessionPreviewLabel: { color: MUTED, fontSize: 9, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  sessionPreviewText: { color: '#7a8a7a', fontSize: 10, lineHeight: 18 },
  applyBtn: { backgroundColor: GOLD, borderRadius: 14, padding: 16, alignItems: 'center' },
  applyBtnText: { color: '#0a1a15', fontSize: 15, fontWeight: '700' },
  // Auth modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  authModal: { backgroundColor: '#0d2818', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, borderTopWidth: 1, borderColor: BORDER },
  authHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  authTitle: { color: GOLD, fontSize: 20, fontWeight: '700' },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 14, color: '#e8e0d0', fontSize: 14, marginBottom: 12 },
  authError: { color: '#e05555', fontSize: 12, marginBottom: 10 },
  authSubmitBtn: { backgroundColor: GOLD, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 14 },
  authSubmitText: { color: '#0a1a15', fontSize: 15, fontWeight: '700' },
  authToggle: { color: MUTED, fontSize: 12, textAlign: 'center' },
});
