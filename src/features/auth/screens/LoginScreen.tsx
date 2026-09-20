import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View, type TextInput } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { space, useStyles, type Theme } from '@/shared/theme';
import { Banner, Button, FormTextField, Screen, Text } from '@/shared/ui';

import { useLogin } from '../hooks';
import { loginSchema, type LoginForm } from '../schemas';
import { BrandMark } from './BrandMark';

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    header: { gap: space.sm, marginBottom: space.xl },
    form: { gap: space.lg },
    footer: { flexDirection: 'row', justifyContent: 'center', gap: space.xs, marginTop: space.xl },
  });

export function LoginScreen() {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const describe = useDescribeError();
  const login = useLogin();
  const passwordRef = useRef<TextInput>(null);
  const { control, handleSubmit } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const submit = handleSubmit((values) => login.mutate(values));

  return (
    <Screen contentStyle={{ paddingTop: space.xxxl }}>
      <BrandMark />
      <View style={styles.header}>
        <Text variant="largeTitle" heading>
          {t('auth.login.title')}
        </Text>
        <Text tone="secondary">{t('auth.login.subtitle')}</Text>
      </View>

      <View style={styles.form}>
        {login.error ? <Banner tone="danger" message={describe(login.error)} /> : null}
        <FormTextField
          control={control}
          name="email"
          label={t('auth.login.email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <FormTextField
          control={control}
          name="password"
          label={t('auth.login.password')}
          password
          inputRef={passwordRef}
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Button
          title={t('auth.login.submit')}
          onPress={submit}
          loading={login.isPending}
          fullWidth
        />
      </View>

      <View style={styles.footer}>
        <Text tone="secondary">{t('auth.login.noAccount')}</Text>
        <Link href="/register" accessibilityRole="link">
          <Text tone="accent" style={{ fontWeight: '600' }}>
            {t('auth.login.createAccount')}
          </Text>
        </Link>
      </View>
    </Screen>
  );
}
