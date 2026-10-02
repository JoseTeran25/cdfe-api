export const APP_TIMEZONE = process.env.APP_TIMEZONE ?? 'America/Guayaquil';

function zonedParts(date: Date): Record<string, number> {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, Number(p.value)]),
  );
}

/** Fecha calendario (YYYY-MM-DD) de un instante, en la zona horaria de la iglesia. */
export function toLocalDateKey(date: Date): string {
  const p = zonedParts(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Instante UTC que corresponde a la medianoche local del día dado (mes 1-12; admite desbordes, ej. mes 13). */
export function localMidnightToUtc(year: number, month: number, day = 1): Date {
  const guess = Date.UTC(year, month - 1, day);
  const p = zonedParts(new Date(guess));
  const offset = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - guess;
  return new Date(guess - offset);
}
