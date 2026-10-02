const APP_TIMEZONE = process.env.APP_TIMEZONE ?? 'America/Guayaquil';

/** Fecha calendario (YYYY-MM-DD) de un instante, en la zona horaria de la iglesia. */
export function toLocalDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
