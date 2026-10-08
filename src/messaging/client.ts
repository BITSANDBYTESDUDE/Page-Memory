import type { PageInfo, ReadingProgress, RuntimeReply, RuntimeRequest } from '../types';
import { sendRuntimeMessage } from './chrome';

function request<K extends RuntimeRequest['type']>(
  message: RuntimeRequest<K>,
): Promise<RuntimeReply<K>> {
  return sendRuntimeMessage(message);
}

export function getCurrentPage(): Promise<RuntimeReply<'GET_CURRENT_PAGE'>> {
  return request({ type: 'GET_CURRENT_PAGE' });
}

export function savePage(page: PageInfo): Promise<RuntimeReply<'SAVE_PAGE'>> {
  return request({ type: 'SAVE_PAGE', payload: page });
}

export function getPage(url: string): Promise<RuntimeReply<'GET_PAGE'>> {
  return request({ type: 'GET_PAGE', payload: { url } });
}

export function getPages(): Promise<RuntimeReply<'GET_PAGES'>> {
  return request({ type: 'GET_PAGES' });
}

export function getReadingState(url: string): Promise<RuntimeReply<'GET_READING_STATE'>> {
  return request({ type: 'GET_READING_STATE', payload: { url } });
}

export function updateProgress(
  progress: ReadingProgress,
): Promise<RuntimeReply<'UPDATE_PROGRESS'>> {
  return request({ type: 'UPDATE_PROGRESS', payload: progress });
}

export function restorePosition(
  url: string,
  scrollY: number,
): Promise<RuntimeReply<'RESTORE_POSITION'>> {
  return request({ type: 'RESTORE_POSITION', payload: { url, scrollY } });
}
