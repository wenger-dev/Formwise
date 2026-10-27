import React from 'react';
import { Tabs, router, usePathname } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Icon, IconName, Label, useWide } from '../../components/ui';
import { colors as c } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const destinations: {
  name: string;
  title: string;
  icon: IconName;
  path: '/' | '/workouts' | '/progress' | '/profile' | '/settings';
}[] = [
  { name: 'index', title: 'Overview', icon: 'grid', path: '/' },
  { name: 'workouts', title: 'Workouts', icon: 'activity', path: '/workouts' },
  { name: 'progress', title: 'Progress', icon: 'bar-chart-2', path: '/progress' },
  { name: 'profile', title: 'Profile', icon: 'user', path: '/profile' },
  { name: 'settings', title: 'Settings', icon: 'sliders', path: '/settings' },
];
export default function TabLayout() {
  const wide = useWide();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: c.bg }}>
      {wide && (
        <View
          style={{
            width: 216,
            padding: 24,
            paddingTop: 40,
            borderRightWidth: 1,
            borderRightColor: c.border,
            gap: 34,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
            <Icon name="aperture" color={c.lime} size={30} />
            <Label style={{ fontWeight: '800', fontSize: 24, letterSpacing: -1 }}>formwise</Label>
          </View>
          <View style={{ gap: 8 }}>
            {destinations.map((d) => (
              <Pressable
                key={d.name}
                accessibilityRole="tab"
                accessibilityState={{ selected: path === d.path }}
                onPress={() => router.navigate(d.path)}
                style={{
                  minHeight: 48,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: path === d.path ? c.lime : 'transparent',
                }}
              >
                <Icon name={d.icon} size={19} color={path === d.path ? c.bg : c.secondary} />
                <Label
                  style={{
                    color: path === d.path ? c.bg : c.secondary,
                    fontWeight: '600',
                    fontSize: 13,
                  }}
                >
                  {d.title}
                </Label>
              </Pressable>
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <View style={{ backgroundColor: c.surface, borderRadius: 20, padding: 18, gap: 10 }}>
            <Icon name="sun" color={c.lime} />
            <Label style={{ fontSize: 13, fontWeight: '600' }}>
              A little better,{'\n'}every day.
            </Label>
            <Label muted style={{ fontSize: 11 }}>
              Your pace. Your progress.
            </Label>
          </View>
          <Label style={{ color: c.muted, fontSize: 10 }}>LOCAL FIRST. ALWAYS YOURS.</Label>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: c.lime,
            tabBarInactiveTintColor: c.muted,
            tabBarStyle: wide
              ? { display: 'none' }
              : {
                  backgroundColor: c.surface,
                  borderTopColor: c.border,
                  height: 74 + insets.bottom,
                  paddingTop: 10,
                  paddingBottom: 12 + insets.bottom,
                },
            tabBarLabelStyle: { fontSize: 10, marginTop: 3 },
            sceneStyle: { backgroundColor: c.bg },
          }}
        >
          {destinations.map((d) => (
            <Tabs.Screen
              key={d.name}
              name={d.name}
              options={{
                title: d.name === 'index' ? 'Home' : d.title,
                tabBarIcon: ({ color }) => (
                  <Icon name={d.icon} color={typeof color === 'string' ? color : c.muted} />
                ),
              }}
            />
          ))}
        </Tabs>
      </View>
    </View>
  );
}
