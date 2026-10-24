export type PlanTier = 'free' | 'pro';

export interface AccountSummary {
  tier: PlanTier;
  label: string;
  limits: { maxClients: number | null; maxAiAnalyses: number | null; csvExport: boolean };
  aiAnalysesUsed: number;
  aiAnalysesRemaining: number | null;
}
