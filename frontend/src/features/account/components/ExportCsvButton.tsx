import { useNavigate } from 'react-router-dom';
import type { AccountSummary } from '@/types';

/** Pro users get a download link; Free users get a locked button that opens the plan page. */
export function ExportCsvButton({ account, href }: { account: AccountSummary | null; href: string }) {
  const navigate = useNavigate();
  if (!account) return null;
  if (account.limits.csvExport) {
    return (
      <a href={href} className="btn btn-secondary">
        Export CSV
      </a>
    );
  }
  return (
    <button className="btn btn-secondary" onClick={() => navigate('/plan')} title="Upgrade to Pro to export">
      Export CSV 🔒
    </button>
  );
}
