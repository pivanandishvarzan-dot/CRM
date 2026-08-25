export class ValidationError extends Error {
  constructor(message: string) { super(message); this.name = 'ValidationError'; }
}

export function text(value: unknown, field: string, max = 200) {
  const result = String(value ?? '').trim();
  if (!result) throw new ValidationError(`${field} الزامی است.`);
  if (result.length > max) throw new ValidationError(`${field} بیش از حد طولانی است.`);
  return result;
}

export function optionalText(value: unknown, max = 1000) {
  if (value == null || value === '') return undefined;
  const result = String(value).trim();
  if (result.length > max) throw new ValidationError('متن واردشده بیش از حد طولانی است.');
  return result;
}

export function finiteNumber(value: unknown, field: string, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const result = Number(value);
  if (!Number.isFinite(result) || result < min || result > max) throw new ValidationError(`${field} معتبر نیست.`);
  return result;
}

export function optionalId(value: unknown) {
  if (value == null || value === '') return undefined;
  const result = String(value).trim();
  if (result.length > 100) throw new ValidationError('شناسه معتبر نیست.');
  return result;
}

export function stringArray(value: unknown, maxItems = 30, itemMax = 100) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > maxItems) throw new ValidationError('لیست واردشده معتبر نیست.');
  return value.map(item => text(item, 'مقدار', itemMax));
}

export function dateTime(value: unknown, field: string) {
  const result = new Date(String(value ?? ''));
  if (Number.isNaN(result.getTime())) throw new ValidationError(`${field} معتبر نیست.`);
  return result.toISOString();
}

export function apiError(error: unknown, fallback: string) {
  if (error instanceof ValidationError) return { status: 400, message: error.message };
  if (error instanceof Error && error.message === 'UNAUTHORIZED') return { status: 401, message: 'نیاز به ورود دارید.' };
  if (error instanceof Error && error.message === 'FORBIDDEN') return { status: 403, message: 'دسترسی مجاز نیست.' };
  if (error instanceof Error && error.message === 'NOT_FOUND') return { status: 404, message: 'رکورد پیدا نشد.' };
  return { status: 500, message: fallback };
}
