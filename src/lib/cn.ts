/** Join conditional class names, dropping anything falsy. */
export const cn = (...values: (string | false | null | undefined)[]): string =>
  values.filter(Boolean).join(' ');
