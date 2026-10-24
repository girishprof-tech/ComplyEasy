import type { ActivityEntry } from '@/types';

export interface ActivityGroup {
  label: string;
  items: ActivityEntry[];
}

/** "Today" / "Yesterday" / "Oct 3, 2026" for a SQLite UTC timestamp ("YYYY-MM-DD HH:MM:SS"). */
export function dayLabel(createdAt: string, now: Date = new Date()): string {
  const entryDate = new Date(createdAt.replace(' ', 'T') + 'Z');
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (entryDate.toDateString() === now.toDateString()) return 'Today';
  if (entryDate.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return entryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Groups consecutive entries (already newest-first) under their day label. */
export function groupActivity(entries: ActivityEntry[], now: Date = new Date()): ActivityGroup[] {
  const groups: ActivityGroup[] = [];
  for (const entry of entries) {
    const label = dayLabel(entry.createdAt, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(entry);
    else groups.push({ label, items: [entry] });
  }
  return groups;
}
