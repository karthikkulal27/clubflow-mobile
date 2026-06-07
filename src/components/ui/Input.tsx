import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { radius, spacing } from '../../theme/spacing';
import { fontSize, fontWeight } from '../../theme/typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword,
  secureTextEntry,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = isPassword ? !showPassword : (secureTextEntry ?? false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.text.secondary }]}>{label}</Text>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: error ? theme.danger : theme.border,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={theme.text.tertiary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            { color: theme.text.primary },
            leftIcon ? styles.inputWithLeftIcon : null,
            (rightIcon || isPassword) ? styles.inputWithRightIcon : null,
          ]}
          placeholderTextColor={theme.text.tertiary}
          secureTextEntry={isSecure}
          autoCapitalize="none"
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.rightIcon}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.text.tertiary}
            />
          </TouchableOpacity>
        )}

        {!isPassword && rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={theme.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
      {!error && hint && <Text style={[styles.hint, { color: theme.text.tertiary }]}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[1] + 2 },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: radius.lg,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: fontSize.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  inputWithLeftIcon: { paddingLeft: spacing[2] },
  inputWithRightIcon: { paddingRight: spacing[2] },
  leftIcon: { marginLeft: spacing[4] },
  rightIcon: { marginRight: spacing[3], padding: spacing[1] },
  error: { fontSize: fontSize.xs },
  hint: { fontSize: fontSize.xs },
});
