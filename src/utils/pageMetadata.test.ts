import { describe, expect, it } from 'vitest';
import { extractPageMetadata, type MetadataDocument } from './pageMetadata';
import { normalizePageUrl, UrlNormalizationError } from './url';

class FakeMetadataDocument implements MetadataDocument {
  constructor(
    readonly title: string,
    private readonly links: Readonly<Record<string, string | null>> = {},
  ) {}

  querySelector(selector: string): Pick<Element, 'getAttribute'> | null {
    const href = this.links[selector];
    if (href === undefined) return null;
    return { getAttribute: () => href };
  }
}

describe('normalizePageUrl', () => {
  it('normalizes the address while preserving query parameters and removing fragments canonically', () => {
    expect(normalizePageUrl('HTTPS://Example.COM:443/article?edition=2#chapter')).toEqual({
      url: 'https://example.com/article?edition=2#chapter',
      canonicalUrl: 'https://example.com/article?edition=2',
      hostname: 'example.com',
      domain: 'example.com',
    });
  });

  it('normalizes host casing, credentials, and default ports', () => {
    expect(normalizePageUrl('https://reader:secret@EXAMPLE.com:443/story?x=1')).toEqual({
      url: 'https://example.com/story?x=1',
      canonicalUrl: 'https://example.com/story?x=1',
      hostname: 'example.com',
      domain: 'example.com',
    });
  });

  it('supports unusual hostless URLs without inventing a hostname', () => {
    expect(normalizePageUrl('file:///C:/articles/readme.html#part')).toEqual({
      url: 'file:///C:/articles/readme.html#part',
      canonicalUrl: 'file:///C:/articles/readme.html',
      hostname: '',
      domain: 'file',
    });
    expect(normalizePageUrl('about:blank')).toMatchObject({
      canonicalUrl: 'about:blank',
      hostname: '',
      domain: 'about',
    });
  });

  it('rejects malformed and embedded or recipient URL schemes', () => {
    expect(() => normalizePageUrl('not a URL')).toThrow(UrlNormalizationError);
    expect(() => normalizePageUrl('data:text/html,<h1>Private content</h1>')).toThrow(
      'not stored to protect private content',
    );
    expect(() => normalizePageUrl('mailto:person@example.com')).toThrow(
      'not stored to protect private content',
    );
  });
});

describe('extractPageMetadata', () => {
  it('extracts only page metadata and resolves relative canonical and favicon links', () => {
    const document = new FakeMetadataDocument('Article title', {
      'link[rel~="canonical" i]': '../story?edition=3#top',
      'link[rel~="icon" i]': '/icons/site.png',
    });

    expect(
      extractPageMetadata(document, 'https://example.com/section/current?edition=1#read', 'page-123'),
    ).toEqual({
      pageId: 'page-123',
      url: 'https://example.com/section/current?edition=1#read',
      canonicalUrl: 'https://example.com/story?edition=3',
      title: 'Article title',
      hostname: 'example.com',
      domain: 'example.com',
      favicon: 'https://example.com/icons/site.png',
    });
  });

  it('falls back to the current URL when canonical metadata is missing or invalid', () => {
    const missingCanonical = new FakeMetadataDocument('Fallback title');
    expect(
      extractPageMetadata(missingCanonical, 'https://example.com/read?source=direct#part', 'id'),
    ).toMatchObject({
      canonicalUrl: 'https://example.com/read?source=direct',
      title: 'Fallback title',
    });

    const invalidCanonical = new FakeMetadataDocument('Title', {
      'link[rel~="canonical" i]': 'data:text/plain,private',
    });
    expect(
      extractPageMetadata(invalidCanonical, 'https://example.com/read#part', 'id').canonicalUrl,
    ).toBe('https://example.com/read');
  });

  it('returns a null favicon when it is missing or not a web URL', () => {
    expect(
      extractPageMetadata(
        new FakeMetadataDocument('No icon'),
        'https://example.com/page',
        'page-id',
      ).favicon,
    ).toBeNull();

    expect(
      extractPageMetadata(
        new FakeMetadataDocument('Data icon', {
          'link[rel~="icon" i]': 'data:image/png;base64,AAAA',
        }),
        'https://example.com/page',
        'page-id',
      ).favicon,
    ).toBeNull();
  });

  it('does not read page body or form data', () => {
    const document = new FakeMetadataDocument('Metadata only');
    const metadata = extractPageMetadata(document, 'https://example.com/page', 'page-id');

    expect(Object.keys(metadata).sort()).toEqual(
      ['canonicalUrl', 'domain', 'favicon', 'hostname', 'pageId', 'title', 'url'].sort(),
    );
  });
});
