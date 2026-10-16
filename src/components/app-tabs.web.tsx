import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import {
  Pressable,
  useColorScheme,
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDesktop = width >= 768;

  return (
    <Tabs style={styles.tabsRoot}>
      {/* Navigation Bar (Desktop: Top Sticky Header, Mobile: Bottom Docked Bar) */}
      <TabList asChild>
        <CustomTabList isDesktop={isDesktop} bottomInset={insets.bottom}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton
              isDesktop={isDesktop}
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
              isDesktop={isDesktop}
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
              isDesktop={isDesktop}
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
              isDesktop={isDesktop}
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

      <TabSlot style={styles.tabSlot} />
    </Tabs>
  );
}

interface CustomTabButtonProps extends TabTriggerSlotProps {
  icon?: SymbolViewProps['name'];
  isDesktop?: boolean;
}

export function TabButton({
  children,
  isFocused,
  icon,
  isDesktop: propIsDesktop,
  ...props
}: CustomTabButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { width } = useWindowDimensions();
  const isDesktop = propIsDesktop ?? width >= 768;

  if (isDesktop) {
    return (
      <Pressable
        {...props}
        style={({ pressed }) => [
          styles.desktopTabPressable,
          pressed && styles.pressed,
        ]}>
        <ThemedView
          type={isFocused ? 'backgroundSelected' : 'backgroundElement'}
          style={[
            styles.desktopTabButton,
            isFocused && {
              borderColor: colors.primary,
              backgroundColor:
                scheme === 'dark' ? 'rgba(3, 126, 243, 0.2)' : colors.primaryLight,
            },
          ]}>
          {icon && (
            <SymbolView
              name={icon}
              size={15}
              tintColor={isFocused ? colors.primary : colors.textSecondary}
            />
          )}
          <ThemedText
            type="smallBold"
            style={{
              color: isFocused ? colors.primary : colors.textSecondary,
              fontSize: 13,
            }}>
            {children}
          </ThemedText>
        </ThemedView>
      </Pressable>
    );
  }

  // Mobile Bottom Tab Item
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.mobileTabPressable,
        pressed && styles.pressed,
      ]}>
      <View style={styles.mobileTabContent}>
        {icon && (
          <SymbolView
            name={icon}
            size={20}
            tintColor={isFocused ? colors.primary : colors.textSecondary}
          />
        )}
        <ThemedText
          type="small"
          style={{
            color: isFocused ? colors.primary : colors.textSecondary,
            fontSize: 11,
            fontWeight: isFocused ? '700' : '500',
            marginTop: 2,
          }}>
          {children}
        </ThemedText>
        {isFocused && (
          <View style={[styles.activeIndicatorDot, { backgroundColor: colors.primary }]} />
        )}
      </View>
    </Pressable>
  );
}

interface CustomTabListProps extends TabListProps {
  isDesktop?: boolean;
  bottomInset?: number;
}

export function CustomTabList({
  isDesktop,
  bottomInset = 0,
  ...props
}: CustomTabListProps) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  if (isDesktop) {
    return (
      <View
        {...props}
        style={[
          styles.desktopHeaderBar,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}>
        <View style={styles.desktopInnerContainer}>
          {/* Brand logo & LC identification */}
          <View style={styles.brandGroup}>
            <View style={[styles.brandIconSquare, { backgroundColor: colors.primary }]}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontWeight: '900' }}>
                B
              </ThemedText>
            </View>
            <ThemedText type="smallBold" style={[styles.brandText, { color: colors.text }]}>
              BardoFlow
            </ThemedText>
            <View
              style={[
                styles.lcBadge,
                {
                  backgroundColor: isDark ? 'rgba(3, 126, 243, 0.18)' : '#EBF5FF',
                  borderColor: isDark ? 'rgba(3, 126, 243, 0.35)' : '#BAE0FD',
                },
              ]}>
              <View style={styles.liveDot} />
              <ThemedText
                type="smallBold"
                style={[styles.lcBadgeText, { color: colors.primary }]}>
                LC Bardo
              </ThemedText>
            </View>
          </View>

          {/* Nav Tab Triggers */}
          <View style={styles.desktopTabsRow}>{props.children}</View>
        </View>
      </View>
    );
  }

  // Mobile Bottom Bar
  return (
    <View
      {...props}
      style={[
        styles.mobileBottomBar,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(bottomInset, 8),
        },
      ]}>
      <View style={styles.mobileTabsRow}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsRoot: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  tabSlot: {
    flex: 1,
    width: '100%',
    minHeight: 0,
  },
  // Desktop Top Navigation Header
  desktopHeaderBar: {
    width: '100%',
    borderBottomWidth: 1,
    zIndex: 100,
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        top: 0,
      },
    }),
  },
  desktopInnerContainer: {
    maxWidth: 1120,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconSquare: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  lcBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  lcBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  desktopTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  desktopTabPressable: {
    cursor: 'pointer' as any,
  },
  desktopTabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        transition: 'all 0.15s ease' as any,
      },
    }),
  },
  // Mobile Bottom Navigation Bar
  mobileBottomBar: {
    width: '100%',
    borderTopWidth: 1,
    zIndex: 1000,
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        bottom: 0,
        left: 0,
        right: 0,
      },
    }),
  },
  mobileTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  mobileTabPressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  mobileTabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
  },
  activeIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});
