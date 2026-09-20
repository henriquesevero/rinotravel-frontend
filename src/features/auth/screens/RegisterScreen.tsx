import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View, type TextInput } from 'react-native';

import { isApiError } from '@/core/api';
import { applyApiFieldErrors } from '@/core/forms/apply-api-errors';
import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { space, useStyles, type Theme } from '@/shared/theme';
import { Banner, Button, FormTextField, Text } from '@/shared/ui';

import { useRegister } from '../hooks';
import { registerSchema, type RegisterForm } from '../schemas';
import { AuthLayout } from './AuthLayout';

const createStyles = (_theme: Theme) =>
  StyleSheet.create({
    form: { gap: space.lg },
  });

const FIELDS = ['name', 'email', 'password', 'registrationCode'] as const;

export function RegisterScreen() {
  const styles = useStyles(createStyles);
  const { t } = useTranslation();
  const describe = useDescribeError();
  const register = useRegister();
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const codeRef = useRef<TextInput>(null);
  const { control, handleSubmit, setError } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', registrationCode: '' },
  });

  const submit = handleSubmit((values) =>
    register.mutate(values, {
      onError: (error) => applyApiFieldErrors(error, setError, FIELDS),
    }),
  );
  const hasFieldErrors = isApiError(register.error) && register.error.fieldErrors.length > 0;

  return (
    <AuthLayout
      title={t('auth.register.title')}
      subtitle={t('auth.register.subtitle')}
      footer={
        <>
          <Text tone="secondary">{t('auth.register.haveAccount')}</Text>
          <Link href="/login" accessibilityRole="link">
            <Text tone="accent" style={{ fontWeight: '600' }}>
              {t('auth.register.signIn')}
            </Text>
          </Link>
        </>
      }
    >
      <View style={styles.form}>
        {register.error && !hasFieldErrors ? (
          <Banner tone="danger" message={describe(register.error)} />
        ) : null}
        <FormTextField
          control={control}
          name="name"
          label={t('auth.register.name')}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <FormTextField
          control={control}
          name="email"
          label={t('auth.register.email')}
          inputRef={emailRef}
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
          label={t('auth.register.password')}
          hint={t('auth.register.passwordHint')}
          password
          inputRef={passwordRef}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => codeRef.current?.focus()}
        />
        <FormTextField
          control={control}
          name="registrationCode"
          label={t('auth.register.code')}
          inputRef={codeRef}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <Button
          title={t('auth.register.submit')}
          onPress={submit}
          loading={register.isPending}
          fullWidth
        />
      </View>

    </AuthLayout>
  );
}
