'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/features/auth/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { User, Bell, Trash2, Check, X, DollarSign } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [emailReminders, setEmailReminders] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [saved, setSaved] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    // Hydrate this browser-only preference after the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotifications('Notification' in window && Notification.permission === 'granted' && localStorage.getItem('settings_notifications') !== 'false');
    setCurrency(localStorage.getItem('settings_currency') || 'USD');
  }, []);

  const toggleNotifications = async () => {
    if (notifications) { setNotifications(false); localStorage.setItem('settings_notifications', 'false'); return; }
    if (!('Notification' in window)) { setNotificationMessage('This browser supports in-app alerts only.'); return; }
    try {
      const permission = await Notification.requestPermission();
      const enabled = permission === 'granted';
      setNotifications(enabled);
      localStorage.setItem('settings_notifications', String(enabled));
      setNotificationMessage(enabled ? 'Browser alerts enabled while PocketMATE is open.' : 'Allow notifications in your browser settings. In-app alerts still work.');
    } catch { setNotificationMessage('Browser alerts are unavailable. In-app alerts still work.'); }
  };

  const handleSave = () => {
    // Save preferences to localStorage for now
    localStorage.setItem('settings_notifications', String(notifications));
    localStorage.setItem('settings_emailReminders', String(emailReminders));
    localStorage.setItem('settings_currency', currency);
    window.dispatchEvent(new Event('preferences-changed'));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="dashboard-heading">Settings</h2>
        <p className="text-muted mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card className="border-l-4 border-l-line opacity-60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted">Name</label>
            <input
              type="text"
              defaultValue={user?.name || ''}
              className="mt-1 w-full px-4 py-2 rounded-xl border border-line bg-[#F7F8F5] text-muted focus:outline-none cursor-not-allowed"
              readOnly
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted">Email</label>
            <input
              type="email"
              defaultValue={user?.email || ''}
              className="mt-1 w-full px-4 py-2 rounded-xl border border-line bg-[#F7F8F5] text-muted focus:outline-none cursor-not-allowed"
              readOnly
            />
          </div>
          <p className="text-xs text-muted">Profile is managed via Google OAuth</p>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card className="border-l-4 border-l-[#F59E0B]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#F59E0B]">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationMessage && <p role="status" className="text-sm text-muted">{notificationMessage}</p>}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink">Browser Notifications</p>
              <p className="text-sm text-muted">Receive reminder alerts while PocketMATE is open</p>
            </div>
            <button
              onClick={toggleNotifications}
              aria-label="Browser notifications"
              role="switch"
              aria-checked={notifications}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications ? 'bg-[#10B981]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  notifications ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink">Email Reminders</p>
              <p className="text-sm text-muted">Get email updates before due dates</p>
            </div>
            <button
              onClick={() => setEmailReminders(!emailReminders)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                emailReminders ? 'bg-[#10B981]' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  emailReminders ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Currency Section */}
      <Card className="border-l-4 border-l-[#078D88]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#078D88]">
            <DollarSign className="w-5 h-5" />
            Currency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted">Choose your preferred currency for displaying amounts.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrency('USD')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                currency === 'USD'
                  ? 'border-[#078D88] bg-[#F7F8F5] text-ink'
                  : 'border-line hover:border-[#078D88]/50'
              }`}
            >
              <span className="text-lg font-bold">$</span>
              <span className="ml-2 font-medium">USD - US Dollar</span>
            </button>
            <button
              onClick={() => setCurrency('NPR')}
              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                currency === 'NPR'
                  ? 'border-[#078D88] bg-[#F7F8F5] text-ink'
                  : 'border-line hover:border-[#078D88]/50'
              }`}
            >
              <span className="text-lg font-bold">रू</span>
              <span className="ml-2 font-medium">NPR - Nepali Rupee</span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Actions Section */}
      <Card className="border-l-4 border-l-[#FF4444]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#FF4444]">
            <Trash2 className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
            <div>
              <p className="font-medium text-ink">Delete Account</p>
              <p className="text-sm text-muted">Permanently delete your account and all data</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#FF4444] text-white rounded-xl hover:bg-[#E33] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        {saved && (
          <span className="flex items-center gap-2 text-[#10B981]">
            <Check className="w-4 h-4" />
            Saved!
          </span>
        )}
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-teal text-white rounded-xl hover:bg-teal-dark transition-colors font-medium"
        >
          Save Preferences
        </button>
      </div>

      {/* Delete Account Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-ink">Delete Account</h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="p-2 hover:bg-mint rounded-lg">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            <p className="text-muted mb-6">Are you sure you want to delete your account? This will permanently remove all your bills, cards, reminders, and profile data. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-line rounded-xl hover:bg-mint transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    if (!user) return;
                    const response = await fetch('/api/auth', { method: 'DELETE' });
                    if (!response.ok) throw new Error('Could not delete account');
                    await logout();
                    router.push('/');
                  } catch {
                    setDeleting(false);
                    alert('Failed to delete account. Please try again.');
                  }
                }}
                disabled={deleting}
                className="px-4 py-2 bg-[#FF4444] text-white rounded-xl hover:bg-[#E33] transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
