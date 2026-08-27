import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { getProfile, saveProfile } from '@/lib/dataStore';
import { UserProfile } from '@/types';
import { User, Mail, Bell, Wallet, PiggyBank } from 'lucide-react';
import { showToast } from '@/components/ui/toast';

const currencyOptions = [
  { value: 'NPR', label: 'NPR - Nepalese Rupee (₨)' },
  { value: 'USD', label: 'USD - US Dollar ($)' },
  { value: 'EUR', label: 'EUR - Euro (€)' },
  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
];

const reminderDaysOptions = [
  { value: '1', label: '1 day before' },
  { value: '2', label: '2 days before' },
  { value: '3', label: '3 days before (Recommended)' },
  { value: '5', label: '5 days before' },
  { value: '7', label: '7 days before' },
];

export function SettingsPage() {
  const { user, signOut, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const [formData, setFormData] = useState({
    preferredCurrency: 'NPR',
    reminderDaysBefore: 3,
    monthlyBudget: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = () => {
    if (!user) return;

    let userProfile = getProfile();
    if (!userProfile) {
      // Create default profile
      userProfile = {
        userId: user.id,
        displayName: user.name || '',
        preferredCurrency: 'NPR',
        reminderDaysBefore: 3,
      };
      saveProfile(userProfile);
    }
    setProfile(userProfile);
    setFormData({
      preferredCurrency: userProfile.preferredCurrency,
      reminderDaysBefore: userProfile.reminderDaysBefore,
      monthlyBudget: userProfile.monthlyBudget?.toString() || '',
    });
    setLoading(false);
  };

  const handleSave = () => {
    if (!user) return;

    const updatedProfile: UserProfile = {
      userId: user.id,
      displayName: user.name || '',
      preferredCurrency: formData.preferredCurrency,
      reminderDaysBefore: formData.reminderDaysBefore,
      monthlyBudget: formData.monthlyBudget ? parseFloat(formData.monthlyBudget) : undefined,
    };

    saveProfile(updatedProfile);
    setProfile(updatedProfile);

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = () => {
    setShowSignOutDialog(false);
    signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Manage your preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled />
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Currency Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Currency
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Preferred Currency</Label>
            <Select
              options={currencyOptions}
              value={formData.preferredCurrency}
              onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              All amounts will be displayed in this currency
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reminders Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Default Reminder Time</Label>
            <Select
              options={reminderDaysOptions}
              value={String(formData.reminderDaysBefore)}
              onChange={(e) => setFormData({ ...formData, reminderDaysBefore: parseInt(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              How many days before a bill is due should we remind you?
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Budget Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Monthly Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Set Monthly Budget (optional)</Label>
            <Input
              type="number"
              value={formData.monthlyBudget}
              onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
              placeholder="e.g., 50000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Set a monthly spending limit. Track your spending against your budget on the dashboard.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} className="gap-2">
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>
        {saved && (
          <span className="text-sm text-green-600">Your settings have been saved</span>
        )}
      </div>

      {/* Account Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Signing out will clear your local data. Your data stored in Google Sheets will remain safe.
          </p>
          <Button variant="destructive" onClick={() => setShowSignOutDialog(true)}>
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Sign Out Confirmation Dialog */}
      <Dialog open={showSignOutDialog} onClose={() => setShowSignOutDialog(false)}>
        <DialogContent className="text-center sm:max-w-sm">
          <DialogHeader className="mb-2">
            <DialogTitle>Sign Out</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-2">
            <img src="/images/signout.png" alt="Sign Out" className="w-20 h-20 mx-auto" />
            <p className="text-muted-foreground text-sm">
              Are you sure you want to sign out? You'll need to log in again to access your data.
            </p>
          </div>
          <DialogFooter className="justify-center sm:justify-center mt-4">
            <Button variant="outline" onClick={() => setShowSignOutDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SettingsPage;
