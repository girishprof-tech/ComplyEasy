import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { userApi, authApi, accountApi, myBusinessApi } from '@/api';
import type { UserProfileDetail, AccountSummary } from '@/types';
import { useAuth } from '@/features/auth/state/AuthProvider';
import { PageError, PageLoading } from '@/shared/components/PageStates';
import { Field } from '@/shared/components/Field';
import { AdBanner } from '@/shared/components/AdBanner';
import { BusinessLogo } from '@/shared/components/BusinessLogo';
import { errorMessage } from '@/shared/lib/errors';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'plan';

export function SettingsPage() {
  const { me, setMe } = useAuth();
  const [tab, setTab] = useState<SettingsTab>('profile');
  const [profile, setProfile] = useState<UserProfileDetail | null>(null);
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile Form state
  const [firmName, setFirmName] = useState('');
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  // Notification Preferences state
  const [notify30, setNotify30] = useState(() => localStorage.getItem('ce_notify_30') !== 'false');
  const [notify15, setNotify15] = useState(() => localStorage.getItem('ce_notify_15') !== 'false');
  const [notify7, setNotify7] = useState(() => localStorage.getItem('ce_notify_7') !== 'false');
  const [notifyEmail, setNotifyEmail] = useState(() => localStorage.getItem('ce_notify_email') !== 'false');
  const [notifySound, setNotifySound] = useState(() => localStorage.getItem('ce_notify_sound') !== 'false');
  const [notifySaved, setNotifySaved] = useState(false);

  // Plan state
  const [planBusy, setPlanBusy] = useState(false);
  const [planSuccess, setPlanSuccess] = useState<string | null>(null);

  const reloadProfile = () => {
    userApi.getProfile().then((p) => {
      setProfile(p);
      if (p.firmName) setFirmName(p.firmName);
    });
  };

  useEffect(() => {
    Promise.all([userApi.getProfile(), accountApi.get()])
      .then(([p, a]) => {
        setProfile(p);
        setAccount(a);
        if (p.firmName) setFirmName(p.firmName);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileBusy(true);
    try {
      const updated = await userApi.updateProfile({ firmName });
      setProfile(updated);
      setProfileSuccess('Profile details saved successfully.');
      if (me && me.role === 'accountant') {
        setMe({ ...me, firmName });
      }
      setTimeout(() => setProfileSuccess(null), 3500);
    } catch (err) {
      setError(errorMessage(err, 'Failed to update profile.'));
    } finally {
      setProfileBusy(false);
    }
  }

  const [profileError, setProfileError] = useState<string | null>(null);

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }

    setPasswordBusy(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully. Your next login will use your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err) {
      setPasswordError(errorMessage(err, 'Failed to change password. Please verify your current password.'));
    } finally {
      setPasswordBusy(false);
    }
  }

  function handleSaveNotifications() {
    localStorage.setItem('ce_notify_30', String(notify30));
    localStorage.setItem('ce_notify_15', String(notify15));
    localStorage.setItem('ce_notify_7', String(notify7));
    localStorage.setItem('ce_notify_email', String(notifyEmail));
    localStorage.setItem('ce_notify_sound', String(notifySound));
    setNotifySaved(true);
    setTimeout(() => setNotifySaved(false), 3000);
  }

  async function handleSwitchTier(targetTier: 'free' | 'pro') {
    setPlanBusy(true);
    setPlanSuccess(null);
    try {
      const updated = await accountApi.setPlan(targetTier);
      setAccount(updated);
      if (profile) setProfile({ ...profile, subscriptionTier: targetTier });
      setPlanSuccess(`Your account has been switched to the ${targetTier.toUpperCase()} tier.`);
      setTimeout(() => setPlanSuccess(null), 3500);
    } catch (err) {
      setError(errorMessage(err, 'Failed to update plan.'));
    } finally {
      setPlanBusy(false);
    }
  }

  if (error && !profile) return <PageError message={error} />;
  if (loading || !profile) return <PageLoading />;

  const displayName = profile.role === 'accountant' ? profile.firmName || profile.email : profile.business?.businessName || profile.email;

  return (
    <div className="container">
      <div className="eyebrow">Account &amp; System Settings</div>

      {/* Hero Profile Overview Card */}
      <div className="card card-pad" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--surface) 0%, rgba(31, 111, 92, 0.05) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <BusinessLogo
              name={displayName}
              logoData={profile.business?.logoData}
              size={64}
            />
            <div>
              <h1 style={{ fontSize: 24, margin: '0 0 4px', fontWeight: 800 }}>{displayName}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{profile.email}</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: profile.role === 'accountant' ? 'rgba(31, 111, 92, 0.12)' : 'rgba(185, 113, 26, 0.12)',
                    color: profile.role === 'accountant' ? 'var(--brand)' : '#b9711a',
                  }}
                >
                  {profile.role === 'accountant' ? 'Chartered Accountant' : 'Business Owner'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 6,
                    background: profile.subscriptionTier === 'pro' ? 'rgba(31, 111, 92, 0.18)' : 'rgba(0, 0, 0, 0.06)',
                    color: profile.subscriptionTier === 'pro' ? 'var(--brand)' : 'var(--muted)',
                  }}
                >
                  {profile.subscriptionTier.toUpperCase()} PLAN
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              Member since: <strong>{profile.createdAt.slice(0, 10)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Wide Ad Slot */}
      <AdBanner account={account} variant="wide" slot={0} />

      {/* Settings Navigation Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid var(--hairline)', marginBottom: 24, overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setTab('profile')}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: tab === 'profile' ? '3px solid var(--brand)' : '3px solid transparent',
            color: tab === 'profile' ? 'var(--brand)' : 'var(--ink-soft)',
            cursor: 'pointer',
            transition: 'all 140ms ease',
          }}
        >
          👤 Profile &amp; Organization
        </button>
        <button
          type="button"
          onClick={() => setTab('security')}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: tab === 'security' ? '3px solid var(--brand)' : '3px solid transparent',
            color: tab === 'security' ? 'var(--brand)' : 'var(--ink-soft)',
            cursor: 'pointer',
            transition: 'all 140ms ease',
          }}
        >
          🔐 Password &amp; Security
        </button>
        <button
          type="button"
          onClick={() => setTab('notifications')}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: tab === 'notifications' ? '3px solid var(--brand)' : '3px solid transparent',
            color: tab === 'notifications' ? 'var(--brand)' : 'var(--ink-soft)',
            cursor: 'pointer',
            transition: 'all 140ms ease',
          }}
        >
          🔔 Notification Rules
        </button>
        <button
          type="button"
          onClick={() => setTab('plan')}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            background: 'none',
            border: 'none',
            borderBottom: tab === 'plan' ? '3px solid var(--brand)' : '3px solid transparent',
            color: tab === 'plan' ? 'var(--brand)' : 'var(--ink-soft)',
            cursor: 'pointer',
            transition: 'all 140ms ease',
          }}
        >
          ⚡ Plan &amp; Limits
        </button>
      </div>

      <div className="layout">
        <div className="main-col">
          {/* TAB 1: Profile */}
          {tab === 'profile' && (
            <div className="card card-pad">
              <div className="section-head">
                <div>
                  <h2 style={{ fontSize: 18, margin: 0 }}>Organization &amp; User Information</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                    Manage the public and internal identification details for your ComplyEasy workspace.
                  </p>
                </div>
              </div>

              {profileSuccess && (
                <div style={{ padding: '10px 14px', background: 'rgba(31, 111, 92, 0.1)', color: 'var(--brand)', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                  ✓ {profileSuccess}
                </div>
              )}
              {profileError && <div className="form-error">{profileError}</div>}

              <form onSubmit={handleUpdateProfile}>
                {profile.role === 'owner' && profile.business && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      marginBottom: 20,
                      padding: 16,
                      background: 'var(--surface-tint)',
                      borderRadius: 12,
                      border: '1px solid var(--hairline)',
                    }}
                  >
                    <BusinessLogo
                      name={profile.business.businessName}
                      logoData={profile.business.logoData}
                      size={60}
                      editable
                      onUpload={async (logoData) => {
                        await myBusinessApi.uploadLogo(logoData);
                        reloadProfile();
                      }}
                      onRemove={async () => {
                        await myBusinessApi.removeLogo();
                        reloadProfile();
                      }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>Business Logo</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 2 }}>
                        Click the logo avatar above to upload or update your official company logo (PNG, JPG, SVG, WebP up to 2MB).
                      </div>
                    </div>
                  </div>
                )}

                <Field id="userEmail" label="Registered email address" type="email" value={profile.email} disabled />

                {profile.role === 'accountant' ? (
                  <Field
                    id="firmName"
                    label="Accounting Firm Name"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    required
                  />
                ) : (
                  profile.business && (
                    <>
                      <Field id="bizName" label="Registered business name" value={profile.business.businessName} disabled />
                      <Field id="bizReg" label="Business Registration ID" value={profile.business.registrationId || '—'} disabled />
                      <Field id="bizInd" label="Industry Sector" value={profile.business.industry || '—'} disabled />
                    </>
                  )
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button type="submit" className="btn btn-primary" disabled={profileBusy}>
                    {profileBusy ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Security */}
          {tab === 'security' && (
            <div className="card card-pad">
              <div className="section-head">
                <div>
                  <h2 style={{ fontSize: 18, margin: 0 }}>Change Account Password</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                    Keep your account secure with high-entropy scrypt password encryption.
                  </p>
                </div>
              </div>

              {passwordSuccess && (
                <div style={{ padding: '10px 14px', background: 'rgba(31, 111, 92, 0.1)', color: 'var(--brand)', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                  ✓ {passwordSuccess}
                </div>
              )}
              {passwordError && <div className="form-error">{passwordError}</div>}

              <form onSubmit={handleChangePassword}>
                <Field
                  id="currPass"
                  label="Current Password"
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <Field
                  id="newPass"
                  label="New Password"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Field
                  id="confPass"
                  label="Confirm New Password"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <div style={{ background: 'var(--surface-tint)', padding: '12px 16px', borderRadius: 10, margin: '14px 0', fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                  🛡️ <strong>Password Security Rules:</strong> Minimum 8 characters. Passwords are salted and hashed using CPU/memory-hard Scrypt key derivation function.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                  <button type="submit" className="btn btn-primary" disabled={passwordBusy}>
                    {passwordBusy ? 'Updating Password…' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Notifications */}
          {tab === 'notifications' && (
            <div className="card card-pad">
              <div className="section-head">
                <div>
                  <h2 style={{ fontSize: 18, margin: 0 }}>Compliance &amp; Expiry Alert Preferences</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                    Configure how and when ComplyEasy notifies you about upcoming license deadlines and government schemes.
                  </p>
                </div>
              </div>

              {notifySaved && (
                <div style={{ padding: '10px 14px', background: 'rgba(31, 111, 92, 0.1)', color: 'var(--brand)', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                  ✓ Notification rules saved and updated!
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notify30}
                    onChange={(e) => setNotify30(e.target.checked)}
                    style={{ marginTop: 3, width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>30-Day Early Warning</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                      Trigger amber notifications when licenses, certifications, or GST items enter their 30-day expiry window.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notify15}
                    onChange={(e) => setNotify15(e.target.checked)}
                    style={{ marginTop: 3, width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>15-Day Mid-Window Alert</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                      Send prioritized reminders when expiry is within 2 weeks.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notify7}
                    onChange={(e) => setNotify7(e.target.checked)}
                    style={{ marginTop: 3, width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#dc2626' }}>7-Day Critical Emergency Alert</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                      Urgent high-priority pulsing alert for expired or imminent regulatory violations.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    style={{ marginTop: 3, width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Email Digest Summaries</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
                      Receive a consolidated Monday morning email overview of all expiring items across clients.
                    </div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={notifySound}
                    onChange={(e) => setNotifySound(e.target.checked)}
                    style={{ marginTop: 3, width: 18, height: 18 }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Sound &amp; Badge Visual Pulses</div>
                    <div style={{ fontWeight: 400, fontSize: 12.5, color: 'var(--ink-soft)' }}>
                      Show animated neon pulse badge on top bar notification bell when unread alerts arrive.
                    </div>
                  </div>
                </label>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button type="button" className="btn btn-primary" onClick={handleSaveNotifications}>
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Plan & Limits */}
          {tab === 'plan' && (
            <div className="card card-pad">
              <div className="section-head">
                <div>
                  <h2 style={{ fontSize: 18, margin: 0 }}>Subscription &amp; Usage Limits</h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
                    Switch tiers instantly in this demo workspace or review your current analysis quotas.
                  </p>
                </div>
              </div>

              {planSuccess && (
                <div style={{ padding: '10px 14px', background: 'rgba(31, 111, 92, 0.1)', color: 'var(--brand)', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
                  ✓ {planSuccess}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, margin: '16px 0 24px' }}>
                <div
                  style={{
                    border: profile.subscriptionTier === 'free' ? '2px solid var(--brand)' : '1px solid var(--hairline)',
                    borderRadius: 14,
                    padding: 18,
                    background: profile.subscriptionTier === 'free' ? 'rgba(31, 111, 92, 0.04)' : 'var(--surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, margin: 0 }}>Free Tier</h3>
                    {profile.subscriptionTier === 'free' && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'var(--brand)', color: '#fff' }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, margin: '8px 0', color: 'var(--ink)' }}>₹0 / mo</div>
                  <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                    Ideal for individual business testing. Includes partner sponsor ad spaces.
                  </p>
                  <ul style={{ paddingLeft: 18, fontSize: 12.5, color: 'var(--ink-soft)', margin: '12px 0 20px', lineHeight: 1.6 }}>
                    <li>Up to 3 managed clients</li>
                    <li>5 AI certificate extractions</li>
                    <li>Standard email notifications</li>
                  </ul>
                  {profile.subscriptionTier !== 'free' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ width: '100%' }}
                      disabled={planBusy}
                      onClick={() => handleSwitchTier('free')}
                    >
                      Downgrade to Free
                    </button>
                  )}
                </div>

                <div
                  style={{
                    border: profile.subscriptionTier === 'pro' ? '2px solid var(--brand)' : '1px solid var(--hairline)',
                    borderRadius: 14,
                    padding: 18,
                    background: profile.subscriptionTier === 'pro' ? 'rgba(31, 111, 92, 0.04)' : 'var(--surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, margin: 0 }}>Pro Partner</h3>
                    {profile.subscriptionTier === 'pro' && (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4, background: 'var(--brand)', color: '#fff' }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, margin: '8px 0', color: 'var(--brand)' }}>₹2,499 / mo</div>
                  <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                    Uncapped power for chartered accountant firms and enterprise organizations.
                  </p>
                  <ul style={{ paddingLeft: 18, fontSize: 12.5, color: 'var(--ink-soft)', margin: '12px 0 20px', lineHeight: 1.6 }}>
                    <li>Unlimited clients &amp; ledgers</li>
                    <li>Unlimited AI document extractions</li>
                    <li>Zero advertisements</li>
                    <li>Priority multi-client CSV export</li>
                  </ul>
                  {profile.subscriptionTier !== 'pro' ? (
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      disabled={planBusy}
                      onClick={() => handleSwitchTier('pro')}
                    >
                      Upgrade to Pro →
                    </button>
                  ) : (
                    <Link to="/plan" className="btn btn-secondary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                      Manage Billing Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Standard Ad Slot */}
          <AdBanner account={account} variant="trailer" />
        </div>

        <aside className="rail">
          {/* Sidebar Box Ad */}
          <AdBanner account={account} variant="square" slot={1} />
          <div className="card card-pad">
            <h3 style={{ fontSize: 15, margin: '0 0 8px' }}>Security &amp; Encryption</h3>
            <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: 0, lineHeight: 1.5 }}>
              Your workspace data is encrypted at rest and in transit. ComplyEasy never shares client licenses with third parties.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
