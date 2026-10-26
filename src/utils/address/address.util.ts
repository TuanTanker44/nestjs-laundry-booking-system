export interface ParsedAddress {
  ward: string | null;
  district: string | null;
  city: string | null;
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function normalizeForComparison(value: string): string {
  return normalizeText(value)
    .toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function normalizeArea(
  value: string | null | undefined,
): string {
  if (!value) {
    return '';
  }

  return normalizeForComparison(value)
    .replace(/\b(thanh pho|tp\.?)\s+/g, '')
    .replace(/\b(tinh)\s+/g, '')
    .replace(/\b(quan|q\.?)\s+/g, '')
    .replace(/\b(huyen|h\.?)\s+/g, '')
    .replace(/\b(phuong|p\.?)\s+/g, '')
    .replace(/\b(xa|x\.?)\s+/g, '')
    .replace(/\b(thi tran|tt\.?)\s+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAreaName(
  segments: string[],
  patterns: RegExp[],
): string | null {
  for (const segment of segments) {
    const normalized = normalizeText(segment);

    for (const pattern of patterns) {
      const match = normalized.match(pattern);

      if (match?.[1]) {
        return normalizeText(match[1]);
      }
    }
  }

  return null;
}

export function parseAddress(address: string): ParsedAddress {
  const segments = address
    .split(',')
    .map(normalizeText)
    .filter(Boolean);

  const ward = extractAreaName(segments, [
    /^(?:phường|p\.?)\s+(.+)$/iu,
    /^(?:xã|x\.)\s+(.+)$/iu,
    /^(?:thị trấn|tt\.?)\s+(.+)$/iu,
  ]);

  const district = extractAreaName(segments, [
    /^(?:quận|q\.?)\s+(.+)$/iu,
    /^(?:huyện|h\.?)\s+(.+)$/iu,
    /^(?:thị xã|tx\.?)\s+(.+)$/iu,
  ]);

  let city = extractAreaName(segments, [
    /^(?:thành phố|tp\.?)\s+(.+)$/iu,
    /^(?:tỉnh)\s+(.+)$/iu,
  ]);

  if (!city && segments.length > 0) {
    const lastSegment = normalizeArea(
      segments[segments.length - 1],
    );

    const knownCities = [
      'ha noi',
      'ho chi minh',
      'da nang',
      'hai phong',
      'can tho',
    ];

    if (knownCities.includes(lastSegment)) {
      city = segments[segments.length - 1];
    }
  }

  return {
    ward,
    district,
    city,
  };
}