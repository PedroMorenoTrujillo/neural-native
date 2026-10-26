export function isoDate(value: string): Date | null {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return null;
  const d = new Date(value + 'T12:00:00Z');
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value
    ? null
    : d;
}
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
export function monthCells(
  month: string,
  firstDay = 1,
): readonly { date: string; day: number; current: boolean }[] {
  const start = isoDate(month + '-01');
  if (!start) return [];
  const offset = (start.getUTCDay() - firstDay + 7) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(i - offset + 1);
    return {
      date: d.toISOString().slice(0, 10),
      day: d.getUTCDate(),
      current: d.getUTCMonth() === start.getUTCMonth(),
    };
  });
}
export function shiftMonth(month: string, delta: number): string {
  const d = isoDate(month + '-01');
  if (!d) return todayISO().slice(0, 7);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 7);
}
