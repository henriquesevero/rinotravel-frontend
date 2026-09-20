import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Document } from '@/core/api';
import { useTranslation } from '@/core/i18n';
import { EntitySheet } from '@/features/content/EntitySheet';
import { useEntityForm } from '@/features/content/use-entity-form';
import { radius, space } from '@/shared/theme';
import {
  Banner,
  Button,
  FormSelectField,
  FormTextField,
  Text,
  useConfirm,
  FormSection,
  FieldRow,
  IconBadge,
} from '@/shared/ui';

import { useRemoveDocument, useUpdateDocument, useUploadDocument } from './hooks';
import {
  DOCUMENT_TYPES,
  VISIBILITIES,
  documentSchema,
  formatSize,
  type DocumentFormValues,
} from './schemas';
import {
  ALLOWED_MIME,
  MAX_DOCUMENT_BYTES,
  pickDocument,
  type PickedFile,
  type UploadStage,
} from './upload';

interface DocumentSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  /** Editing metadata when set; uploading a new file otherwise. */
  document?: Document | undefined;
}

const STAGE_KEY = {
  reading: 'documents.stageReading',
  uploading: 'documents.stageUploading',
  finishing: 'documents.stageFinishing',
} as const satisfies Record<UploadStage, string>;

export function DocumentSheet({ tripId, visible, onClose, document }: DocumentSheetProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const upload = useUploadDocument(tripId);
  const update = useUpdateDocument(tripId);
  const remove = useRemoveDocument(tripId);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  const [stage, setStage] = useState<UploadStage | null>(null);

  const defaults = useMemo<DocumentFormValues>(
    () => ({
      name: document?.name ?? '',
      type: document?.type ?? 'TICKET',
      visibility: document?.visibility ?? 'TRIP',
    }),
    [document],
  );
  const { form, error, fail, close, clearError } = useEntityForm<DocumentFormValues>({
    schema: documentSchema,
    defaults,
    fields: ['name', 'type', 'visibility'],
    onClose: () => {
      setFile(null);
      setFileError(undefined);
      setStage(null);
      onClose();
    },
  });

  const choose = async () => {
    setFileError(undefined);
    const picked = await pickDocument();
    if (!picked) return;
    if (picked.size > MAX_DOCUMENT_BYTES) return setFileError(t('validation.fileTooBig'));
    if (!ALLOWED_MIME.includes(picked.mimeType)) return setFileError(t('validation.fileType'));
    setFile(picked);
    if (form.getValues('name').trim() === '') {
      form.setValue('name', picked.name.replace(/\.[^.]+$/, ''), { shouldValidate: true });
    }
  };

  const submit = form.handleSubmit(async (values) => {
    clearError();
    try {
      if (document) {
        await update.mutateAsync({
          id: document.id,
          baseVersion: document.version,
          patch: { name: values.name, type: values.type, visibility: values.visibility },
        });
      } else {
        if (!file) return setFileError(t('validation.fileRequired'));
        await upload.mutateAsync({
          file,
          name: values.name,
          type: values.type,
          visibility: values.visibility,
          onStage: setStage,
        });
      }
      close();
    } catch (cause) {
      setStage(null);
      fail(cause);
    }
  });

  const askDelete = async () => {
    if (!document) return;
    const confirmed = await confirm({
      title: t('content.deleteTitle'),
      message: t('content.deleteMessage', { name: document.name }),
      confirmLabel: t('content.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(document.id);
      close();
    } catch (cause) {
      fail(cause);
    }
  };

  const busy = upload.isPending || update.isPending;
  const { control } = form;
  const size = file ? formatSize(file.size) : null;

  return (
    <EntitySheet
      icon="document-text-outline"
      tint="amber"
      testID="document-sheet"
      visible={visible}
      title={document ? t('documents.editTitle') : t('documents.add')}
      submitLabel={stage ? t(STAGE_KEY[stage]) : t('common.save')}
      onClose={close}
      onSubmit={() => void submit()}
      isSubmitting={busy}
      error={error}
      {...(document ? { onDelete: () => void askDelete() } : {})}
    >
      {document ? null : (
        <FormSection title={t('content.sec.file')}>
          <View style={styles.drop}>
            <IconBadge icon="cloud-upload-outline" tint="amber" size={48} />
            <Text variant="footnote" tone={fileError ? 'danger' : 'secondary'} align="center">
              {fileError ??
                (file && size
                  ? `${file.name} · ${t(size.key, { value: size.value })}`
                  : `${t('documents.noFile')}. ${t('documents.fileHelp')}`)}
            </Text>
            <Button
              testID="document-pick"
              title={file ? t('documents.change') : t('documents.pick')}
              variant="secondary"
              icon="attach-outline"
              onPress={() => void choose()}
            />
          </View>
        </FormSection>
      )}
      <FormSection title={t('content.sec.basic')}>
        <FormTextField
          control={control}
          name="name"
          label={t('documents.name')}
          testID="document-name"
        />
        <FieldRow>
          <FormSelectField
            control={control}
            name="type"
            label={t('documents.type')}
            title={t('documents.type')}
            options={DOCUMENT_TYPES.map((value) => ({ value, label: t(`enums.docType.${value}`) }))}
            testID="document-type"
          />
          <FormSelectField
            control={control}
            name="visibility"
            label={t('documents.visibility')}
            title={t('documents.visibility')}
            options={VISIBILITIES.map((value) => ({
              value,
              label: t(`enums.visibility.${value}`),
            }))}
            testID="document-visibility"
          />
        </FieldRow>
      </FormSection>
      {document?.status === 'PENDING' ? (
        <Banner tone="warning" message={t('documents.notReady')} />
      ) : null}
    </EntitySheet>
  );
}

const styles = StyleSheet.create({
  drop: {
    alignItems: 'center',
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(146, 64, 14, 0.35)',
  },
});
