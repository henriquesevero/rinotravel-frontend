import { useState, type Ref } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTranslation } from '@/core/i18n';

import {
  FONT_FAMILY,
  radius,
  space,
  typography,
  useFieldMetrics,
  useStyles,
  useTheme,
  type Theme,
} from '../theme';
import { FieldMessage } from './FieldMessage';
import { Icon } from './Icon';
import { Text } from './Text';

export interface TextFieldProps extends Omit<
  TextInputProps,
  'style' | 'placeholderTextColor' | 'accessibilityLabel'
> {
  label: string;
  error?: string | undefined;
  hint?: string;
  /** Renders a show/hide toggle and hides the text by default. */
  password?: boolean;
  inputRef?: Ref<TextInput>;
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    container: { gap: space.xs + 1 },
    box: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingLeft: space.lg,
    },
    boxFocused: { borderColor: colors.accent, borderWidth: 2, paddingLeft: space.lg - 1 },
    boxError: { borderColor: colors.danger },
    input: {
      flex: 1,
      paddingRight: space.lg,
      color: colors.text,
      ...typography.body,
      fontFamily: FONT_FAMILY.regular,
      fontWeight: 'normal',
    },
    label: { fontWeight: '500' },
    toggle: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  });

export function TextField({
  label,
  error,
  hint,
  password = false,
  inputRef,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const styles = useStyles(createStyles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const metrics = useFieldMetrics();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.container}>
      <Text variant={metrics.dense ? 'footnote' : 'subhead'} tone="secondary" style={styles.label}>
        {label}
      </Text>
      <View
        style={[
          styles.box,
          { minHeight: metrics.height },
          focused && styles.boxFocused,
          !!error && styles.boxError,
        ]}
      >
        <TextInput
          ref={inputRef}
          accessibilityLabel={label}
          aria-invalid={!!error}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={password && !revealed}
          style={[
            styles.input,
            {
              minHeight: metrics.height - 2,
              fontSize: metrics.fontSize,
              paddingVertical: metrics.dense ? space.sm : space.md,
            },
          ]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {password ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? t('auth.hidePassword') : t('auth.showPassword')}
            onPress={() => setRevealed((value) => !value)}
            style={styles.toggle}
          >
            <Icon name={revealed ? 'eye-off-outline' : 'eye-outline'} tone="secondary" />
          </Pressable>
        ) : null}
      </View>
      <FieldMessage error={error} hint={hint} />
    </View>
  );
}
