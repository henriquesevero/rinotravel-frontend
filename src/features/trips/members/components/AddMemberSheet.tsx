import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

import type { AssignableRole } from '@/core/api';
import { applyApiFieldErrors } from '@/core/forms/apply-api-errors';
import { isApiError } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { space } from '@/shared/theme';
import { Banner, Button, FormSelectField, FormTextField, Sheet } from '@/shared/ui';

import { useAddMember } from '../hooks';
import { addMemberSchema, type AddMemberForm } from '../schemas';

interface AddMemberSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  /** Roles the server says the current user may assign when adding someone. */
  addableRoles: AssignableRole[];
}

export function AddMemberSheet({ tripId, visible, onClose, addableRoles }: AddMemberSheetProps) {
  const { t } = useTranslation();
  const describe = useDescribeError();
  const addMember = useAddMember(tripId);
  const defaultRole = addableRoles.includes('MEMBER') ? 'MEMBER' : (addableRoles[0] ?? '');
  const { control, handleSubmit, reset, setError } = useForm<AddMemberForm>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: '', role: defaultRole },
  });

  const close = () => {
    reset({ email: '', role: defaultRole });
    addMember.reset();
    onClose();
  };

  const submit = handleSubmit((values) =>
    addMember.mutate(
      { email: values.email, role: values.role as AssignableRole },
      {
        onSuccess: close,
        onError: (error) => applyApiFieldErrors(error, setError, ['email', 'role']),
      },
    ),
  );

  const hasFieldErrors = isApiError(addMember.error) && addMember.error.fieldErrors.length > 0;

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={t('members.addTitle')}
      footer={
        <Button
          title={t('members.submit')}
          onPress={submit}
          loading={addMember.isPending}
          fullWidth
        />
      }
    >
      <View style={{ gap: space.lg }}>
        {addMember.error && !hasFieldErrors ? (
          <Banner tone="danger" message={describe(addMember.error)} />
        ) : null}
        <FormTextField
          control={control}
          name="email"
          label={t('members.email')}
          hint={t('members.emailHint')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        <FormSelectField
          control={control}
          name="role"
          label={t('members.role')}
          title={t('members.role')}
          options={addableRoles.map((role) => ({
            value: role,
            label: t(`roles.${role}`),
            description: t(`roleHints.${role}`),
          }))}
        />
      </View>
    </Sheet>
  );
}
