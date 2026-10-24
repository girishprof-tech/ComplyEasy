import { useEffect, useRef, useState } from 'react';
import { aiApi } from '@/api';
import type { AiExtraction, CertificatePayload } from '@/types';
import { errorMessage } from '@/shared/lib/errors';
import {
  ACCEPTED_CERTIFICATE_TYPES,
  CERTIFICATE_ACCEPT_ATTR,
  MAX_CERTIFICATE_BYTES,
  fileToCertificatePayload,
} from '../lib/certificate';

export interface ExistingCertificate {
  originalName: string | null;
  mimeType: string | null;
  viewUrl: string;
  downloadUrl: string;
}

/** unchanged = keep what's stored; removed = delete on save; new = upload this file on save. */
export type CertificateFieldValue =
  | { kind: 'unchanged' }
  | { kind: 'removed' }
  | { kind: 'new'; payload: CertificatePayload; previewUrl: string | null; fileName: string; mimeType: string };

interface Props {
  existing: ExistingCertificate | null;
  value: CertificateFieldValue;
  onChange: (value: CertificateFieldValue) => void;
  /** Called with the AI extraction once analysis completes. Omit to hide the Analyze button. */
  onAnalyzed?: (extraction: AiExtraction) => void;
}

export function CertificateField({ existing, value, onChange, onAnalyzed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Revoke object URLs we created so we don't leak memory across selections.
  useEffect(() => {
    return () => {
      if (value.kind === 'new' && value.previewUrl) URL.revokeObjectURL(value.previewUrl);
    };
  }, [value]);

  async function handleFile(file: File) {
    setError(null);
    setAnalyzeError(null);
    if (!ACCEPTED_CERTIFICATE_TYPES.includes(file.type)) {
      setError('Unsupported file type. Use JPG, PNG, WEBP, or PDF.');
      return;
    }
    if (file.size > MAX_CERTIFICATE_BYTES) {
      setError(`File is too large. Maximum size is ${MAX_CERTIFICATE_BYTES / (1024 * 1024)}MB.`);
      return;
    }
    try {
      const payload = await fileToCertificatePayload(file);
      const previewUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      onChange({ kind: 'new', payload, previewUrl, fileName: file.name, mimeType: file.type });
    } catch (err) {
      setError(errorMessage(err, 'Could not read the selected file'));
    }
  }

  async function handleAnalyze() {
    if (value.kind !== 'new' || !onAnalyzed) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      onAnalyzed(await aiApi.analyzeCertificate(value.payload));
    } catch (err) {
      setAnalyzeError(errorMessage(err, 'Could not analyze this certificate.'));
    } finally {
      setAnalyzing(false);
    }
  }

  const showingExisting = value.kind === 'unchanged' && !!existing;
  const showingNothing = value.kind === 'unchanged' && !existing;

  return (
    <div className="field">
      <label>Certificate / Document</label>
      {error && (
        <div className="form-error" style={{ marginBottom: 8 }}>
          {error}
        </div>
      )}

      {showingNothing && (
        <div className="cert-empty">
          <span>No certificate uploaded</span>
          <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
            Upload certificate
          </button>
        </div>
      )}

      {showingExisting && existing && (
        <div className="cert-preview-row">
          {existing.mimeType?.startsWith('image/') ? (
            <img src={existing.viewUrl} alt="Certificate preview" className="cert-thumb" />
          ) : (
            <div className="cert-thumb cert-thumb-pdf">PDF</div>
          )}
          <div className="cert-meta">
            <div className="cert-name">{existing.originalName || 'Certificate'}</div>
            <div className="cert-links">
              <a href={existing.viewUrl} target="_blank" rel="noreferrer">
                View certificate
              </a>
              <a href={existing.downloadUrl}>Download</a>
              <button type="button" className="btn-ghost btn" onClick={() => onChange({ kind: 'removed' })}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {value.kind === 'new' && (
        <div className="cert-preview-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', gap: 14 }}>
            {value.previewUrl ? (
              <img src={value.previewUrl} alt="Selected certificate preview" className="cert-thumb" />
            ) : (
              <div className="cert-thumb cert-thumb-pdf">PDF</div>
            )}
            <div className="cert-meta">
              <div className="cert-name">{value.fileName}</div>
              <div className="cert-links">
                <button type="button" className="btn-ghost btn" onClick={() => inputRef.current?.click()}>
                  Replace
                </button>
                <button
                  type="button"
                  className="btn-ghost btn"
                  onClick={() => onChange({ kind: existing ? 'removed' : 'unchanged' })}
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
          {onAnalyzed && (
            <div className="analyze-row">
              <button type="button" className="btn btn-secondary" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? (
                  <>
                    <span className="spinner" /> Analyzing certificate...
                  </>
                ) : (
                  'Analyze Certificate'
                )}
              </button>
            </div>
          )}
          {analyzeError && (
            <div className="form-error" style={{ marginTop: 8 }}>
              {analyzeError}
            </div>
          )}
        </div>
      )}

      {value.kind === 'removed' && (
        <div className="cert-empty">
          <span>Certificate will be removed on save</span>
          <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
            Upload certificate
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={CERTIFICATE_ACCEPT_ATTR}
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <div className="form-note">Optional. JPG, PNG, WEBP, or PDF, up to 5MB.</div>
    </div>
  );
}
