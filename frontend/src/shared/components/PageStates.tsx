/** Placeholder blocks shown while a page loads (replaces a bare "Loading…"). */
export function PageLoading({ children }: { children?: string }) {
  return (
    <div className="container" aria-busy="true" aria-live="polite">
      {children ? (
        <p className="form-note">{children}</p>
      ) : (
        <>
          <div className="skeleton" style={{ height: 14, width: 120, marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 34, width: 280, marginBottom: 28 }} />
          <div className="skeleton-row">
            <div className="skeleton" style={{ height: 92 }} />
            <div className="skeleton" style={{ height: 92 }} />
            <div className="skeleton" style={{ height: 92 }} />
            <div className="skeleton" style={{ height: 92 }} />
          </div>
          <div className="skeleton" style={{ height: 180, marginTop: 24 }} />
        </>
      )}
    </div>
  );
}

export function PageError({ message }: { message: string }) {
  return (
    <div className="container">
      <div className="form-error">{message}</div>
    </div>
  );
}
