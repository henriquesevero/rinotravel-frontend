import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View, type TextInput } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { space, useStyles, type Theme } from '@/shared/theme';
import { Banner, Button, FormTextField, Text } from '@/shared/ui';

import { useLogin } from '../hooks';
import { loginSchema, type LoginForm } from '../schemas';
import { AuthLayout } from './AuthLayout';

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    form: { gap: space.lg },
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
    <AuthLayout
      title={t('auth.login.title')}
      subtitle={t('auth.login.subtitle')}
      footer={
        <>
          <Text tone="secondary">{t('auth.login.noAccount')}</Text>
          <Link href="/register" accessibilityRole="link">
            <Text tone="accent" style={{ fontWeight: '600' }}>
              {t('auth.login.createAccount')}
            </Text>
          </Link>
        </>
      }
    >
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
        <Button title={t('auth.login.submit')} onPress={submit} loading={login.isPending} fullWidth />
      </View>
    </AuthLayout>
  );
}
