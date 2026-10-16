import React from 'react';
import {
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  Vibration,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

interface FloatingActionButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  bottomOffset?: number;
}

export function FloatingActionButton({
  onPress,
  style,
  bottomOffset,
}: FloatingActionButtonProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(15);
      } catch {}
    }
    onPress();
  };

  // On web mobile, the bottom tab bar is fixed at bottom: 0 with height ~50 + insets.bottom.
  // The FAB should float cleanly 14-16px directly above the tab bar.
  // On desktop web, it floats near the bottom right (e.g. 32px).
  // On native (iOS/Android), it uses the standard 96px offset relative to screen bottom.
  const computedBottom = Platform.select({
    web: isDesktop
      ? (bottomOffset ?? 32)
      : (64 + Math.max(insets.bottom || 0, 8)),
    default: bottomOffset ?? 96,
  });

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom: computedBottom,
          transform: [{ scale: pressed ? 0.92 : 1 }],
        },
        style,
      ]}>
      <SymbolView
        name={{ ios: 'plus', android: 'add', web: 'add' }}
        size={24}
        tintColor="#FFFFFF"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        cursor: 'pointer' as any,
      },
      default: {
        position: 'absolute',
      },
    }),
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#037EF3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#037EF3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 1001,
  },
});
