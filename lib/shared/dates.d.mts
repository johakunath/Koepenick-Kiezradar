export const TIME_ZONE: string;
export function berlinDay(value?: string | Date | number): string;
export function addDays(day: string, count: number): string;
export function berlinDateTime(year: number, month: number, day: number, hour?: number, minute?: number): string | null;
export function parseSourceDate(text: string): { iso: string; precision: "time" | "day" } | null;
export function eventDateFromTitle(title: string, publishedAt?: string): { iso: string; precision: "time" | "day"; inferredYear?: boolean } | null;
