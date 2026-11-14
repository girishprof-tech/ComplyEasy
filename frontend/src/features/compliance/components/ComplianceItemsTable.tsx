import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { certificateUrl, type BusinessScope } from '@/api';
import type { ComplianceItem } from '@/types';
import { StatusBadge } from '@/shared/components/StatusBadge';

interface Props {
  scope: BusinessScope;
  /** `null` while loading. */
  items: ComplianceItem[] | null;
  /** The accountant view also shows the issue date. */
  showIssued?: boolean;
  emptyDescription: string;
  onAdd: () => void;
  onEdit: (item: ComplianceItem) => void;
  onDelete: (itemId: number) => void;
}

export function ComplianceItemsTable({ scope, items, showIssued = false, emptyDescription, onAdd, onEdit, onDelete }: Props) {
  const [searchParams] = useSearchParams();
  const highlightedItemId = searchParams.get('item') ? Number(searchParams.get('item')) : null;
  const highlightedRowRef = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    if (highlightedItemId && highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedItemId, items]);
  return (
    <div className="card">
      {items === null ? (
        <div className="card-pad">Loading…</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No compliance items yet</h3>
          <p>{emptyDescription}</p>
          <button className="btn btn-primary" onClick={onAdd}>
            Add first item
          </button>
        </div>
      ) : (
        <table className="ledger">
          <thead>
            <tr>
              <th style={{ paddingLeft: 20 }}>Item</th>
              {showIssued && <th>Issued</th>}
              <th>Expires</th>
              <th>Status</th>
              <th style={{ paddingRight: 20 }}></th>
            </tr>
          </thead>
          <tbody>
                {items.map((item) => {
                  const isHighlighted = highlightedItemId === item.id;
                  return (
                    <tr
                      key={item.id}
                      ref={isHighlighted ? highlightedRowRef : undefined}
                      className={isHighlighted ? 'row-highlighted' : undefined}
                    >
                      <td style={{ paddingLeft: 20, fontWeight: 600 }}>
                        {item.name}
                        {item.hasCertificate && (
                          <a
                            href={certificateUrl(scope, item.id)}
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginLeft: 8, fontSize: 12, color: 'var(--brand)', fontWeight: 600 }}
                            title="View certificate"
                          >
                            📎
                          </a>
                        )}
                      </td>
                      {showIssued && <td className="num">{item.issueDate || '—'}</td>}
                      <td className="num">
                        {item.expiryDate}
                        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>{item.daysLabel}</div>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td style={{ paddingRight: 20, textAlign: 'right' }}>
                        <button className="btn-ghost btn" onClick={() => onEdit(item)}>
                          Edit
                        </button>
                        <button className="btn-ghost btn" onClick={() => onDelete(item.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                );
          })}
              </tbody>
        </table>
      )}
    </div>
  );
}
