import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'choose' | 'create' | 'join';

export default function Onboarding() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Re-entry from Settings: ?step=create or ?step=join jumps straight to that step.
  // If the user is already onboarded as individual, "Continue as Individual" is hidden.
  const isReEntry = user?.onboarding_complete === true;
  const initialStep = (searchParams.get('step') as Step | null) ?? 'choose';

  const [step, setStep] = useState<Step>(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create org state
  const [orgName, setOrgName] = useState('');
  const [emailDomain, setEmailDomain] = useState('');
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  // Join org state
  const [inviteToken, setInviteToken] = useState('');

  const clearError = () => setError(null);

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      setError('Please enter an organisation name.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      const res = await api.post('/org/create', {
        name: orgName.trim(),
        email_domain: emailDomain.trim() || undefined,
      });
      setCreatedToken(res.data.invite_token);
      updateUser({ role: 'admin', onboarding_complete: true });
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to create organisation.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrg = async () => {
    if (!inviteToken.trim()) {
      setError('Please enter an invite token.');
      return;
    }
    setLoading(true);
    clearError();
    try {
      await api.post('/org/join', { invite_token: inviteToken.trim() });
      updateUser({ role: 'member', onboarding_complete: true });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid invite token.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    clearError();
    try {
      await api.post('/org/skip');
      updateUser({ onboarding_complete: true });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (createdToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Card className="w-full max-w-md p-6 shadow-lg">
          <CardHeader>
            <CardTitle>Organisation Created</CardTitle>
            <CardDescription>
              Share this invite token with your team so they can join.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-4 py-2 rounded text-lg font-mono tracking-widest text-center">
                {createdToken}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(createdToken)}
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              You can also find this token in your organisation settings later.
            </p>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <img src="/logo-transparent.png" alt="App Logo" className="h-24 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white">How would you like to use Work Buddy?</h1>
          <p className="text-muted-foreground mt-1">You can change this later in settings.</p>
        </div>

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        {step === 'choose' && (
          <div className="grid gap-4">
            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => { clearError(); setStep('create'); }}
            >
              <CardHeader>
                <CardTitle>Create an Organisation</CardTitle>
                <CardDescription>
                  Set up a shared workspace for your team. You'll get an invite token to share.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => { clearError(); setStep('join'); }}
            >
              <CardHeader>
                <CardTitle>Join an Organisation</CardTitle>
                <CardDescription>
                  Enter an invite token from your team admin to join an existing workspace.
                </CardDescription>
              </CardHeader>
            </Card>

            {!isReEntry && (
              <Card
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={handleSkip}
              >
                <CardHeader>
                  <CardTitle>Continue as Individual</CardTitle>
                  <CardDescription>
                    Use Work Buddy for your own personal workspace. You can join or create an org later.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        )}

        {step === 'create' && (
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Create an Organisation</CardTitle>
              <CardDescription>Give your team a name to get started.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organisation Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emailDomain">
                  Email Domain <span className="text-muted-foreground text-xs">(optional — enables mock SSO)</span>
                </Label>
                <Input
                  id="emailDomain"
                  placeholder="acme.com"
                  value={emailDomain}
                  onChange={(e) => setEmailDomain(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { clearError(); setStep('choose'); }}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleCreateOrg} disabled={loading}>
                  {loading ? 'Creating…' : 'Create Organisation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'join' && (
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Join an Organisation</CardTitle>
              <CardDescription>Enter the invite token your admin shared with you.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteToken">Invite Token</Label>
                <Input
                  id="inviteToken"
                  placeholder="ABC123"
                  className="font-mono tracking-widest uppercase"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value.toUpperCase())}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { clearError(); setStep('choose'); }}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleJoinOrg} disabled={loading}>
                  {loading ? 'Joining…' : 'Join Organisation'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
