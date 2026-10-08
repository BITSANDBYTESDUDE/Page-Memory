import type { ReadingPositionUpdate } from '../types/reading';
import type { PageRecord, UpdatePageInput } from '../storage/models';

export interface ReadingProgressRepository {
  getPageByUrl: (url: string) => Promise<PageRecord | null>;
  updatePage: (id: string, input: UpdatePageInput) => Promise<PageRecord>;
}

type TimerId = ReturnType<typeof globalThis.setTimeout>;

type TimerScheduler = {
  readonly setTimeout: (handler: () => void, timeoutMs: number) => TimerId;
  readonly clearTimeout: (timerId: TimerId) => void;
};

type PendingUpdate = {
  readonly update: ReadingPositionUpdate;
  readonly timer?: TimerId;
};

export type ReadingProgressPersisterOptions = {
  readonly debounceMs?: number;
  readonly scheduler?: TimerScheduler;
  readonly now?: () => string;
};

const DEFAULT_DEBOUNCE_MS = 1_000;

const defaultScheduler: TimerScheduler = {
  setTimeout: (handler, timeoutMs) => globalThis.setTimeout(handler, timeoutMs),
  clearTimeout: (timerId) => globalThis.clearTimeout(timerId),
};

const persistenceKey = (url: string): string => {
  try {
    const normalized = new URL(url);
    normalized.hash = '';
    return normalized.href;
  } catch {
    return url;
  }
};

const toPercent = (progress: number): number =>
  Math.min(Math.max(Number.isFinite(progress) ? progress * 100 : 0, 0), 100);

const toNonNegativeFinite = (value: number): number =>
  Number.isFinite(value) ? Math.max(value, 0) : 0;

export class ReadingProgressPersister {
  private readonly pending = new Map<string, PendingUpdate>();
  private readonly debounceMs: number;
  private readonly scheduler: TimerScheduler;
  private readonly now: () => string;

  constructor(
    private readonly repository: ReadingProgressRepository,
    options: ReadingProgressPersisterOptions = {},
  ) {
    this.debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
    this.scheduler = options.scheduler ?? defaultScheduler;
    this.now = options.now ?? (() => new Date().toISOString());
  }

  schedule(update: ReadingPositionUpdate): void {
    const key = persistenceKey(update.url);
    const existing = this.pending.get(key);
    if (existing?.timer !== undefined) {
      this.scheduler.clearTimeout(existing.timer);
    }

    if (update.isFinal) {
      this.pending.set(key, { update });
      void this.flush(key).catch(() => undefined);
      return;
    }

    const timer = this.scheduler.setTimeout(() => {
      void this.flush(key).catch(() => undefined);
    }, this.debounceMs);
    this.pending.set(key, { update, timer });
  }

  async flushAll(): Promise<void> {
    await Promise.all([...this.pending.keys()].map((key) => this.flush(key)));
  }

  private async flush(key: string): Promise<void> {
    const pending = this.pending.get(key);
    if (!pending) {
      return;
    }
    this.pending.delete(key);

    const savedPage = await this.repository.getPageByUrl(pending.update.url);
    if (!savedPage) {
      return;
    }

    await this.repository.updatePage(savedPage.id, {
      progress: toPercent(pending.update.progress),
      scrollY: toNonNegativeFinite(pending.update.scrollY),
      scrollHeight: toNonNegativeFinite(pending.update.scrollHeight),
      lastReadAt: this.now(),
    });
  }
}
