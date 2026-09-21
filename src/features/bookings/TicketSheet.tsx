import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Document, Location, PlaceCandidate, Ticket } from '@/core/api';
import { joinOptionalZoned, splitZoned } from '@/core/datetime/zoned';
import { useTranslation } from '@/core/i18n';
import { newId } from '@/core/ids';
import { EntitySheet } from '@/features/content/EntitySheet';
import { LocationPreview } from '@/features/content/LocationPreview';
import { PlaceSearch } from '@/features/content/PlaceSearch';
import { SplitForm, useWideForm } from '@/features/content/SplitForm';
import { fromMoney, mergeLocation, toMoneyInput } from '@/features/content/mappers';
import { useEntityForm } from '@/features/content/use-entity-form';
import { useLocationPreview } from '@/features/content/use-location-preview';
import { useDocuments, useUploadDocument } from '@/features/documents/hooks';
import { formatSize } from '@/features/documents/schemas';
import {
  ALLOWED_MIME,
  MAX_DOCUMENT_BYTES,
  pickDocument,
  type PickedFile,
  type UploadStage,
} from '@/features/documents/upload';
import { radius, space } from '@/shared/theme';
import {
  Button,
  Card,
  FieldRow,
  FormDateField,
  FormSection,
  FormSelectField,
  FormTextField,
  FormTimeField,
  IconBadge,
  ListRow,
  Sheet,
  Text,
  useConfirm,
} from '@/shared/ui';
import { useWatch } from 'react-hook-form';

import { ticketHooks } from './hooks';
import {
  TICKET_ALIASES,
  TICKET_FIELDS,
  TICKET_KINDS,
  TICKET_STATUSES,
  ticketSchema,
  type TicketFormValues,
} from './schemas';

interface TicketSheetProps {
  tripId: string;
  visible: boolean;
  onClose: () => void;
  timezone: string;
  currency: string;
  ticket?: Ticket | undefined;
}

const STAGE_KEY = {
  reading: 'documents.stageReading',
  uploading: 'documents.stageUploading',
  finishing: 'documents.stageFinishing',
} as const satisfies Record<UploadStage, string>;

function candidateLocation(candidate: PlaceCandidate): Location {
  return {
    name: candidate.name,
    ...(candidate.address ? { address: candidate.address } : {}),
    ...(candidate.latitude !== undefined ? { latitude: candidate.latitude } : {}),
    ...(candidate.longitude !== undefined ? { longitude: candidate.longitude } : {}),
  };
}

/**
 * A ticket and where it is used. Its file is a document of the trip: sent from here (and then listed
 * in the documents like any other) or picked from what is already there.
 */
export function TicketSheet({
  tripId,
  visible,
  onClose,
  timezone,
  currency,
  ticket,
}: TicketSheetProps) {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const create = ticketHooks.useCreate(tripId);
  const update = ticketHooks.useUpdate(tripId);
  const remove = ticketHooks.useRemove(tripId);
  const upload = useUploadDocument(tripId);
  const documents = useDocuments(tripId);

  const [picked, setPicked] = useState<PlaceCandidate | null>(null);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [fileError, setFileError] = useState<string | undefined>(undefined);
  // The file already sent for this save, so trying again after a failure does not send it twice.
  const [uploaded, setUploaded] = useState<Document | null>(null);
  // `undefined`: the ticket keeps the file it has. `null`: it was taken off. A string: another document.
  const [linkChange, setLinkChange] = useState<string | null | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stage, setStage] = useState<UploadStage | null>(null);

  const schema = useMemo(() => ticketSchema(currency), [currency]);
  const defaults = useMemo<TicketFormValues>(() => {
    const start = splitZoned(ticket?.start);
    return {
      name: ticket?.name ?? '',
      kind: ticket?.kind ?? 'ATTRACTION',
      quantity: String(ticket?.quantity ?? 1),
      venue: ticket?.location?.name ?? '',
      address: ticket?.location?.address ?? '',
      date: start.date,
      startTime: start.time,
      endTime: splitZoned(ticket?.end).time,
      confirmationCode: ticket?.confirmationCode ?? '',
      seat: ticket?.seat ?? '',
      cost: fromMoney(ticket?.cost),
      status: ticket?.status ?? 'PLANNED',
      notes: ticket?.notes ?? '',
    };
  }, [ticket]);
  const { form, error, fail, close, clearError } = useEntityForm<TicketFormValues>({
    schema,
    defaults,
    fields: TICKET_FIELDS,
    aliases: TICKET_ALIASES,
    onClose: () => {
      setPicked(null);
      setFile(null);
      setFileError(undefined);
      setUploaded(null);
      setLinkChange(undefined);
      setPickerOpen(false);
      setStage(null);
      onClose();
    },
  });

  const venueNow = useWatch({ control: form.control, name: 'venue' }) as string;
  const addressNow = useWatch({ control: form.control, name: 'address' }) as string;
  const wide = useWideForm();
  const preview = useLocationPreview({
    nameNow: venueNow,
    addressNow,
    pick: picked,
    previous: ticket?.location,
  });

  const pickPlace = (candidate: PlaceCandidate) => {
    setPicked(candidate);
    form.setValue('venue', candidate.name, { shouldValidate: true });
    form.setValue('address', candidate.address ?? '');
  };

  const choose = async () => {
    setFileError(undefined);
    const chosen = await pickDocument();
    if (!chosen) return;
    if (chosen.size > MAX_DOCUMENT_BYTES) return setFileError(t('validation.fileTooBig'));
    if (!ALLOWED_MIME.includes(chosen.mimeType)) return setFileError(t('validation.fileType'));
    setFile(chosen);
    setUploaded(null);
    if (form.getValues('name').trim() === '') {
      form.setValue('name', chosen.name.replace(/\.[^.]+$/, ''), { shouldValidate: true });
    }
  };

  // The document the ticket points at, after any change made in this sheet.
  const linkedId = file
    ? null
    : linkChange !== undefined
      ? linkChange
      : (ticket?.documentId ?? null);
  const linked = linkedId
    ? documents.data?.find((document) => document.id === linkedId)
    : undefined;
  const size = file ? formatSize(file.size) : null;

  const submit = form.handleSubmit(async (values) => {
    clearError();
    try {
      let documentId: string | null | undefined = linkChange;
      if (file) {
        const sent =
          uploaded ??
          (await upload.mutateAsync({
            file,
            name: values.name,
            type: 'TICKET',
            visibility: 'TRIP',
            onStage: setStage,
          }));
        setUploaded(sent);
        documentId = sent.id;
      }
      const start = joinOptionalZoned(values.date, values.startTime, timezone);
      const end = joinOptionalZoned(values.date, values.endTime, timezone);
      const body = {
        name: values.name,
        kind: values.kind,
        status: values.status,
        quantity: Number(values.quantity),
        location: mergeLocation(
          values.venue,
          values.address,
          picked ? candidateLocation(picked) : ticket?.location,
        ),
        start,
        end,
        confirmationCode: values.confirmationCode,
        seat: values.seat,
        cost: toMoneyInput(values.cost, currency),
        notes: values.notes,
        ...(documentId !== undefined ? { documentId } : {}),
      };
      if (ticket) {
        await update.mutateAsync({ id: ticket.id, baseVersion: ticket.version, patch: body });
      } else {
        await create.mutateAsync({ id: newId(), ...body });
      }
      close();
    } catch (cause) {
      setStage(null);
      fail(cause);
    }
  });

  const askDelete = async () => {
    if (!ticket) return;
    const confirmed = await confirm({
      title: t('content.deleteTitle'),
      message: t('content.deleteMessage', { name: ticket.name }),
      confirmLabel: t('content.deleteConfirm'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await remove.mutateAsync(ticket.id);
      close();
    } catch (cause) {
      fail(cause);
    }
  };

  const { control } = form;
  const busy = create.isPending || update.isPending || upload.isPending;
  const hasFile = file !== null || linkedId !== null;

  const fileBlock = (
    <FormSection title={t('content.sec.file')} description={t('tickets.savedAlso')}>
      {hasFile ? (
        <Card padded={false}>
          <ListRow
            testID="ticket-file"
            icon="document-attach-outline"
            tint="amber"
            title={file ? file.name : (linked?.name ?? t('tickets.unavailable'))}
            subtitle={
              file && size
                ? `${t(size.key, { value: size.value })} · ${t('tickets.willUpload')}`
                : linked
                  ? `${t('tickets.linkedFrom')} · ${linked.fileName}`
                  : undefined
            }
          />
        </Card>
      ) : (
        <View style={styles.drop}>
          <IconBadge icon="cloud-upload-outline" tint="amber" size={48} />
          <Text variant="footnote" tone={fileError ? 'danger' : 'secondary'} align="center">
            {fileError ?? t('tickets.noFile')}
          </Text>
        </View>
      )}
      {fileError && hasFile ? (
        <Text variant="footnote" tone="danger">
          {fileError}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button
          testID="ticket-pick"
          title={hasFile ? t('tickets.change') : t('tickets.upload')}
          variant="secondary"
          icon="attach-outline"
          size="sm"
          onPress={() => void choose()}
        />
        <Button
          testID="ticket-link"
          title={t('tickets.link')}
          variant="secondary"
          icon="link-outline"
          size="sm"
          onPress={() => setPickerOpen(true)}
        />
        {hasFile ? (
          <Button
            testID="ticket-unlink"
            title={t('tickets.unlink')}
            variant="ghost"
            size="sm"
            onPress={() => {
              setFile(null);
              setUploaded(null);
              setLinkChange(null);
            }}
          />
        ) : null}
      </View>
    </FormSection>
  );

  return (
    <>
      <EntitySheet
        size="lg"
        icon="ticket-outline"
        tint="amber"
        testID="ticket-sheet"
        visible={visible}
        title={ticket ? t('bookings.editTicket') : t('bookings.addTicket')}
        submitLabel={stage ? t(STAGE_KEY[stage]) : t('common.save')}
        onClose={close}
        onSubmit={() => void submit()}
        isSubmitting={busy}
        error={error}
        {...(ticket ? { onDelete: () => void askDelete() } : {})}
      >
        <SplitForm
          wide={wide}
          side={
            <LocationPreview
              tripId={tripId}
              location={preview.location}
              exact={preview.exact}
              wide={wide}
            />
          }
        >
          {fileBlock}
          <FormSection title={t('content.sec.basic')}>
            <FormTextField
              control={control}
              name="name"
              label={t('bookings.ticketName')}
              testID="ticket-name"
            />
            <FieldRow>
              <FormSelectField
                control={control}
                name="kind"
                label={t('bookings.ticketKind')}
                title={t('bookings.ticketKind')}
                options={TICKET_KINDS.map((value) => ({
                  value,
                  label: t(`enums.ticketKind.${value}`),
                }))}
                testID="ticket-kind"
              />
              <FormTextField
                control={control}
                name="quantity"
                label={t('bookings.quantity')}
                keyboardType="number-pad"
                testID="ticket-quantity"
              />
            </FieldRow>
          </FormSection>
          <FormSection title={t('bookings.venue')}>
            {ticket ? null : <PlaceSearch onPick={pickPlace} testID="ticket-place-search" />}
            <FormTextField
              control={control}
              name="venue"
              label={t('bookings.venueName')}
              testID="ticket-venue"
            />
            <FormTextField control={control} name="address" label={t('content.address')} />
          </FormSection>
          <FormSection title={t('content.sec.when')}>
            <FieldRow>
              <FormDateField
                control={control}
                name="date"
                label={t('bookings.ticketDate')}
                testID="ticket-date"
              />
              <FormTimeField
                control={control}
                name="startTime"
                label={t('bookings.ticketStart')}
                hint={t('content.timeHint')}
              />
              <FormTimeField control={control} name="endTime" label={t('bookings.ticketEnd')} />
            </FieldRow>
          </FormSection>
          <FormSection title={t('content.sec.booking')}>
            <FieldRow>
              <FormTextField
                control={control}
                name="confirmationCode"
                label={t('bookings.confirmation')}
                autoCapitalize="characters"
              />
              <FormTextField control={control} name="seat" label={t('bookings.ticketSeat')} />
            </FieldRow>
            <FieldRow>
              <FormTextField
                control={control}
                name="cost"
                label={t('content.cost')}
                hint={t('content.costHint', { currency })}
                keyboardType="decimal-pad"
              />
              <FormSelectField
                control={control}
                name="status"
                label={t('content.status')}
                title={t('content.status')}
                options={TICKET_STATUSES.map((value) => ({
                  value,
                  label: t(`enums.status.${value}`),
                }))}
              />
            </FieldRow>
            <FormTextField control={control} name="notes" label={t('content.notes')} multiline />
          </FormSection>
        </SplitForm>
      </EntitySheet>
      <DocumentPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        documents={documents.data ?? []}
        selected={linkedId}
        onPick={(document) => {
          setFile(null);
          setUploaded(null);
          setLinkChange(document.id);
          setPickerOpen(false);
        }}
      />
    </>
  );
}

interface DocumentPickerProps {
  visible: boolean;
  onClose: () => void;
  documents: Document[];
  selected: string | null;
  onPick: (document: Document) => void;
}

/** The documents already in the trip that can be attached: finished files, tickets first. */
function DocumentPicker({ visible, onClose, documents, selected, onPick }: DocumentPickerProps) {
  const { t } = useTranslation();
  const ready = documents
    .filter((document) => document.status === 'READY')
    .sort((a, b) => Number(b.type === 'TICKET') - Number(a.type === 'TICKET'));
  return (
    <Sheet visible={visible} onClose={onClose} title={t('tickets.linkTitle')}>
      {ready.length === 0 ? (
        <Text tone="secondary" testID="ticket-link-empty">
          {t('tickets.linkEmpty')}
        </Text>
      ) : (
        <Card padded={false}>
          {ready.map((document, index) => (
            <ListRow
              key={document.id}
              testID={`ticket-link-${document.id}`}
              divider={index > 0}
              icon={document.id === selected ? 'checkmark-circle' : 'document-outline'}
              title={document.name}
              subtitle={`${t(`enums.docType.${document.type}`)} · ${document.fileName}`}
              onPress={() => onPick(document)}
            />
          ))}
        </Card>
      )}
    </Sheet>
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
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
