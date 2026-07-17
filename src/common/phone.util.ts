/** Deja solo dígitos, para poder comparar números venidos de distintas fuentes (formularios, Nexo, etc). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}
