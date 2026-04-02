'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, ExternalLink, Unlink, Shield, User } from 'lucide-react';

interface WatchStatus {
  connected: boolean;
  googleEmail?: string;
  watchedFolderId?: string;
  watchActive?: boolean;
  watchExpiresAt?: string;
}

interface TeamMember {
  id: string;
  userId: string;
  email: string | null;
  displayName: string | null;
  role: string;
  lastSeenAt: string;
}

function StatusBadge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        ok
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-gray-100 text-gray-500 border border-gray-200'
      }`}
    >
      {ok ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {children}
    </span>
  );
}

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<WatchStatus | null>(null);
  const [folderId, setFolderId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[] | null>(null);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);

  const urlConnected = searchParams.get('connected');
  const urlError = searchParams.get('error');

  useEffect(() => {
    if (urlConnected) setMessage({ type: 'success', text: 'Google account connected successfully.' });
    if (urlError) {
      const msgs: Record<string, string> = {
        google_auth_failed: 'Google authorization was cancelled or failed.',
        invalid_state: 'Invalid OAuth state. Please try again.',
        oauth_failed: 'Failed to complete Google sign-in. Please try again.',
        no_access_token: 'Google did not return an access token. Please try again.',
      };
      setMessage({ type: 'error', text: msgs[urlError] ?? 'Something went wrong.' });
    }
  }, [urlConnected, urlError]);

  useEffect(() => {
    fetch('/api/google/watch')
      .then((r) => r.json())
      .then((data: { success: boolean; data: WatchStatus }) => {
        if (data.success) {
          setStatus(data.data);
          if (data.data.watchedFolderId) setFolderId(data.data.watchedFolderId);
        }
      })
      .catch((_e: unknown) => undefined);

    // Try to load team members — silently fails for non-admins (403)
    fetch('/api/admin/users')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { success: boolean; data: TeamMember[] } | null) => {
        if (data?.success) setTeamMembers(data.data);
      })
      .catch((_e: unknown) => undefined);
  }, []);

  async function handleStartWatch(e: React.SyntheticEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/google/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId }),
      });
      const data = await res.json() as { success: boolean; error?: string; data?: { expiresAt: string } };

      if (data.success) {
        setMessage({ type: 'success', text: 'Drive folder watch activated. New transcripts will be scored automatically.' });
        setStatus((prev) => ({
          ...(prev ?? { connected: true }),
          watchedFolderId: folderId,
          watchActive: true,
          ...(data.data?.expiresAt ? { watchExpiresAt: data.data.expiresAt } : {}),
        }));
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Failed to start watch.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleRole(member: TeamMember) {
    setTogglingUser(member.userId);
    const newRole = member.role === 'admin' ? 'member' : 'admin';
    try {
      const res = await fetch(`/api/admin/users/${member.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (data.success) {
        setTeamMembers((prev) =>
          prev ? prev.map((m) => (m.userId === member.userId ? { ...m, role: newRole } : m)) : prev
        );
      } else {
        setMessage({ type: 'error', text: data.error ?? 'Failed to update role.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setTogglingUser(null);
    }
  }

  async function handleDisconnect() {
    // eslint-disable-next-line no-alert
    if (!confirm('Disconnect your Google account? The Drive watch will be stopped.')) return;
    setIsDisconnecting(true);

    try {
      await fetch('/api/google/disconnect', { method: 'DELETE' });
      setStatus({ connected: false });
      setFolderId('');
      setMessage({ type: 'success', text: 'Google account disconnected.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to disconnect. Please try again.' });
    } finally {
      setIsDisconnecting(false);
    }
  }

  const watchExpiry = status?.watchExpiresAt ? new Date(status.watchExpiresAt) : null;
  const watchExpiresInDays = watchExpiry
    ? Math.round((watchExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Connect Google to automatically score meetings as transcripts land in Drive.</p>
      </div>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 flex items-start gap-2 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Google Connection Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Google Account</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Connect the Google account that hosts your meetings.
            </p>
          </div>
          {status && (
            <StatusBadge ok={status.connected}>
              {status.connected ? 'Connected' : 'Not connected'}
            </StatusBadge>
          )}
        </div>

        {status?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <span className="text-gray-400">Account:</span>
              <span className="font-medium">{status.googleEmail ?? 'Unknown'}</span>
            </div>

            <div className="flex gap-2">
              <a
                href="/api/google/connect"
                className="text-sm border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                Reconnect
              </a>
              <button
                onClick={() => { void handleDisconnect(); }}
                disabled={isDisconnecting}
                className="flex items-center gap-1.5 text-sm border border-red-200 text-red-600 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Unlink className="h-3.5 w-3.5" />
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        ) : (
          <a
            href="/api/google/connect"
            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" opacity=".9"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity=".9"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" opacity=".9"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity=".9"/>
            </svg>
            Connect Google Account
          </a>
        )}
      </div>

      {/* Drive Watch Card */}
      {status?.connected && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Drive Folder Watch</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Specify the folder where Google Meet saves transcripts. New files will be scored automatically.
              </p>
            </div>
            {status.watchActive !== undefined && (
              <StatusBadge ok={status.watchActive ?? false}>
                {status.watchActive ? 'Watching' : 'Inactive'}
              </StatusBadge>
            )}
          </div>

          {status.watchActive && watchExpiresInDays !== null && (
            <div
              className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                watchExpiresInDays <= 1
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-100'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              Watch {watchExpiresInDays <= 0
                ? 'has expired — renew below'
                : `renews in ${watchExpiresInDays} day${watchExpiresInDays !== 1 ? 's' : ''}`}
            </div>
          )}

          <form onSubmit={(e) => { void handleStartWatch(e); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Google Drive Folder ID
              </label>
              <input
                type="text"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                required
                placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                Open the folder in Google Drive — the ID is the last segment of the URL.
                <a
                  href="https://drive.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline flex items-center gap-0.5"
                >
                  Open Drive <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving || !folderId.trim()}
              className="bg-blue-600 text-white text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving
                ? 'Activating...'
                : status.watchActive
                ? 'Renew Watch'
                : 'Start Watching'}
            </button>
          </form>
        </div>
      )}

      {/* Team Members — admin only */}
      {teamMembers && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-gray-900">Team Members</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Admins see all meetings. Members only see meetings they attended or that are shared with the team.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {teamMembers.map((member) => (
              <div key={member.userId} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-1.5 ${member.role === 'admin' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    {member.role === 'admin' ? <Shield className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {member.displayName ?? member.email ?? 'Unknown user'}
                    </div>
                    {member.displayName && member.email && (
                      <div className="text-xs text-gray-400">{member.email}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => { void toggleRole(member); }}
                  disabled={togglingUser === member.userId}
                  className={`text-xs font-medium rounded-lg px-3 py-1.5 border transition-colors disabled:opacity-50 ${
                    member.role === 'admin'
                      ? 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {togglingUser === member.userId
                    ? '...'
                    : member.role === 'admin'
                    ? 'Remove admin'
                    : 'Make admin'}
                </button>
              </div>
            ))}
          </div>

          {teamMembers.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              No team members yet. Users appear here after they log in for the first time.
            </p>
          )}
        </div>
      )}

      {/* How it works */}
      <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">How automatic scoring works</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-blue-500 font-semibold">1.</span> Your Google Meet ends and saves a transcript to your Drive folder.</li>
          <li className="flex gap-2"><span className="text-blue-500 font-semibold">2.</span> Google Drive notifies this app in real time (no polling).</li>
          <li className="flex gap-2"><span className="text-blue-500 font-semibold">3.</span> The app reads the transcript and looks up the matching Google Calendar event for scheduled start/end times.</li>
          <li className="flex gap-2"><span className="text-blue-500 font-semibold">4.</span> AI scores the meeting across all four criteria and writes a coaching summary.</li>
          <li className="flex gap-2"><span className="text-blue-500 font-semibold">5.</span> Participants are emailed the score. The result appears in the History tab.</li>
        </ol>
        <p className="text-xs text-gray-400 mt-4">
          The Drive watch expires every 7 days. Return here to renew it, or set up a cron job to call <code className="bg-gray-100 px-1 rounded">POST /api/google/watch</code> automatically.
        </p>
      </div>
    </div>
  );
}
