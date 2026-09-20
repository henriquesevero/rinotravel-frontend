import type { Role } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { Badge, type BadgeTone } from '@/shared/ui';

const tones: Record<Role, BadgeTone> = {
  OWNER: 'accent',
  ADMIN: 'success',
  MEMBER: 'neutral',
  VIEWER: 'neutral',
};

export function RoleBadge({ role }: { role: Role }) {
  const { t } = useTranslation();
  return <Badge label={t(`roles.${role}`)} tone={tones[role]} />;
}
