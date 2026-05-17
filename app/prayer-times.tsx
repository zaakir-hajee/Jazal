import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ScrollView, Switch,
  TextInput, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Coordinates, CalculationMethod, PrayerTimes as AdhanPrayerTimes, Prayer } from 'adhan';

// ── Theme ─────────────────────────────────────────────────────────────────────
const GOLD = '#c4a46a';
const MUTED = '#6a7a6a';
const DIM = '#4a5a4a';
const BG_CARD = 'rgba(196,164,106,0.05)';
const BORDER = 'rgba(196,164,106,0.12)';
const BG_DARK = '#0a1a15';
const GREEN_OK = '#4a9a6a';

// ── Constants ─────────────────────────────────────────────────────────────────
const PRAYERS = [
  { key: 'fajr',    en: 'Fajr',    ar: 'الفجر',   icon: '🌅' },
  { key: 'dhuhr',   en: 'Dhuhr',   ar: 'الظهر',   icon: '☀️' },
  { key: 'asr',     en: 'Asr',     ar: 'العصر',   icon: '🌤️' },
  { key: 'maghrib', en: 'Maghrib', ar: 'المغرب',  icon: '🌇' },
  { key: 'isha',    en: "Isha'a",  ar: 'العشاء',  icon: '🌙' },
];

const CALC_METHODS = [
  { key: 'MuslimWorldLeague', label: 'Muslim World League' },
  { key: 'NorthAmerica',      label: 'ISNA (North America)' },
  { key: 'Egyptian',          label: 'Egyptian General Authority' },
  { key: 'UmmAlQura',         label: 'Makkah (Umm al-Qura)' },
  { key: 'Karachi',           label: 'Hanafi (Karachi)' },
];

const AZAN_STYLES = [
  { key: 'makkah',  label: 'Makkah',  url: 'https://cdn.islamic.network/adhan/audio/adhan-makkah.mp3' },
  { key: 'madinah', label: 'Madinah', url: 'https://cdn.islamic.network/adhan/audio/adhan-madinah.mp3' },
  { key: 'short',   label: 'Short',   url: 'https://cdn.islamic.network/adhan/audio/adhan-short.mp3' },
];

const SK = {
  coords:       'pt_coords',
  calcMethod:   'pt_calc_method',
  notifEnabled: 'pt_notif_enabled',
  azanEnabled:  'pt_azan_enabled',
  azanStyle:    'pt_azan_style',
  notifIds:     'pt_notif_ids',
};

// ── Notification handler (module level) ───────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function buildPrayerTimes(lat: number, lon: number, method: string, date: Date): AdhanPrayerTimes {
  const coords = new Coordinates(lat, lon);
  const methodMap: Record<string, () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>> = {
    MuslimWorldLeague: () => CalculationMethod.MuslimWorldLeague(),
    NorthAmerica:      () => CalculationMethod.NorthAmerica(),
    Egyptian:          () => CalculationMethod.Egyptian(),
    UmmAlQura:         () => CalculationMethod.UmmAlQura(),
    Karachi:           () => CalculationMethod.Karachi(),
  };
  const params = (methodMap[method] ?? methodMap.MuslimWorldLeague)();
  return new AdhanPrayerTimes(coords, date, params);
}

function getPrayerDates(pt: AdhanPrayerTimes): Record<string, Date> {
  return {
    fajr: pt.fajr, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PrayerTimesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [city, setCity] = useState('');
  const [prayerDates, setPrayerDates] = useState<Record<string, Date> | null>(null);
  const [currentPrayer, setCurrentPrayer] = useState('');
  const [nextPrayer, setNextPrayer] = useState('');
  const [calcMethod, setCalcMethod] = useState('MuslimWorldLeague');
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [notifEnabled, setNotifEnabled] = useState<Record<string, boolean>>({});
  const [azanEnabled, setAzanEnabled] = useState<Record<string, boolean>>({});
  const [azanStyle, setAzanStyle] = useState('makkah');
  const [notifIds, setNotifIds] = useState<Record<string, string>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [nowTime, setNowTime] = useState(new Date());
  const [playingAzan, setPlayingAzan] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // ── Load saved prefs ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [savedCoords, savedMethod, savedNotif, savedAzan, savedAzanStyle, savedNotifIds] =
          await Promise.all([
            AsyncStorage.getItem(SK.coords),
            AsyncStorage.getItem(SK.calcMethod),
            AsyncStorage.getItem(SK.notifEnabled),
            AsyncStorage.getItem(SK.azanEnabled),
            AsyncStorage.getItem(SK.azanStyle),
            AsyncStorage.getItem(SK.notifIds),
          ]);
        if (savedMethod)      setCalcMethod(savedMethod);
        if (savedNotif)       setNotifEnabled(JSON.parse(savedNotif));
        if (savedAzan)        setAzanEnabled(JSON.parse(savedAzan));
        if (savedAzanStyle)   setAzanStyle(savedAzanStyle);
        if (savedNotifIds)    setNotifIds(JSON.parse(savedNotifIds));
        if (savedCoords) {
          const c = JSON.parse(savedCoords);
          setCoords({ lat: c.lat, lon: c.lon });
          setCity(c.city || '');
        }
      } catch {}
    })();
  }, []);

  // ── Request location ─────────────────────────────────────────────────────
  const requestLocation = useCallback(async () => {
    setLoading(true);
    setLocationError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied. Enter location manually below.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      let cityName = '';
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        cityName = [geo.city, geo.country].filter(Boolean).join(', ');
      } catch {}
      setCoords({ lat, lon });
      setCity(cityName);
      const toSave = { lat, lon, city: cityName };
      await AsyncStorage.setItem(SK.coords, JSON.stringify(toSave));
    } catch (e) {
      setLocationError('Could not get location. Enter manually below.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial location fetch ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(SK.coords);
      if (!saved) {
        await requestLocation();
      } else {
        setLoading(false);
      }
    })();
  }, [requestLocation]);

  // ── Calculate prayer times whenever coords or method change ──────────────
  useEffect(() => {
    if (!coords) return;
    try {
      const pt = buildPrayerTimes(coords.lat, coords.lon, calcMethod, new Date());
      setPrayerDates(getPrayerDates(pt));
      setCurrentPrayer(pt.currentPrayer() as string);
      setNextPrayer(pt.nextPrayer() as string);
    } catch {}
  }, [coords, calcMethod]);

  // ── Tick every minute to update current/next prayer ──────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(new Date());
      if (!coords) return;
      try {
        const pt = buildPrayerTimes(coords.lat, coords.lon, calcMethod, new Date());
        setCurrentPrayer(pt.currentPrayer() as string);
        setNextPrayer(pt.nextPrayer() as string);
      } catch {}
    }, 60000);
    return () => clearInterval(timer);
  }, [coords, calcMethod]);

  // ── Cleanup audio on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  // ── Handle foreground azan when notification arrives ──────────────────────
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(async (notif) => {
      const data = notif.request.content.data as { prayer?: string; azan?: boolean; style?: string };
      if (data?.azan && data?.style) {
        await playAzanAudio(data.style as string);
      }
    });
    return () => sub.remove();
  }, []);

  // ── Notification toggling ─────────────────────────────────────────────────
  const scheduleNotif = useCallback(async (prayer: typeof PRAYERS[0], time: Date, withAzan: boolean) => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissions', 'Notification permissions are required.');
        return null;
      }
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `🕌 ${prayer.en} — ${prayer.ar}`,
          body: `Time for ${prayer.en} prayer (${formatTime(time)})`,
          sound: true,
          data: { prayer: prayer.key, azan: withAzan, style: azanStyle },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: time.getHours(),
          minute: time.getMinutes(),
        },
      });
      return id;
    } catch {
      return null;
    }
  }, [azanStyle]);

  const toggleNotif = useCallback(async (prayerKey: string) => {
    if (!prayerDates) return;
    const prayer = PRAYERS.find(p => p.key === prayerKey)!;
    const time = prayerDates[prayerKey];
    const isOn = !notifEnabled[prayerKey];

    const updated = { ...notifEnabled, [prayerKey]: isOn };
    setNotifEnabled(updated);
    await AsyncStorage.setItem(SK.notifEnabled, JSON.stringify(updated));

    const updatedIds = { ...notifIds };
    if (isOn) {
      if (updatedIds[prayerKey]) {
        await Notifications.cancelScheduledNotificationAsync(updatedIds[prayerKey]).catch(() => {});
      }
      const id = await scheduleNotif(prayer, time, !!azanEnabled[prayerKey]);
      if (id) updatedIds[prayerKey] = id;
    } else {
      if (updatedIds[prayerKey]) {
        await Notifications.cancelScheduledNotificationAsync(updatedIds[prayerKey]).catch(() => {});
        delete updatedIds[prayerKey];
      }
    }
    setNotifIds(updatedIds);
    await AsyncStorage.setItem(SK.notifIds, JSON.stringify(updatedIds));
  }, [notifEnabled, azanEnabled, notifIds, prayerDates, scheduleNotif]);

  const toggleAzan = useCallback(async (prayerKey: string) => {
    if (!prayerDates) return;
    const prayer = PRAYERS.find(p => p.key === prayerKey)!;
    const time = prayerDates[prayerKey];
    const isOn = !azanEnabled[prayerKey];

    const updated = { ...azanEnabled, [prayerKey]: isOn };
    setAzanEnabled(updated);
    await AsyncStorage.setItem(SK.azanEnabled, JSON.stringify(updated));

    // Re-schedule notification with updated azan flag if notif is on
    if (notifEnabled[prayerKey] && prayerDates) {
      const updatedIds = { ...notifIds };
      if (updatedIds[prayerKey]) {
        await Notifications.cancelScheduledNotificationAsync(updatedIds[prayerKey]).catch(() => {});
      }
      const id = await scheduleNotif(prayer, time, isOn);
      if (id) {
        updatedIds[prayerKey] = id;
        setNotifIds(updatedIds);
        await AsyncStorage.setItem(SK.notifIds, JSON.stringify(updatedIds));
      }
    }
  }, [azanEnabled, notifEnabled, notifIds, prayerDates, scheduleNotif]);

  // ── Azan audio ────────────────────────────────────────────────────────────
  const playAzanAudio = async (style: string) => {
    const styleObj = AZAN_STYLES.find(s => s.key === style) ?? AZAN_STYLES[0];
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
      });
      const { sound, status } = await Audio.Sound.createAsync(
        { uri: styleObj.url },
        { shouldPlay: true, volume: 1.0, progressUpdateIntervalMillis: 500 },
      );
      if (!('isLoaded' in status) || !status.isLoaded) {
        setPlayingAzan(false);
        return;
      }
      soundRef.current = sound;
      setPlayingAzan(true);
      sound.setOnPlaybackStatusUpdate((s) => {
        if ('didJustFinish' in s && s.didJustFinish) {
          setPlayingAzan(false);
          sound.unloadAsync().catch(() => {});
          if (soundRef.current === sound) soundRef.current = null;
        }
        if ('error' in s) {
          setPlayingAzan(false);
          if (soundRef.current === sound) soundRef.current = null;
        }
      });
    } catch {
      setPlayingAzan(false);
    }
  };

  const stopAzan = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setPlayingAzan(false);
  };

  // ── Manual location ───────────────────────────────────────────────────────
  const applyManualLocation = async () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      Alert.alert('Invalid', 'Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    setCoords({ lat, lon });
    setCity(manualCity || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    await AsyncStorage.setItem(SK.coords, JSON.stringify({ lat, lon, city: manualCity }));
    setLocationError('');
  };

  // ── Change calculation method ─────────────────────────────────────────────
  const changeCalcMethod = async (method: string) => {
    setCalcMethod(method);
    await AsyncStorage.setItem(SK.calcMethod, method);
    // Re-schedule all active notifications with updated times
    if (coords) {
      const pt = buildPrayerTimes(coords.lat, coords.lon, method, new Date());
      const dates = getPrayerDates(pt);
      const updatedIds = { ...notifIds };
      for (const prayer of PRAYERS) {
        if (notifEnabled[prayer.key] && updatedIds[prayer.key]) {
          await Notifications.cancelScheduledNotificationAsync(updatedIds[prayer.key]).catch(() => {});
          const id = await scheduleNotif(prayer, dates[prayer.key], !!azanEnabled[prayer.key]);
          if (id) updatedIds[prayer.key] = id;
        }
      }
      setNotifIds(updatedIds);
      await AsyncStorage.setItem(SK.notifIds, JSON.stringify(updatedIds));
    }
  };

  // ── Change azan style ─────────────────────────────────────────────────────
  const changeAzanStyle = async (style: string) => {
    setAzanStyle(style);
    await AsyncStorage.setItem(SK.azanStyle, style);
    // Re-schedule notifications that have azan enabled
    if (coords && prayerDates) {
      const updatedIds = { ...notifIds };
      for (const prayer of PRAYERS) {
        if (notifEnabled[prayer.key] && azanEnabled[prayer.key] && updatedIds[prayer.key]) {
          await Notifications.cancelScheduledNotificationAsync(updatedIds[prayer.key]).catch(() => {});
          const id = await scheduleNotif(prayer, prayerDates[prayer.key], true);
          if (id) updatedIds[prayer.key] = id;
        }
      }
      setNotifIds(updatedIds);
      await AsyncStorage.setItem(SK.notifIds, JSON.stringify(updatedIds));
    }
  };

  // ── Settings toggle ───────────────────────────────────────────────────────
  const handleSettingsToggle = () => {
    setShowSettings(s => !s);
    if (!showSettings) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a1a15', '#0d2818', '#132e1f']} style={StyleSheet.absoluteFill} />

      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>‹ Back</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>🕌 Prayer Times</Text>
            <Text style={styles.headerSub}>أوقات الصلاة</Text>
          </View>
          <Pressable onPress={handleSettingsToggle} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>⚙️</Text>
          </Pressable>
        </View>

        {/* ── Location Bar ──────────────────────────────────────────────── */}
        <View style={styles.locationBar}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationIcon}>📍</Text>
            <View>
              <Text style={styles.locationCity} numberOfLines={1}>
                {loading ? 'Detecting location…' : city || (coords ? `${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}` : 'No location set')}
              </Text>
              <Text style={styles.locationDate}>{todayLabel}</Text>
            </View>
          </View>
          <Pressable onPress={requestLocation} style={styles.refreshBtn}>
            {loading ? <ActivityIndicator size="small" color={GOLD} /> : <Text style={styles.refreshBtnText}>↻</Text>}
          </Pressable>
        </View>

        {locationError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {locationError}</Text>
          </View>
        ) : null}

        {/* ── Prayer Cards ──────────────────────────────────────────────── */}
        {loading && !prayerDates ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GOLD} />
            <Text style={styles.loadingText}>Calculating prayer times…</Text>
          </View>
        ) : prayerDates ? (
          <View style={styles.prayerList}>
            {PRAYERS.map((prayer) => {
              const time = prayerDates[prayer.key];
              const isCurrent = currentPrayer === prayer.key;
              const isNext = nextPrayer === prayer.key && !isCurrent;
              const notif = !!notifEnabled[prayer.key];
              const azan = !!azanEnabled[prayer.key];

              return (
                <View key={prayer.key} style={[styles.prayerCard, isCurrent && styles.prayerCardCurrent, isNext && styles.prayerCardNext]}>
                  <View style={styles.prayerRow}>
                    {/* Icon + name */}
                    <View style={[styles.prayerIconWrap, isCurrent && styles.prayerIconWrapCurrent]}>
                      <Text style={styles.prayerIcon}>{prayer.icon}</Text>
                    </View>
                    <View style={styles.prayerNameWrap}>
                      <Text style={[styles.prayerNameEn, isCurrent && styles.prayerNameActive]}>{prayer.en}</Text>
                      <Text style={[styles.prayerNameAr, isCurrent && styles.prayerNameActive]}>{prayer.ar}</Text>
                    </View>

                    {/* Badge */}
                    <View style={styles.prayerBadgeWrap}>
                      {isCurrent && <View style={styles.badgeCurrent}><Text style={styles.badgeCurrentText}>NOW</Text></View>}
                      {isNext   && <View style={styles.badgeNext}><Text style={styles.badgeNextText}>NEXT</Text></View>}
                    </View>

                    {/* Time */}
                    <Text style={[styles.prayerTime, isCurrent && styles.prayerTimeActive]}>
                      {time ? formatTime(time) : '—'}
                    </Text>
                  </View>

                  {/* Toggle row */}
                  <View style={styles.toggleRow}>
                    {/* Notification */}
                    <View style={styles.toggleItem}>
                      <Text style={styles.toggleLabel}>🔔 Notify</Text>
                      <Switch
                        value={notif}
                        onValueChange={() => toggleNotif(prayer.key)}
                        trackColor={{ false: '#2a3a2a', true: 'rgba(196,164,106,0.4)' }}
                        thumbColor={notif ? GOLD : '#4a5a4a'}
                        ios_backgroundColor="#2a3a2a"
                      />
                    </View>
                    {/* Azan */}
                    <View style={styles.toggleItem}>
                      <Text style={styles.toggleLabel}>📻 Azan</Text>
                      <Switch
                        value={azan}
                        onValueChange={() => toggleAzan(prayer.key)}
                        trackColor={{ false: '#2a3a2a', true: 'rgba(196,164,106,0.4)' }}
                        thumbColor={azan ? GOLD : '#4a5a4a'}
                        ios_backgroundColor="#2a3a2a"
                      />
                    </View>
                    {/* Preview button */}
                    {azan && (
                      <Pressable
                        onPress={() => playingAzan ? stopAzan() : playAzanAudio(azanStyle)}
                        style={[styles.previewBtn, playingAzan && styles.previewBtnActive]}
                      >
                        <Text style={styles.previewBtnText}>{playingAzan ? '⏹ Stop' : '▶ Preview'}</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : coords ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Could not calculate prayer times.</Text>
          </View>
        ) : null}

        {/* ── No location placeholder ───────────────────────────────────── */}
        {!loading && !coords && (
          <View style={styles.noLocationCard}>
            <Text style={styles.noLocationIcon}>📍</Text>
            <Text style={styles.noLocationTitle}>Location Required</Text>
            <Text style={styles.noLocationSub}>Grant location access or enter your coordinates manually in Settings below.</Text>
            <Pressable onPress={requestLocation} style={styles.gpsBtn}>
              <Text style={styles.gpsBtnText}>📡 Detect My Location</Text>
            </Pressable>
          </View>
        )}

        {/* ── Settings Section ──────────────────────────────────────────── */}
        <Pressable onPress={handleSettingsToggle} style={styles.settingsToggleBtn}>
          <Text style={styles.settingsToggleBtnText}>⚙️ Settings</Text>
          <Text style={styles.settingsToggleChev}>{showSettings ? '▲' : '▼'}</Text>
        </Pressable>

        {showSettings && (
          <View style={styles.settingsPanel}>

            {/* Calculation Method */}
            <Text style={styles.settingsSectionTitle}>Calculation Method</Text>
            {CALC_METHODS.map(m => (
              <Pressable
                key={m.key}
                onPress={() => changeCalcMethod(m.key)}
                style={[styles.methodRow, calcMethod === m.key && styles.methodRowActive]}
              >
                <View style={[styles.methodRadio, calcMethod === m.key && styles.methodRadioActive]}>
                  {calcMethod === m.key && <View style={styles.methodRadioDot} />}
                </View>
                <Text style={[styles.methodLabel, calcMethod === m.key && styles.methodLabelActive]}>{m.label}</Text>
              </Pressable>
            ))}

            {/* Azan Style */}
            <Text style={[styles.settingsSectionTitle, { marginTop: 20 }]}>Azan Style</Text>
            <Text style={styles.settingsSectionSub}>Applied to all prayers when Azan is enabled</Text>
            <View style={styles.azanStyleRow}>
              {AZAN_STYLES.map(s => (
                <Pressable
                  key={s.key}
                  onPress={() => changeAzanStyle(s.key)}
                  style={[styles.azanStyleChip, azanStyle === s.key && styles.azanStyleChipActive]}
                >
                  <Text style={[styles.azanStyleLabel, azanStyle === s.key && styles.azanStyleLabelActive]}>{s.label}</Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => playingAzan ? stopAzan() : playAzanAudio(azanStyle)}
                style={styles.azanPreviewBtn}
              >
                <Text style={styles.azanPreviewBtnText}>{playingAzan ? '⏹' : '▶'}</Text>
              </Pressable>
            </View>

            {/* Manual Location */}
            <Text style={[styles.settingsSectionTitle, { marginTop: 20 }]}>Manual Location</Text>
            <Text style={styles.settingsSectionSub}>Override GPS with exact coordinates</Text>
            <TextInput
              style={styles.input}
              placeholder="City name (optional)"
              placeholderTextColor={DIM}
              value={manualCity}
              onChangeText={setManualCity}
            />
            <View style={styles.coordRow}>
              <TextInput
                style={[styles.input, styles.coordInput]}
                placeholder="Latitude (e.g. 21.4225)"
                placeholderTextColor={DIM}
                value={manualLat}
                onChangeText={setManualLat}
                keyboardType="decimal-pad"
              />
              <TextInput
                style={[styles.input, styles.coordInput]}
                placeholder="Longitude (e.g. 39.8261)"
                placeholderTextColor={DIM}
                value={manualLon}
                onChangeText={setManualLon}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.manualBtnRow}>
              <Pressable onPress={applyManualLocation} style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>Apply Location</Text>
              </Pressable>
              <Pressable onPress={requestLocation} style={styles.gpsSmallBtn}>
                <Text style={styles.gpsSmallBtnText}>📡 Use GPS</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },
  scroll: { paddingBottom: 40 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  headerBtn: { paddingVertical: 6, paddingHorizontal: 4, minWidth: 60 },
  headerBtnText: { color: GOLD, fontSize: 14, fontWeight: '500' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { color: GOLD, fontSize: 18, fontWeight: '700' },
  headerSub: { color: MUTED, fontSize: 10, marginTop: 1 },

  locationBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginBottom: 8, padding: 12,
    backgroundColor: BG_CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
  },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  locationIcon: { fontSize: 18 },
  locationCity: { color: '#e0d8c8', fontSize: 13, fontWeight: '600', maxWidth: 220 },
  locationDate: { color: MUTED, fontSize: 10, marginTop: 1 },
  refreshBtn: { padding: 6, width: 36, alignItems: 'center' },
  refreshBtnText: { color: GOLD, fontSize: 20, fontWeight: '300' },

  errorBanner: {
    marginHorizontal: 16, marginBottom: 8, padding: 10,
    backgroundColor: 'rgba(196,97,74,0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(196,97,74,0.3)',
  },
  errorText: { color: '#e09080', fontSize: 11 },

  loadingContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  loadingText: { color: MUTED, fontSize: 13 },

  prayerList: { paddingHorizontal: 16, gap: 10 },

  prayerCard: {
    borderRadius: 16, borderWidth: 1, borderColor: BORDER,
    backgroundColor: BG_CARD, overflow: 'hidden',
  },
  prayerCardCurrent: {
    borderColor: 'rgba(196,164,106,0.5)',
    backgroundColor: 'rgba(196,164,106,0.08)',
  },
  prayerCardNext: {
    borderColor: 'rgba(196,164,106,0.25)',
  },

  prayerRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 10,
  },
  prayerIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(196,164,106,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  prayerIconWrapCurrent: { backgroundColor: 'rgba(196,164,106,0.2)' },
  prayerIcon: { fontSize: 20 },
  prayerNameWrap: { flex: 1 },
  prayerNameEn: { color: '#d0c8b8', fontSize: 14, fontWeight: '600' },
  prayerNameAr: { color: MUTED, fontSize: 11, marginTop: 1 },
  prayerNameActive: { color: GOLD },

  prayerBadgeWrap: { alignItems: 'flex-end', minWidth: 44 },
  badgeCurrent: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, backgroundColor: GOLD },
  badgeCurrentText: { color: '#0a1a15', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  badgeNext: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8, backgroundColor: 'rgba(196,164,106,0.15)', borderWidth: 1, borderColor: BORDER },
  badgeNextText: { color: GOLD, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  prayerTime: { color: '#c8d8c0', fontSize: 16, fontWeight: '700', minWidth: 72, textAlign: 'right' },
  prayerTimeActive: { color: GOLD },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 8, flexWrap: 'wrap',
  },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  toggleLabel: { color: MUTED, fontSize: 11 },
  previewBtn: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: 'rgba(196,164,106,0.1)', borderWidth: 1, borderColor: BORDER, marginLeft: 'auto',
  },
  previewBtnActive: { backgroundColor: 'rgba(196,164,106,0.2)', borderColor: GOLD },
  previewBtnText: { color: GOLD, fontSize: 10, fontWeight: '600' },

  noLocationCard: {
    margin: 16, padding: 24, backgroundColor: BG_CARD,
    borderRadius: 16, borderWidth: 1, borderColor: BORDER, alignItems: 'center', gap: 10,
  },
  noLocationIcon: { fontSize: 40 },
  noLocationTitle: { color: GOLD, fontSize: 16, fontWeight: '700' },
  noLocationSub: { color: MUTED, fontSize: 12, textAlign: 'center', lineHeight: 18 },
  gpsBtn: {
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12,
    backgroundColor: 'rgba(196,164,106,0.12)', borderWidth: 1, borderColor: GOLD, marginTop: 4,
  },
  gpsBtnText: { color: GOLD, fontSize: 13, fontWeight: '600' },

  settingsToggleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 16, padding: 14,
    backgroundColor: BG_CARD, borderRadius: 12, borderWidth: 1, borderColor: BORDER,
  },
  settingsToggleBtnText: { color: GOLD, fontSize: 13, fontWeight: '600' },
  settingsToggleChev: { color: MUTED, fontSize: 11 },

  settingsPanel: {
    marginHorizontal: 16, marginTop: 8, padding: 16,
    backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER,
  },
  settingsSectionTitle: { color: GOLD, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10 },
  settingsSectionSub: { color: MUTED, fontSize: 10, marginBottom: 10, marginTop: -6 },

  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 9,
    paddingHorizontal: 10, borderRadius: 10, marginBottom: 4,
  },
  methodRowActive: { backgroundColor: 'rgba(196,164,106,0.08)' },
  methodRadio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: DIM,
    alignItems: 'center', justifyContent: 'center',
  },
  methodRadioActive: { borderColor: GOLD },
  methodRadioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: GOLD },
  methodLabel: { color: MUTED, fontSize: 12, flex: 1 },
  methodLabelActive: { color: '#e0d0b0', fontWeight: '600' },

  azanStyleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  azanStyleChip: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(196,164,106,0.03)',
  },
  azanStyleChipActive: { borderColor: GOLD, backgroundColor: 'rgba(196,164,106,0.14)' },
  azanStyleLabel: { color: MUTED, fontSize: 12, fontWeight: '500' },
  azanStyleLabelActive: { color: GOLD },
  azanPreviewBtn: {
    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER, backgroundColor: 'rgba(196,164,106,0.06)',
  },
  azanPreviewBtnText: { color: GOLD, fontSize: 12, fontWeight: '600' },

  input: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: BORDER,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
    color: '#e0d8c8', fontSize: 12, marginBottom: 8,
  },
  coordRow: { flexDirection: 'row', gap: 8 },
  coordInput: { flex: 1 },
  manualBtnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  applyBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    backgroundColor: 'rgba(196,164,106,0.12)', borderWidth: 1, borderColor: GOLD,
  },
  applyBtnText: { color: GOLD, fontSize: 12, fontWeight: '600' },
  gpsSmallBtn: {
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: BORDER,
  },
  gpsSmallBtnText: { color: MUTED, fontSize: 12 },
});
