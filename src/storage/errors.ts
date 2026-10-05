export type StorageErrorCode =
  | 'READ_FAILED'
  | 'WRITE_FAILED'
  | 'INVALID_DATA'
  | 'UNSUPPORTED_SCHEMA'
  | 'INVALID_INPUT'
  | 'NOT_FOUND'
  | 'DUPLICATE_PAGE';

export class StorageError extends Error {
  constructor(
    readonly code: StorageErrorCode,
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
