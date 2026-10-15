import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Pressable, useColorScheme, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton
              icon={{
                ios: 'house',
                android: 'home',
                web: 'home',
              }}>
              Today
            </TabButton>
          </TabTrigger>
          <TabTrigger name="tasks" href={'/tasks' as any} asChild>
            <TabButton
              icon={{
                ios: 'checklist',
                android: 'checklist',
                web: 'checklist',
              }}>
              Tasks
            </TabButton>
          </TabTrigger>
          <TabTrigger name="meetings" href={'/meetings' as any} asChild>
            <TabButton
              icon={{
                ios: 'calendar',
                android: 'calendar_today',
                web: 'calendar_today',
              }}>
              Meetings
            </TabButton>
          </TabTrigger>
          <TabTrigger name="progress" href={'/progress' as any} asChild>
            <TabButton
              icon={{
                ios: 'chart.bar',
                android: 'bar_chart',
                web: 'bar_chart',
              }}>
              Progress
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

interface CustomTabButtonProps extends TabTriggerSlotProps {
  icon?: SymbolViewProps['name'];
}

export function TabButton({
  children,
  isFocused,
  icon,
  ...props
}: CustomTabButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Pressable {...props} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
        style={[
          styles.tabButtonView,
          isFocused && { borderColor: colors.primary, borderWidth: 1 },
        ]}>
        {icon && (
          <SymbolView
            name={icon}
            size={14}
            tintColor={isFocused ? colors.primary : colors.textSecondary}
          />
        )}
        <ThemedText
          type="smallBold"
          style={{
            color: isFocused ? colors.primary : colors.textSecondary,
          }}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <View style={styles.brandRow}>
          <View style={[styles.brandDot, { backgroundColor: colors.primary }]} />
          <ThemedText type="smallBold" style={styles.brandText}>
            BardoFlow
          </ThemedText>
        </View>

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 'auto',
    gap: 6,
  },
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  brandText: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
