import { useState } from 'react';
import { View } from 'react-native';

import type { Document } from '@/core/api';
import { ticketHooks } from '@/features/bookings/hooks';
import { useTranslation } from '@/core/i18n';
import { useDescribeError } from '@/core/i18n/describe-error';
import { TripPage } from '@/features/content/TripPage';
import { DOCUMENT_VISUAL } from '@/features/content/visuals';
import { space } from '@/shared/theme';
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  ListRow,
  Skeleton,
} from '@/shared/ui';

import { DocumentDetailSheet } from './DocumentDetailSheet';
import { DocumentSheet } from './DocumentSheet';
import { useDocuments, useOpenDocument } from './hooks';
import { formatSize } from './schemas';

export function DocumentsScreen({ tripId }: { tripId: string }) {
  const { t } = useTranslation();
  const describe = useDescribeError();
  const documents = useDocuments(tripId);
  const open = useOpenDocument(tripId);
  const tickets = ticketHooks.useList(tripId);
  // A document is a ticket's file when a ticket points at it.
  const ticketOf = (document: Document) =>
    tickets.data?.find((ticket) => ticket.documentId === document.id);
  const [sheet, setSheet] = useState<{ document?: Document | undefined } | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const viewDocument = documents.data?.find((document) => document.id === viewId);

  return (
    <TripPage
      tripId={tripId}
      title={t('documents.title')}
      onRefresh={() => void documents.refetch()}
      right={({ canWrite }) =>
        canWrite ? (
          <Button
            testID="add-document"
            title={t('documents.add')}
            icon="cloud-upload-outline"
            size="sm"
            onPress={() => setSheet({})}
          />
        ) : null
      }
    >
      {({ canWrite }) => (
        <>
          {open.error ? <Banner tone="danger" message={describe(open.error)} /> : null}
          {documents.error ? (
            <ErrorState
              error={documents.error}
              title={t('documents.loadError')}
              onRetry={() => void documents.refetch()}
            />
          ) : !documents.data ? (
            <View style={{ gap: space.sm }}>
              <Skeleton height={64} borderRadius={16} />
              <Skeleton height={64} borderRadius={16} />
            </View>
          ) : documents.data.length === 0 ? (
            <EmptyState
              icon="folder-open-outline"
              title={t('documents.emptyTitle')}
              message={t('documents.emptyMessage')}
              {...(canWrite
                ? { actionLabel: t('documents.add'), onAction: () => setSheet({}) }
                : {})}
            />
          ) : (
            <Card padded={false}>
              {documents.data.map((document, index) => {
                const size = formatSize(document.size);
                const ready = document.status === 'READY';
                return (
                  <ListRow
                    key={document.id}
                    testID={`document-${document.id}`}
                    divider={index > 0}
                    icon={DOCUMENT_VISUAL[document.type].icon}
                    tint={DOCUMENT_VISUAL[document.type].tint}
                    title={document.name}
                    subtitle={[
                      t(`enums.docType.${document.type}`),
                      t(size.key, { value: size.value }),
                      ticketOf(document)
                        ? t('tickets.forTicket', { name: ticketOf(document)?.name })
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                    right={
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                        {document.visibility === 'PRIVATE' ? (
                          <Badge label={t('documents.private')} tone="neutral" />
                        ) : null}
                        {ready ? (
                          <IconButton
                            icon="open-outline"
                            label={t('documents.open')}
                            onPress={() => open.mutate(document.id)}
                            testID={`open-document-${document.id}`}
                          />
                        ) : (
                          <Badge label={t('documents.pending')} tone="warning" />
                        )}
                      </View>
                    }
                    onPress={() => setViewId(document.id)}
                  />
                );
              })}
            </Card>
          )}
          <DocumentDetailSheet
            tripId={tripId}
            document={viewDocument}
            ticketName={viewDocument ? ticketOf(viewDocument)?.name : undefined}
            visible={viewId !== null}
            onClose={() => setViewId(null)}
            onOpen={(document) => open.mutate(document.id)}
            onEdit={
              canWrite
                ? () => {
                    setViewId(null);
                    setSheet({ document: viewDocument });
                  }
                : undefined
            }
          />
          <DocumentSheet
            tripId={tripId}
            visible={sheet !== null}
            onClose={() => setSheet(null)}
            document={sheet?.document}
          />
        </>
      )}
    </TripPage>
  );
}
