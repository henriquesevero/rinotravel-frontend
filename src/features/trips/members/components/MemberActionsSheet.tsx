import { View } from 'react-native';

import type { AssignableRole, Member } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { space } from '@/shared/theme';
import { Banner, Card, Icon, ListRow, Sheet, useConfirm } from '@/shared/ui';

import { useChangeMemberRole, useRemoveMember } from '../hooks';

interface MemberActionsSheetProps {
  tripId: string;
  member: Member;
  visible: boolean;
  isSelf: boolean;
  onClose: () => void;
  /** Called after the member was removed (or the user left), so the screen can react. */
  onRemoved: (member: Member) => void;
}

export function MemberActionsSheet({
  tripId,
  member,
  visible,
  isSelf,
  onClose,
  onRemoved,
}: MemberActionsSheetProps) {
  const { t } = useTranslation();
  const describe = useDescribeError();
  const confirm = useConfirm();
  const changeRole = useChangeMemberRole(tripId);
  const removeMember = useRemoveMember(tripId);

  const error = changeRole.error ?? removeMember.error;

  const assign = (role: AssignableRole) => {
    changeRole.mutate({ userId: member.userId, role }, { onSuccess: onClose });
  };

  const remove = async () => {
    if (!isSelf) {
      const confirmed = await confirm({
        title: t('members.removeTitle', { name: member.name }),
        message: t('members.removeMessage', { name: member.name }),
        confirmLabel: t('members.removeConfirm'),
        destructive: true,
      });
      if (!confirmed) return;
    }
    removeMember.mutate(member.userId, {
      onSuccess: () => {
        onClose();
        onRemoved(member);
      },
    });
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('members.manage', { name: member.name })}>
      <View style={{ gap: space.lg }}>
        {error ? <Banner tone="danger" message={describe(error)} /> : null}
        <Card padded={false}>
          {member.capabilities.assignableRoles.map((role, index) => (
            <ListRow
              key={role}
              divider={index > 0}
              icon="swap-horizontal"
              title={t('members.changeTo', { role: t(`roles.${role}`) })}
              subtitle={t(`roleHints.${role}`)}
              onPress={() => assign(role)}
            />
          ))}
          {member.capabilities.canRemove ? (
            <ListRow
              divider={member.capabilities.assignableRoles.length > 0}
              left={
                <Icon
                  name={isSelf ? 'exit-outline' : 'person-remove-outline'}
                  size={22}
                  tone="danger"
                />
              }
              title={isSelf ? t('members.leave') : t('members.remove')}
              tone="danger"
              onPress={() => void remove()}
            />
          ) : null}
        </Card>
      </View>
    </Sheet>
  );
}
