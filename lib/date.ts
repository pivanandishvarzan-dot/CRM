export const persianDateFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' });
export const persianDateTimeFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
export const persianWeekdayDateTimeFormatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

export function formatPersianDate(value: Date | string | number | null | undefined) {
  if (value == null || value === '') return '—';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : persianDateFormatter.format(date);
}

export function formatPersianDateTime(value: Date | string | number | null | undefined, weekday = true) {
  if (value == null || value === '') return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return (weekday ? persianWeekdayDateTimeFormatter : persianDateTimeFormatter).format(date);
}
