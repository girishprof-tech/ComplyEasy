import { useRef, useState, type ChangeEvent } from 'react';

interface Props {
  name: string;
  logoData?: string | null;
  size?: number;
  editable?: boolean;
  onUpload?: (logoData: string) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  className?: string;
}

export function BusinessLogo({
  name,
  logoData,
  size = 48,
  editable = false,
  onUpload,
  onRemove,
  className = '',
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = (name || 'B').trim().charAt(0).toUpperCase();

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo file must be under 2MB.');
      setTimeout(() => setError(null), 3500);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const result = reader.result as string;
        try {
          await onUpload(result);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Failed to upload logo');
          setTimeout(() => setError(null), 3500);
        } finally {
          setBusy(false);
        }
      };
      reader.onerror = () => {
        setError('Could not read image file');
        setBusy(false);
        setTimeout(() => setError(null), 3500);
      };
      reader.readAsDataURL(file);
    } catch {
      setBusy(false);
    }

    // Reset input so re-selecting same file triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleRemove() {
    if (!onRemove) return;
    setBusy(true);
    try {
      await onRemove();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove logo');
      setTimeout(() => setError(null), 3500);
    } finally {
      setBusy(false);
    }
  }

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    borderRadius: size > 40 ? 14 : 8,
    flexShrink: 0,
    display: 'inline-block',
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: size > 40 ? 14 : 8,
    objectFit: 'cover',
    border: '1px solid var(--hairline)',
    background: '#fff',
    display: 'block',
  };

  const fallbackStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: size > 40 ? 14 : 8,
    background: 'linear-gradient(135deg, var(--brand) 0%, #154d40 100%)',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontWeight: 800,
    fontSize: Math.max(12, Math.floor(size * 0.45)),
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  };

  return (
    <div className={`business-logo-wrapper ${className}`} style={containerStyle}>
      {logoData ? (
        <img src={logoData} alt={`${name} logo`} style={imageStyle} />
      ) : (
        <div style={fallbackStyle} aria-label={name}>
          {initial}
        </div>
      )}

      {editable && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <div
            className="business-logo-hover-actions"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: size > 40 ? 14 : 8,
              background: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0,
              cursor: 'pointer',
              transition: 'opacity 140ms ease',
              color: '#fff',
            }}
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload/change logo"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
          >
            <span style={{ fontSize: size > 44 ? 14 : 11 }}>📷</span>
            {size >= 48 && (
              <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
                {busy ? 'Uploading…' : logoData ? 'Change' : 'Upload'}
              </span>
            )}
          </div>
        </>
      )}

      {editable && logoData && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          title="Remove logo"
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: '#dc2626',
            color: '#fff',
            border: '2px solid #fff',
            fontSize: 9,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
            padding: 0,
            lineHeight: 1,
            zIndex: 3,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          }}
        >
          ✕
        </button>
      )}

      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: -24,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#dc2626',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
