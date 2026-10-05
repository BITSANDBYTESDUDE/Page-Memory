export type ExtensionPage = 'popup' | 'options';

export const MESSAGE_TYPES = [
  'GET_CURRENT_PAGE',
  'SAVE_PAGE',
  'GET_PAGE',
  'UPDATE_PROGRESS',
  'RESTORE_POSITION',
] as const;

export type MessageType = (typeof MESSAGE_TYPES)[number];

export interface PageInfo {
  readonly pageId: string;
  readonly url: string;
  readonly canonicalUrl: string;
  readonly title: string;
  readonly hostname: string;
  readonly domain: string;
  readonly favicon: string | null;
}

export type PageMetadata = PageInfo;

export interface PageLookupResult {
  readonly isSaved: boolean;
}

export interface PageSaveResult {
  readonly pageId: string;
  readonly created: boolean;
  readonly lastReadAt: string;
}

export interface ReadingProgress {
  readonly url: string;
  readonly progressPercent: number;
  readonly scrollY: number;
}

export interface RequestPayloads {
  readonly GET_CURRENT_PAGE: undefined;
  readonly SAVE_PAGE: PageInfo;
  readonly GET_PAGE: { readonly url: string };
  readonly UPDATE_PROGRESS: ReadingProgress;
  readonly RESTORE_POSITION: { readonly url: string; readonly scrollY: number };
}

export interface ResponsePayloads {
  readonly GET_CURRENT_PAGE: PageInfo;
  readonly SAVE_PAGE: PageSaveResult;
  readonly GET_PAGE: PageLookupResult;
  readonly UPDATE_PROGRESS: null;
  readonly RESTORE_POSITION: null;
}

export type RuntimeRequest<K extends MessageType = MessageType> = {
  [T in K]: RequestPayloads[T] extends undefined
    ? { readonly type: T }
    : { readonly type: T; readonly payload: RequestPayloads[T] };
}[K];

export interface RuntimeError {
  readonly code:
    | 'INVALID_REQUEST'
    | 'NOT_IMPLEMENTED'
    | 'ACTIVE_TAB_UNAVAILABLE'
    | 'CONTENT_SCRIPT_UNAVAILABLE'
    | 'INTERNAL';
  readonly message: string;
}

export type RuntimeReply<K extends MessageType = MessageType> = {
  [T in K]:
    | { readonly type: T; readonly ok: true; readonly value: ResponsePayloads[T] }
    | { readonly type: T; readonly ok: false; readonly error: RuntimeError };
}[K];
