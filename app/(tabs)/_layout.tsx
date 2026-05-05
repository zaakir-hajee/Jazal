import { Tabs } from 'expo-router';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useLang } from '@/lib/lang';
import { TRANSLATIONS } from '@/constants/data';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { lang } = useLang();
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📿" label={t.navCounter} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="dua"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤲" label={t.navDua} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="hajj"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🕋" label={t.navHajj} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label={t.navStats} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" label={t.navRanking} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0a1a15',
    borderTopColor: 'rgba(196,164,106,0.12)',
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 82 : 62,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 6,
    paddingHorizontal: 0,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 52,
  },
  tabEmoji: {
    fontSize: 18,
    opacity: 0.4,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 9,
    color: '#5a6a5a',
    fontWeight: '400',
    maxWidth: 56,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#c4a46a',
    fontWeight: '600',
  },
});
