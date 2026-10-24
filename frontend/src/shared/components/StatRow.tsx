export interface Stat {
  label: string;
  value: number;
  /** Extra class on the tile, e.g. "warn" or "danger". */
  tone?: 'ok' | 'warn' | 'danger';
  /** CSS colour for the number itself. */
  valueColor?: string;
}

export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="stat-row stat-row-4">
      {stats.map((s) => (
        <div key={s.label} className={`stat-tile${s.tone ? ` ${s.tone}` : ''}`}>
          <div className="stat-label">{s.label}</div>
          <div className="stat-value" style={s.valueColor ? { color: s.valueColor } : undefined}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
