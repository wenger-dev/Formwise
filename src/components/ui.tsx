import React, { PropsWithChildren, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ZodError } from 'zod';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors as c, radius } from '../constants/theme';

export type IconName = React.ComponentProps<typeof Feather>['name'];
export const Icon = ({
  name,
  color = c.text,
  size = 20,
}: {
  name: IconName;
  color?: string;
  size?: number;
}) => <Feather name={name} color={color} size={size} />;
export function Label({
  children,
  style,
  muted = false,
  selectable = false,
}: PropsWithChildren<{
  style?: React.ComponentProps<typeof Text>['style'];
  muted?: boolean;
  selectable?: boolean;
}>) {
  return (
    <Text selectable={selectable} style={[styles.text, muted && { color: c.secondary }, style]}>
      {children}
    </Text>
  );
}
export function Heading({ children, small = false }: PropsWithChildren<{ small?: boolean }>) {
  return (
    <Text
      accessibilityRole="header"
      style={{
        color: c.text,
        fontSize: small ? 20 : 32,
        fontWeight: '700',
        letterSpacing: -0.8,
        flexShrink: 1,
      }}
    >
      {children}
    </Text>
  );
}
export function Card({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Row({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.row, style]}>{children}</View>;
}
export function Badge({ children, color = c.lime }: PropsWithChildren<{ color?: string }>) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        borderRadius: 8,
        backgroundColor: `${color}19`,
        paddingHorizontal: 10,
        paddingVertical: 6,
      }}
    >
      <Label style={{ color, fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>
        {children}
      </Label>
    </View>
  );
}
export function Button({
  title,
  onPress,
  icon,
  tone = 'primary',
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: IconName;
  tone?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const color = tone === 'primary' ? c.bg : tone === 'danger' ? c.danger : c.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: tone === 'primary' ? c.lime : c.raised,
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} size={18} color={color} />}
      <Label style={{ color, fontWeight: '700', fontSize: 14, flexShrink: 1, textAlign: 'center' }}>
        {title}
      </Label>
    </Pressable>
  );
}
export function IconButton({
  name,
  onPress,
  label,
  color = c.text,
  disabled = false,
}: {
  name: IconName;
  onPress: () => void;
  label: string;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: c.raised,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.45 : pressed ? 0.6 : 1,
      })}
    >
      <Icon name={name} color={color} />
    </Pressable>
  );
}
export function Chip({
  title,
  selected,
  onPress,
  disabled = false,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        paddingVertical: 11,
        paddingHorizontal: 16,
        borderRadius: 30,
        backgroundColor: selected ? c.lime : c.raised,
        borderWidth: 1,
        borderColor: selected ? c.lime : c.border,
      }}
    >
      <Label style={{ fontSize: 12, color: selected ? c.bg : c.secondary, fontWeight: '600' }}>
        {title}
      </Label>
    </Pressable>
  );
}
export function Field({
  label,
  containerStyle,
  ...props
}: TextInputProps & { label: string; containerStyle?: ViewStyle }) {
  return (
    <View style={[{ gap: 8, flex: 1 }, containerStyle]}>
      <Label style={{ color: c.secondary, fontSize: 12 }}>{label}</Label>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        style={[styles.input, props.multiline && { minHeight: 80 }, props.style]}
      />
    </View>
  );
}
export function Empty({
  icon = 'activity',
  title,
  body,
  action,
}: {
  icon?: IconName;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ padding: 24, alignItems: 'center', gap: 12 }}>
      <View style={{ padding: 15, backgroundColor: c.raised, borderRadius: 50 }}>
        <Icon name={icon} color={c.lime} size={25} />
      </View>
      <Heading small>{title}</Heading>
      <Label muted style={{ textAlign: 'center', maxWidth: 340, lineHeight: 21 }}>
        {body}
      </Label>
      {action}
    </View>
  );
}
export function ProgressBar({ value, color = c.lime }: { value: number; color?: string }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(1, value) * 100) }}
      style={{ height: 7, backgroundColor: c.raised, borderRadius: 20, overflow: 'hidden' }}
    >
      <View
        style={{
          width: `${Math.min(1, Math.max(0, value)) * 100}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 20,
        }}
      />
    </View>
  );
}
export function Section({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Row style={{ justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap' }}>
      <Heading small>{title}</Heading>
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Label style={{ color: c.secondary, fontSize: 12 }}>{action} ↗</Label>
        </Pressable>
      )}
    </Row>
  );
}
export function Screen({
  children,
  title,
  subtitle,
  action,
  scroll = true,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  scroll?: boolean;
}>) {
  const insets = useSafeAreaInsets();
  const content = (
    <View
      style={{
        width: '100%',
        maxWidth: 1120,
        alignSelf: 'center',
        gap: 24,
        flex: scroll ? undefined : 1,
      }}
    >
      <Row style={{ justifyContent: 'space-between', paddingVertical: 8 }}>
        <View style={{ flex: 1, gap: 7 }}>
          <Label style={{ fontSize: 10, letterSpacing: 2, color: c.lime, fontWeight: '700' }}>
            YOUR SPACE TO GROW
          </Label>
          <Heading>{title}</Heading>
          {subtitle && (
            <Label muted style={{ fontSize: 13 }}>
              {subtitle}
            </Label>
          )}
        </View>
        {action}
      </Row>
      {children}
    </View>
  );
  const padding = {
    paddingTop: Math.max(insets.top, 24),
    paddingHorizontal: 24,
    paddingBottom: scroll ? 36 : 0,
  };
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ ...padding, flexGrow: 1 }}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={{ ...padding, flex: 1 }}>{content}</View>
      )}
    </KeyboardAvoidingView>
  );
}
export function Sheet({
  visible,
  title,
  onClose,
  children,
}: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  const inset = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' }}
      >
        <View
          style={{
            backgroundColor: c.surface,
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            width: '100%',
            maxWidth: 640,
            alignSelf: 'center',
            maxHeight: '92%',
            paddingBottom: Math.max(inset.bottom, 20),
          }}
        >
          <Row style={{ padding: 20, justifyContent: 'space-between' }}>
            <Heading small>{title}</Heading>
            <IconButton name="x" label="Close dialog" onPress={onClose} />
          </Row>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 20 }}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export const confirm = (title: string, message: string, destructive = false): Promise<boolean> =>
  new Promise((resolve) => {
    if (Platform.OS === 'web') {
      resolve(window.confirm(`${title}\n\n${message}`));
      return;
    }
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Confirm',
          style: destructive ? 'destructive' : 'default',
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
export function useFeedback() {
  const [message, setMessage] = useState<string | null>(null);
  return {
    message,
    show: setMessage,
    clear: () => setMessage(null),
    run: async (task: () => Promise<unknown>, success?: string) => {
      try {
        await task();
        if (success) setMessage(success);
      } catch (e) {
        setMessage(
          e instanceof ZodError
            ? `Please check your entries. ${e.issues
                .slice(0, 2)
                .map((issue) => `${String(issue.path.at(-1) ?? 'Value')}: ${issue.message}`)
                .join(' · ')}`
            : e instanceof Error
              ? e.message
              : 'Something went wrong. Please try again.',
        );
      }
    },
    feedback: message ? (
      <Pressable
        accessibilityRole="alert"
        onPress={() => setMessage(null)}
        style={{
          padding: 14,
          backgroundColor: c.raised,
          borderColor: c.lime,
          borderWidth: 1,
          borderRadius: 14,
        }}
      >
        <Label>{message}</Label>
        <Label muted style={{ fontSize: 10, marginTop: 5 }}>
          Tap to dismiss
        </Label>
      </Pressable>
    ) : null,
  };
}
export function Loading() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <ActivityIndicator color={c.lime} />
      <Label>Opening your training space…</Label>
    </View>
  );
}
export const useWide = () => useWindowDimensions().width >= 900;
export const styles = StyleSheet.create({
  text: { color: c.text, fontSize: 14, lineHeight: 20 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: 22,
    borderWidth: 1,
    borderColor: '#293126',
    gap: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: {
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: c.bg,
    color: c.text,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    minHeight: 48,
    padding: 13,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
});
