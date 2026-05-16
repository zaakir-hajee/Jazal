import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';

// ── Theme ─────────────────────────────────────────────────────────────────────
const GOLD = '#c4a46a';
const MUTED = '#6a7a6a';
const DIM = '#4a5a4a';
const BG_CARD = 'rgba(196,164,106,0.05)';
const BORDER = 'rgba(196,164,106,0.12)';
const BG_DARK = '#0a1a15';

// ── Constants ─────────────────────────────────────────────────────────────────
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;
const DISC = 280;
const R = DISC / 2; // 140

const CARDINALS = [
  { label: 'N', angle: 0   },
  { label: 'E', angle: 90  },
  { label: 'S', angle: 180 },
  { label: 'W', angle: 270 },
];

const DEGREE_LABELS = [0, 45, 90, 135, 180, 225, 270, 315];

// ── Qibla bearing formula (great-circle) ─────────────────────────────────────
function calcQibla(lat: number, lon: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LON - lon) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

// ── Tick mark helper ──────────────────────────────────────────────────────────
function Tick({ angleDeg }: { angleDeg: number }) {
  const isMajor = angleDeg % 90 === 0;
  const isMid   = angleDeg % 45 === 0 && !isMajor;
  const len  = isMajor ? 12 : isMid ? 8 : 5;
  const wide = isMajor ? 2  : 1;
  const rad  = (angleDeg * Math.PI) / 180;
  // Centre the tick at midR from disc centre
  const outerR = R - 4;
  const midR   = outerR - len / 2;
  const cx = R + midR * Math.sin(rad);
  const cy = R - midR * Math.cos(rad);

  return (
    <View style={{
      position: 'absolute',
      left:  cx - wide / 2,
      top:   cy - len / 2,
      width: wide,
      height: len,
      borderRadius: 1,
      backgroundColor: isMajor ? GOLD : isMid ? 'rgba(196,164,106,0.45)' : DIM,
      transform: [{ rotate: `${angleDeg}deg` }],
    }} />
  );
}

// ── Qibla arrow ───────────────────────────────────────────────────────────────
// Square container centred on disc-centre; arrow content sits in the upper half.
// Rotating the container by qiblaAngle (around its own centre = disc centre)
// makes the arrow tip point toward Makkah.
const ARROW_R = R - 42; // distance from centre to tip

function QiblaArrow({ angle }: { angle: number }) {
  const SHAFT_H = ARROW_R - 28; // shaft below the arrowhead
  return (
    <View
      style={{
        position: 'absolute',
        left: R - ARROW_R,
        top:  R - ARROW_R,
        width:  ARROW_R * 2,
        height: ARROW_R * 2,
        alignItems: 'center',
        justifyContent: 'flex-start',
        transform: [{ rotate: `${angle}deg` }],
      }}
      pointerEvents="none"
    >
      {/* Kaaba at the tip */}
      <Text style={{ fontSize: 18, lineHeight: 22, marginTop: 0 }}>🕋</Text>
      {/* Arrowhead (triangle) */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 7, borderRightWidth: 7, borderBottomWidth: 12,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: GOLD,
        marginTop: 1,
      }} />
      {/* Shaft */}
      <View style={{ width: 3, height: SHAFT_H, backgroundColor: GOLD, borderRadius: 2, marginTop: 2 }} />
    </View>
  );
}

// ── Compass disc ──────────────────────────────────────────────────────────────
function CompassDisc({ qiblaAngle }: { qiblaAngle: number }) {
  return (
    <View style={dsc.outer}>
      {/* Decorative inner ring */}
      <View style={dsc.inner} />

      {/* 72 tick marks, every 5° */}
      {Array.from({ length: 72 }, (_, i) => (
        <Tick key={i} angleDeg={i * 5} />
      ))}

      {/* Cardinal labels */}
      {CARDINALS.map(({ label, angle }) => {
        const rad = (angle * Math.PI) / 180;
        const lr  = R - 30;
        return (
          <Text
            key={label}
            style={[dsc.cardinal, {
              left:  R + lr * Math.sin(rad) - 10,
              top:   R - lr * Math.cos(rad) - 11,
              color: label === 'N' ? '#e05050' : '#d8d0c0',
              fontWeight: label === 'N' ? '800' : '600',
            }]}
          >
            {label}
          </Text>
        );
      })}

      {/* Degree numbers at 45° increments (skip cardinals) */}
      {DEGREE_LABELS.filter(d => d % 90 !== 0).map(deg => {
        const rad = (deg * Math.PI) / 180;
        const dr  = R - 22;
        return (
          <Text
            key={deg}
            style={[dsc.degLabel, {
              left: R + dr * Math.sin(rad) - 12,
              top:  R - dr * Math.cos(rad) - 8,
            }]}
          >
            {deg}
          </Text>
        );
      })}

      {/* Gold Qibla arrow */}
      <QiblaArrow angle={qiblaAngle} />

      {/* Centre dot */}
      <View style={dsc.dot} />
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function QiblaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [city, setCity] = useState('');
  const [locLoading, setLocLoading] = useState(true);
  const [locError, setLocError] = useState('');
  const [qibla, setQibla] = useState<number | null>(null);

  // Sensor
  const [hasSensor, setHasSensor] = useState<boolean | null>(null);
  const [sensorMsg, setSensorMsg] = useState('');

  // Animated heading (accumulates to avoid 360→0 spin)
  const rotAnim  = useRef(new Animated.Value(0)).current;
  const prevRot  = useRef(0);

  // ── Location ───────────────────────────────────────────────────────────────
  const fetchLocation = useCallback(async () => {
    setLocLoading(true);
    setLocError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocError('Location permission denied.');
        setLocLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      setCoords({ lat, lon });
      setQibla(calcQibla(lat, lon));
      try {
        const [geo] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        setCity([geo.city, geo.country].filter(Boolean).join(', '));
      } catch {}
    } catch {
      setLocError('Could not get location. Check permissions.');
    } finally {
      setLocLoading(false);
    }
  }, []);

  useEffect(() => { fetchLocation(); }, [fetchLocation]);

  // ── Magnetometer ───────────────────────────────────────────────────────────
  useEffect(() => {
    let sub: ReturnType<typeof Magnetometer.addListener> | null = null;

    (async () => {
      const ok = await Magnetometer.isAvailableAsync().catch(() => false);
      if (!ok) {
        setHasSensor(false);
        setSensorMsg('No magnetometer — showing calculated direction only');
        return;
      }
      setHasSensor(true);
      Magnetometer.setUpdateInterval(100);

      sub = Magnetometer.addListener(({ x, y }) => {
        // Heading of device top from magnetic North (clockwise, 0–360°)
        // x = East component, y = North component (flat horizontal device)
        let raw = (Math.atan2(x, y) * 180) / Math.PI;
        raw = (raw + 360) % 360;

        // Rotate disc by -heading so geographic North stays "up" on screen.
        // Accumulate to take the shortest arc path (avoid 358→2 full spin).
        let target = -raw;
        let diff   = target - prevRot.current;
        if (diff >  180) diff -= 360;
        if (diff < -180) diff += 360;
        target = prevRot.current + diff;
        prevRot.current = target;

        Animated.spring(rotAnim, {
          toValue: target,
          useNativeDriver: true,
          friction: 9,
          tension: 45,
        }).start();
      });
    })();

    return () => { sub?.remove(); };
  }, [rotAnim]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const compassSpin = rotAnim.interpolate({
    inputRange: [-3600, 3600],
    outputRange: ['-3600deg', '3600deg'],
  });
  const qiblaDeg = qibla !== null ? Math.round(qibla) : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <LinearGradient colors={['#0a1a15', '#0d2818', '#132e1f']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>‹ Back</Text>
        </Pressable>
        <View style={s.headerCenter}>
          <Text style={s.title}>🧭 Qibla</Text>
          <Text style={s.titleAr}>اتجاه القبلة</Text>
        </View>
        <View style={s.headerSpacer} />
      </View>

      {/* Body — vertically centred */}
      <View style={s.body}>

        {/* Location row */}
        <View style={s.locRow}>
          {locLoading ? (
            <>
              <ActivityIndicator size="small" color={GOLD} />
              <Text style={s.locText}>Detecting location…</Text>
            </>
          ) : locError ? (
            <>
              <Text style={s.errorText}>⚠️ {locError}</Text>
              <Pressable onPress={fetchLocation} style={s.retryBtn}>
                <Text style={s.retryBtnText}>Retry</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 14 }}>📍</Text>
              <Text style={s.locText}>{city || (coords ? `${coords.lat.toFixed(3)}, ${coords.lon.toFixed(3)}` : '—')}</Text>
            </>
          )}
        </View>

        {/* Angle card */}
        {qiblaDeg !== null && (
          <View style={s.angleCard}>
            <Text style={s.angleNum}>{qiblaDeg}°</Text>
            <Text style={s.angleLabel}>from North toward Makkah</Text>
          </View>
        )}

        {/* Sensor notice */}
        {sensorMsg ? (
          <View style={s.sensorNote}>
            <Text style={s.sensorNoteText}>📡 {sensorMsg}</Text>
          </View>
        ) : null}

        {/* Compass */}
        {coords && qibla !== null ? (
          <View style={{ alignItems: 'center' }}>
            {/* Fixed heading indicator — always points "up" (current device heading) */}
            <View style={s.headingIndicator} />
            {hasSensor === true ? (
              /* Live rotating disc */
              <Animated.View style={{ transform: [{ rotate: compassSpin }] }}>
                <CompassDisc qiblaAngle={qibla} />
              </Animated.View>
            ) : (
              /* Static disc (no sensor or still checking) */
              <CompassDisc qiblaAngle={qibla} />
            )}
          </View>
        ) : !locLoading ? (
          <View style={s.noLocWrap}>
            <Text style={s.noLocEmoji}>🧭</Text>
            <Text style={s.noLocText}>Location required to calculate the Qibla direction</Text>
            <Pressable onPress={fetchLocation} style={s.retryBtn}>
              <Text style={s.retryBtnText}>📡 Detect My Location</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ marginTop: 60 }}>
            <ActivityIndicator size="large" color={GOLD} />
          </View>
        )}

        {/* Hint */}
        {qiblaDeg !== null && coords && (
          <View style={s.hint}>
            <Text style={s.hintEmoji}>🕋</Text>
            <Text style={s.hintText}>
              {hasSensor
                ? 'Rotate your phone until the 🕋 arrow points to your Qibla direction'
                : `Face ${qiblaDeg}° from North toward Makkah`}
            </Text>
          </View>
        )}

      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG_DARK },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 8,
  },
  backBtn:      { paddingVertical: 6, paddingHorizontal: 4, minWidth: 60 },
  backBtnText:  { color: GOLD, fontSize: 14, fontWeight: '500' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSpacer: { minWidth: 60 },
  title:   { color: GOLD, fontSize: 18, fontWeight: '700' },
  titleAr: { color: MUTED, fontSize: 10, marginTop: 1 },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 18 },

  locRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locText:   { color: '#c8d8c0', fontSize: 13, fontWeight: '500' },
  errorText: { color: '#e09080', fontSize: 12 },
  retryBtn:  {
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: 'rgba(196,164,106,0.1)', borderWidth: 1, borderColor: BORDER,
  },
  retryBtnText: { color: GOLD, fontSize: 11, fontWeight: '600' },

  angleCard: {
    alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 32,
    backgroundColor: BG_CARD, borderRadius: 16, borderWidth: 1, borderColor: BORDER,
  },
  angleNum:   { color: GOLD, fontSize: 46, fontWeight: '800', letterSpacing: -1 },
  angleLabel: { color: MUTED, fontSize: 11, marginTop: 1 },

  sensorNote: {
    paddingVertical: 7, paddingHorizontal: 14,
    backgroundColor: 'rgba(196,164,106,0.05)', borderRadius: 10, borderWidth: 1, borderColor: BORDER,
  },
  sensorNoteText: { color: MUTED, fontSize: 11, textAlign: 'center' },

  noLocWrap: { alignItems: 'center', gap: 12 },
  noLocEmoji: { fontSize: 64 },
  noLocText:  { color: MUTED, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 260 },

  hint: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: BG_CARD, borderRadius: 14, borderWidth: 1, borderColor: BORDER,
    maxWidth: 320,
  },
  hintEmoji: { fontSize: 22 },
  hintText:  { color: MUTED, fontSize: 12, flex: 1, lineHeight: 18 },
  hintBold:  { color: GOLD, fontWeight: '700' },

  headingIndicator: {
    width: 0, height: 0,
    borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 0, borderBottomWidth: 16,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#e05050',
    marginBottom: 4,
  },
});

const dsc = StyleSheet.create({
  outer: {
    width: DISC, height: DISC, borderRadius: R,
    backgroundColor: 'rgba(8,22,16,0.97)',
    borderWidth: 2, borderColor: 'rgba(196,164,106,0.35)',
    position: 'relative', overflow: 'hidden',
  },
  inner: {
    position: 'absolute',
    left: 20, top: 20,
    width: DISC - 40, height: DISC - 40,
    borderRadius: (DISC - 40) / 2,
    borderWidth: 1, borderColor: 'rgba(196,164,106,0.12)',
  },
  cardinal: {
    position: 'absolute',
    fontSize: 14, width: 20, textAlign: 'center',
  },
  degLabel: {
    position: 'absolute',
    fontSize: 9, width: 24, textAlign: 'center',
    color: 'rgba(196,164,106,0.55)',
  },
  dot: {
    position: 'absolute',
    left: R - 5, top: R - 5,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: GOLD,
    zIndex: 20,
  },
});
