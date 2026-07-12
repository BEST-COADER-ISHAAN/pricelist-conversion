function titleCase(str: string): string {
  return str
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function parseProductNames(input: string): string[] {
  if (!input.trim()) return [];

  const normalized = input.replace(/\s+/g, ' ').trim();
  const results: string[] = [];
  const groupRegex = /([A-Za-z][A-Za-z\s]*?)\s*\(([^)]+)\)/g;

  let match: RegExpExecArray | null;
  let lastIndex = 0;
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
    lastIndex = match.index + match[0].length;
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
      results.push(titleCase(name));
    }
  }

  return results;
}
