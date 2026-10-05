export interface NormalizedPageUrl {
  readonly url: string;
  readonly canonicalUrl: string;
  readonly hostname: string;
  readonly domain: string;
}

export class UrlNormalizationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UrlNormalizationError';
  }
}

const EMBEDDED_OR_RECIPIENT_URL_SCHEMES = new Set(['data:', 'javascript:', 'mailto:']);

export function normalizePageUrl(value: string): NormalizedPageUrl {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch (error: unknown) {
    throw new UrlNormalizationError('The page URL is invalid.', { cause: error });
  }

  if (EMBEDDED_OR_RECIPIENT_URL_SCHEMES.has(parsed.protocol.toLowerCase())) {
    throw new UrlNormalizationError(
      `The ${parsed.protocol.slice(0, -1)} URL scheme is not stored to protect private content.`,
    );
  }

  parsed.username = '';
  parsed.password = '';
  const url = parsed.toString();
  parsed.hash = '';
  const canonicalUrl = parsed.toString();
  const hostname = parsed.hostname;

  return {
    url,
    canonicalUrl,
    hostname,
    domain: hostname || parsed.protocol.slice(0, -1),
  };
}
