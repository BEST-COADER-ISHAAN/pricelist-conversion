function titleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

interface RangeToken {
  prefix: string;
  num: number;
  padWidth: number;
}

function parseRangeToken(token: string): RangeToken | null {
  const match = token.trim().match(/^(.+?)(\d+)$/);
  if (!match) return null;

  return {
    prefix: match[1],
    num: Number.parseInt(match[2], 10),
    padWidth: match[2].length,
  };
}

function expandRange(startToken: string, endToken: string): string[] | null {
  const start = parseRangeToken(startToken);
  const end = parseRangeToken(endToken);
  if (!start || !end) return null;
  if (start.prefix !== end.prefix) return null;
  if (start.num > end.num) return null;

  const count = end.num - start.num + 1;
  if (count > 500) return null;

  const padWidth = Math.max(start.padWidth, end.padWidth);
  const results: string[] = [];

  for (let i = start.num; i <= end.num; i++) {
    results.push(`${start.prefix}${String(i).padStart(padWidth, '0')}`);
  }

  return results;
}

function parseStandaloneSegment(segment: string): string[] {
  const rangeMatch = segment.match(/^(.+?)\s+to\s+(.+)$/i);
  if (rangeMatch) {
    const expanded = expandRange(rangeMatch[1], rangeMatch[2]);
    if (expanded) return expanded;
  }

  return [titleCase(segment)];
}

export function parseProductNames(input: string): string[] {
  if (!input.trim()) return [];

  const normalized = input.replace(/\s+/g, ' ').trim();
  const results: string[] = [];
  const groupRegex = /([A-Za-z][A-Za-z\s]*?)\s*\(([^)]+)\)/g;

  let match: RegExpExecArray | null;
  const consumedRanges: Array<[number, number]> = [];

  while ((match = groupRegex.exec(normalized)) !== null) {
    const collection = titleCase(match[1].trim());
    const variants = match[2]
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    for (const variant of variants) {
      results.push(`${collection} ${titleCase(variant)}`);
    }

    consumedRanges.push([match.index, match.index + match[0].length]);
  }

  let remainder = normalized;
  for (const [start, end] of consumedRanges.sort((a, b) => b[0] - a[0])) {
    remainder = remainder.slice(0, start) + remainder.slice(end);
  }
  remainder = remainder.trim();

  if (remainder) {
    const standalone = remainder
      .split(',')
      .map((s) => s.replace(/\s+/g, ' ').trim())
      .filter(Boolean);

    for (const name of standalone) {
      results.push(...parseStandaloneSegment(name));
    }
  }

  return results;
}
