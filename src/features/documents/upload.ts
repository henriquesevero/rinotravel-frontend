import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import { Linking } from 'react-native';

import { NetworkError, toApiError, type DocumentType, type DocumentVisibility } from '@/core/api';
import { newId } from '@/core/ids';

import { documentsApi } from './api';

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const ALLOWED_MIME = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

export type UploadStage = 'reading' | 'uploading' | 'finishing';

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

/** Opens the system picker. Returns null when the person cancels. */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ALLOWED_MIME,
    multiple: false,
    copyToCacheDirectory: true,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return null;
  return {
    uri: asset.uri,
    name: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    size: asset.size ?? 0,
  };
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface UploadInput {
  tripId: string;
  file: PickedFile;
  name: string;
  type: DocumentType;
  visibility: DocumentVisibility;
  onStage?: (stage: UploadStage) => void;
}

/**
 * Registers the document, sends the bytes to the signed link, then asks the server to confirm.
 * The server checks size and SHA-256 itself, so a corrupted upload can never become READY.
 */
export async function uploadDocument({
  tripId,
  file,
  name,
  type,
  visibility,
  onStage,
}: UploadInput) {
  onStage?.('reading');
  const bytes = await (await fetch(file.uri)).arrayBuffer();
  const checksum = toHex(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes));

  const { document, upload } = await documentsApi.init(tripId, {
    id: newId(),
    name,
    type,
    fileName: file.name,
    mimeType: file.mimeType,
    size: bytes.byteLength,
    checksum,
    visibility,
  });

  onStage?.('uploading');
  let response: Response;
  try {
    response = await fetch(upload.url, {
      method: upload.method,
      headers: upload.headers ?? {},
      body: bytes,
    });
  } catch (cause) {
    throw new NetworkError({ cause });
  }
  if (!response.ok) throw toApiError(response, await response.json().catch(() => null));

  onStage?.('finishing');
  return documentsApi.complete(tripId, document.id);
}

/** Signed links are short-lived, so one is requested per download and handed to the system. */
export async function openDocument(tripId: string, id: string): Promise<void> {
  const { download } = await documentsApi.download(tripId, id);
  await Linking.openURL(download.url);
}
