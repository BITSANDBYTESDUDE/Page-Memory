import {
  MESSAGE_TYPES,
  type MessageType,
  type PageInfo,
  type ResponsePayloads,
  type RuntimeError,
  type RuntimeReply,
  type RuntimeRequest,
  type SavedPageSummary,
  type StoredReadingState,
} from '../types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isPageInfo = (value: unknown): value is PageInfo =>
  isRecord(value) &&
  typeof value.pageId === 'string' &&
  typeof value.url === 'string' &&
  typeof value.canonicalUrl === 'string' &&
  typeof value.title === 'string' &&
  typeof value.hostname === 'string' &&
  typeof value.domain === 'string' &&
  (typeof value.favicon === 'string' || value.favicon === null);

const isSavedPageSummary = (value: unknown): value is SavedPageSummary =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.url === 'string' &&
  typeof value.canonicalUrl === 'string' &&
  typeof value.title === 'string' &&
  typeof value.domain === 'string' &&
  (typeof value.favicon === 'string' || value.favicon === null) &&
  typeof value.progress === 'number' &&
  Number.isFinite(value.progress) &&
  (typeof value.lastReadAt === 'string' || value.lastReadAt === null);

const isStoredReadingState = (value: unknown): value is StoredReadingState =>
  value === null ||
  (isRecord(value) &&
    typeof value.scrollY === 'number' &&
    Number.isFinite(value.scrollY) &&
    typeof value.scrollHeight === 'number' &&
    Number.isFinite(value.scrollHeight) &&
    typeof value.progress === 'number' &&
    Number.isFinite(value.progress) &&
    (typeof value.lastReadAt === 'string' || value.lastReadAt === null));

const isMessageType = (value: unknown): value is MessageType =>
  typeof value === 'string' && MESSAGE_TYPES.some((type) => type === value);

const isRuntimeErrorCode = (value: unknown): value is RuntimeError['code'] =>
  value === 'INVALID_REQUEST' ||
  value === 'NOT_IMPLEMENTED' ||
  value === 'ACTIVE_TAB_UNAVAILABLE' ||
  value === 'CONTENT_SCRIPT_UNAVAILABLE' ||
  value === 'INTERNAL';

export function parseRuntimeRequest(value: unknown): RuntimeRequest | null {
  if (!isRecord(value) || !isMessageType(value.type)) return null;

  switch (value.type) {
    case 'GET_CURRENT_PAGE':
      return { type: value.type };
    case 'SAVE_PAGE':
      return isPageInfo(value.payload) ? { type: value.type, payload: value.payload } : null;
    case 'GET_PAGE':
      return isRecord(value.payload) && typeof value.payload.url === 'string'
        ? { type: value.type, payload: { url: value.payload.url } }
        : null;
    case 'GET_PAGES':
      return { type: value.type };
    case 'GET_READING_STATE':
      return isRecord(value.payload) && typeof value.payload.url === 'string'
        ? { type: value.type, payload: { url: value.payload.url } }
        : null;
    case 'UPDATE_PROGRESS':
      return isRecord(value.payload) &&
        typeof value.payload.url === 'string' &&
        typeof value.payload.progressPercent === 'number' &&
        Number.isFinite(value.payload.progressPercent) &&
        typeof value.payload.scrollY === 'number' &&
        Number.isFinite(value.payload.scrollY)
        ? {
            type: value.type,
            payload: {
              url: value.payload.url,
              progressPercent: value.payload.progressPercent,
              scrollY: value.payload.scrollY,
            },
          }
        : null;
    case 'RESTORE_POSITION':
      return isRecord(value.payload) &&
        typeof value.payload.url === 'string' &&
        typeof value.payload.scrollY === 'number' &&
        Number.isFinite(value.payload.scrollY)
        ? {
            type: value.type,
            payload: { url: value.payload.url, scrollY: value.payload.scrollY },
          }
        : null;
  }
}

export function isRuntimeReply<K extends MessageType>(
  value: unknown,
  type: K,
): value is RuntimeReply<K> {
  if (!isRecord(value) || value.type !== type || typeof value.ok !== 'boolean') return false;

  if (!value.ok) {
    return (
      isRecord(value.error) &&
      isRuntimeErrorCode(value.error.code) &&
      typeof value.error.message === 'string'
    );
  }

  switch (type) {
    case 'GET_CURRENT_PAGE':
      return isPageInfo(value.value);
    case 'GET_PAGE':
      return isRecord(value.value) && typeof value.value.isSaved === 'boolean';
    case 'GET_PAGES':
      return Array.isArray(value.value) && value.value.every(isSavedPageSummary);
    case 'GET_READING_STATE':
      return isStoredReadingState(value.value);
    case 'SAVE_PAGE':
      return (
        isRecord(value.value) &&
        typeof value.value.pageId === 'string' &&
        typeof value.value.created === 'boolean' &&
        typeof value.value.lastReadAt === 'string'
      );
    case 'UPDATE_PROGRESS':
    case 'RESTORE_POSITION':
      return value.value === null;
  }
}

export function success<K extends MessageType>(
  type: K,
  value: ResponsePayloads[K],
): RuntimeReply<K> {
  return { type, ok: true, value } as RuntimeReply<K>;
}

export function failure<K extends MessageType>(
  type: K,
  code: RuntimeError['code'],
  message: string,
): RuntimeReply<K> {
  return { type, ok: false, error: { code, message } } as RuntimeReply<K>;
}

export function failureForRequest(
  request: RuntimeRequest,
  code: RuntimeError['code'],
  message: string,
): RuntimeReply {
  return failure(request.type, code, message);
}
