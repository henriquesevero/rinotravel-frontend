import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import type { Member } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { useMe } from '@/features/auth';
import { space } from '@/shared/theme';
import {
  Avatar,
  Card,
  ErrorState,
  IconButton,
  ListRow,
  Screen,
  ScreenHeader,
  Skeleton,
} from '@/shared/ui';

import { AddMemberSheet } from '../components/AddMemberSheet';
import { MemberActionsSheet } from '../components/MemberActionsSheet';
import { RoleBadge } from '../components/RoleBadge';
import { useForgetTrip, useTrip } from '../../hooks';
import { useMembers } from '../hooks';

export function MembersScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const trip = useTrip(tripId);
  const members = useMembers(tripId);
  const me = useMe();
  const forgetTrip = useForgetTrip();
  const [selected, setSelected] = useState<Member | null>(null);
  const [managing, setManaging] = useState(false);
  const [adding, setAdding] = useState(false);

  const canManage = trip.data?.capabilities.manageMembers ?? false;
  const addableRoles = trip.data?.capabilities.addableRoles ?? [];

  return (
    <Screen refreshing={members.isRefetching} onRefresh={() => void members.refetch()}>
      <ScreenHeader
        title={t('members.title')}
        backFallback={`/trips/${tripId}`}
        right={
          canManage ? (
            <IconButton
              icon="person-add-outline"
              label={t('members.add')}
              onPress={() => setAdding(true)}
              testID="add-member"
            />
          ) : undefined
        }
      />

      {members.isPending ? (
        <MembersSkeleton />
      ) : members.isError ? (
        <ErrorState
          error={members.error}
          title={t('members.loadError')}
          onRetry={() => void members.refetch()}
        />
      ) : (
        <Card padded={false}>
          {members.data.map((member, index) => {
            const isSelf = member.userId === me.data?.id;
            const actionable =
              member.capabilities.assignableRoles.length > 0 || member.capabilities.canRemove;
            return (
              <ListRow
                key={member.userId}
                divider={index > 0}
                testID={`member-${member.email}`}
                left={<Avatar name={member.name} />}
                title={isSelf ? `${member.name} (${t('common.you')})` : member.name}
                subtitle={member.email}
                right={<RoleBadge role={member.role} />}
                {...(actionable
                  ? {
                      onPress: () => {
                        setSelected(member);
                        setManaging(true);
                      },
                    }
                  : {})}
              />
            );
          })}
        </Card>
      )}

      <AddMemberSheet
        tripId={tripId}
        visible={adding}
        onClose={() => setAdding(false)}
        addableRoles={addableRoles}
      />
      {selected ? (
        <MemberActionsSheet
          key={selected.userId}
          tripId={tripId}
          member={selected}
          visible={managing}
          isSelf={selected.userId === me.data?.id}
          onClose={() => setManaging(false)}
          onRemoved={(member) => {
            if (member.userId === me.data?.id) {
              void forgetTrip(tripId);
              router.dismissTo('/');
            }
          }}
        />
      ) : null}
    </Screen>
  );
}

function MembersSkeleton() {
  return (
    <Card>
      <View style={{ gap: space.lg }}>
        {[0, 1, 2].map((key) => (
          <View key={key} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
            <Skeleton width={40} height={40} borderRadius={20} />
            <View style={{ flex: 1, gap: space.xs }}>
              <Skeleton width="50%" height={16} />
              <Skeleton width="70%" height={12} />
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
}
