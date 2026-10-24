import { describe, expect, it } from 'vitest';
import { groupActivity } from './groupActivity';

describe('groupActivity', () => {
  it('groups consecutive entries by day', () => {
    const now = new Date('2026-10-22T12:00:00Z');
    const mk = (id: number, createdAt: string) => ({ id, eventType: 'x', description: `e${id}`, createdAt });
    const groups = groupActivity(
      [mk(3, '2026-10-22 09:00:00'), mk(2, '2026-10-22 08:00:00'), mk(1, '2026-10-21 12:00:00')],
      now
    );
    expect(groups.map((g) => [g.label, g.items.length])).toEqual([
      ['Today', 2],
      ['Yesterday', 1],
    ]);
  });
});
