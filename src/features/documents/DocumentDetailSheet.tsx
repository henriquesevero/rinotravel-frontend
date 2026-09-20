import type { Document } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { DetailSheet } from '@/features/content/DetailSheet';
import { DOCUMENT_VISUAL } from '@/features/content/visuals';
import { Button } from '@/shared/ui';

import { formatSize } from './schemas';

interface DocumentDetailSheetProps {
  tripId: string;
  document: Document | undefined;
  visible: boolean;
  onClose: () => void;
  onEdit?: (() => void) | undefined;
  onOpen: (document: Document) => void;
}

export function DocumentDetailSheet({
  tripId,
  document,
  visible,
  onClose,
  onEdit,
  onOpen,
}: DocumentDetailSheetProps) {
  const { t } = useTranslation();
  const visual = DOCUMENT_VISUAL[document?.type ?? 'OTHER'];
  const size = document ? formatSize(document.size) : null;
  return (
    <DetailSheet
      tripId={tripId}
      visible={visible && document !== undefined}
      onClose={onClose}
      onEdit={onEdit}
      title={document?.name ?? ''}
      subtitle={document ? t(`enums.docType.${document.type}`) : undefined}
      icon={visual.icon}
      tint={visual.tint}
      badges={
        document
          ? [
              document.status === 'READY'
                ? { label: t('documents.ready'), tone: 'success' as const }
                : { label: t('documents.pending'), tone: 'warning' as const },
              ...(document.visibility === 'PRIVATE' ? [{ label: t('documents.private') }] : []),
            ]
          : []
      }
      rows={[
        { label: t('detail.file'), value: document?.fileName },
        { label: t('detail.size'), value: size ? t(size.key, { value: size.value }) : undefined },
        {
          label: t('detail.visibility'),
          value: document ? t(`enums.visibility.${document.visibility}`) : undefined,
        },
      ]}
      actions={
        document?.status === 'READY' ? (
          <Button
            testID="open-document-file"
            title={t('detail.open')}
            icon="open-outline"
            onPress={() => onOpen(document)}
          />
        ) : undefined
      }
      testID="document-detail"
    />
  );
}
