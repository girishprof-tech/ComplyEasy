import { useState } from 'react';
import type { ActivityEntry } from '@/types';
import { groupActivity } from '../lib/groupActivity';

function ActivityList({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) return <p className="form-note">No activity recorded yet.</p>;
  return (
    <div className="activity-log">
      {groupActivity(entries).map((group) => (
        <div key={group.label} className="activity-group">
          <div className="activity-group-label">{group.label}</div>
          <ul className="activity-items">
            {group.items.map((entry) => (
              <li key={entry.id}>{entry.description}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/** Collapsible "Activity" card. `entries` is null while loading. */
export function ActivityCard({ entries }: { entries: ActivityEntry[] | null }) {
  const [show, setShow] = useState(false);
  return (
    <div className="card card-pad" style={{ marginTop: 24 }}>
      <div className="section-head">
        <h2 style={{ fontSize: 16 }}>Activity</h2>
        <button className="btn-ghost btn" onClick={() => setShow((s) => !s)}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {show && (entries ? <ActivityList entries={entries} /> : <p className="form-note">Loading…</p>)}
    </div>
  );
}
