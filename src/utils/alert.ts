import { Alert, AlertButton, Platform } from 'react-native';

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;

    const fullMessage = [title, message].filter(Boolean).join('\n\n');

    if (!buttons || buttons.length <= 1) {
      window.alert(fullMessage);
      buttons?.[0]?.onPress?.();
      return;
    }

    const hasDestructiveOrConfirm = buttons.some(
      (b) => b.style === 'destructive' || b.style === 'default' || !b.style
    );

    if (hasDestructiveOrConfirm) {
      const confirmed = window.confirm(fullMessage);
      if (confirmed) {
        const actionBtn =
          buttons.find((b) => b.style === 'destructive') ||
          buttons.find((b) => b.style !== 'cancel');
        actionBtn?.onPress?.();
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        cancelBtn?.onPress?.();
      }
      return;
    }

    window.alert(fullMessage);
    buttons[0]?.onPress?.();
    return;
  }

  Alert.alert(title, message, buttons);
}
