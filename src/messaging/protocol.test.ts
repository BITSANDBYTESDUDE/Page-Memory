import { describe, expect, it } from 'vitest';
import { isRuntimeReply, parseRuntimeRequest, success } from './protocol';

describe('favorite runtime protocol', () => {
  it('parses valid favorite updates and rejects invalid payloads', () => {
    expect(
      parseRuntimeRequest({
        type: 'UPDATE_FAVORITE',
        payload: { id: 'page-1', isFavorite: true },
      }),
    ).toEqual({
      type: 'UPDATE_FAVORITE',
      payload: { id: 'page-1', isFavorite: true },
    });
    expect(
      parseRuntimeRequest({
        type: 'UPDATE_FAVORITE',
        payload: { id: 'page-1', isFavorite: 'yes' },
      }),
    ).toBeNull();
  });

  it('validates favorite status in saved-page summaries', () => {
    expect(
      isRuntimeReply(
        success('GET_PAGES', [
          {
            id: 'page-1',
            url: 'https://example.com',
            canonicalUrl: 'https://example.com',
            title: 'Example',
            domain: 'example.com',
            favicon: null,
            progress: 0,
            lastReadAt: null,
            isFavorite: true,
          },
        ]),
        'GET_PAGES',
      ),
    ).toBe(true);
  });
});
