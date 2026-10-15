import React from 'react';
import {
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  Vibration,
  Platform,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Colors } from '@/constants/theme';

interface FloatingActionButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  bottomOffset?: number;
}

export function FloatingActionButton({
  onPress,
  style,
  bottomOffset = 96,
}: FloatingActionButtonProps) {
  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Vibration.vibrate(15);
      } catch {}
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.fab,
        {
          bottom: bottomOffset,
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
    position: 'absolute',
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
    zIndex: 999,
  },
});
