import type { Entry, SourceReference } from "../types";
export function canonicalSourceUrl(value: string): string;
export function entryIdentity(entry: Entry): string;
export function sourceReferences(entry: Entry): SourceReference[];
export function consolidateEntries(entries: Entry[]): Entry[];
