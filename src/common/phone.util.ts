/**
 * Deja solo dígitos y normaliza al formato internacional de Ecuador, para poder comparar
 * números venidos de distintas fuentes (formularios locales tipo "0987654321" vs. el
 * "593987654321" que resuelve WhatsApp/Nexo). Si el número no calza con ese patrón local,
 * se deja tal cual (ya viene en formato internacional u otro país).
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('0')) {
    return '593' + digits.slice(1);
  }
  return digits;
}
