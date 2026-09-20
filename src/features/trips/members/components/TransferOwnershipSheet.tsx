import { View } from 'react-native';

import type { Member } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { space } from '@/shared/theme';
import { Avatar, Banner, Card, ListRow, Sheet, Text, useConfirm } from '@/shared/ui';

import { useTransferOwnership } from '../../hooks';
import { useMembers } from '../hooks';
import { RoleBadge } from './RoleBadge';

interface TransferOwnershipSheetProps {
  tripId: string;
  currentUserId: string | undefined;
  visible: boolean;
  onClose: () => void;
}

export function TransferOwnershipSheet({
  tripId,
  currentUserId,
  visible,
  onClose,
}: TransferOwnershipSheetProps) {
  const { t } = useTranslation();
  const describe = useDescribeError();
  const confirm = useConfirm();
  const members = useMembers(tripId);
  const transfer = useTransferOwnership(tripId);

  const candidates = (members.data ?? []).filter((member) => member.userId !== currentUserId);

  const choose = async (member: Member) => {
    const confirmed = await confirm({
      title: t('trips.transfer.confirmTitle', { name: member.name }),
      message: t('trips.transfer.confirmMessage', { name: member.name }),
      confirmLabel: t('trips.transfer.confirm'),
    });
    if (confirmed) transfer.mutate(member.userId, { onSuccess: onClose });
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('trips.transfer.title')}>
      <View style={{ gap: space.lg }}>
        <Text tone="secondary">{t('trips.transfer.message')}</Text>
        {transfer.error ? <Banner tone="danger" message={describe(transfer.error)} /> : null}
        {candidates.length === 0 ? (
          <Text tone="secondary">{t('trips.transfer.none')}</Text>
        ) : (
          <Card padded={false}>
            {candidates.map((member, index) => (
              <ListRow
                key={member.userId}
                divider={index > 0}
                left={<Avatar name={member.name} />}
                title={member.name}
                subtitle={member.email}
                right={<RoleBadge role={member.role} />}
                onPress={() => void choose(member)}
              />
            ))}
          </Card>
        )}
      </View>
    </Sheet>
  );
}
