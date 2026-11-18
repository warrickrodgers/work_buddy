import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import api from '@/lib/api';

const FormSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

type FormValues = z.infer<typeof FormSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [ssoEmail, setSsoEmail] = useState('');
  const [ssoError, setSsoError] = useState<string | null>(null);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [showSso, setShowSso] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { email: '', password: '' },
  });

  const handleLogin = async (values: FormValues) => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const response = await api.post('/auth/signin', {
        email: values.email,
        password: values.password,
      });
      const { token, user } = response.data;
      login(token, user);
      navigate(user.onboarding_complete ? '/dashboard' : '/onboarding');
    } catch (err: any) {
      setLoginError(err.response?.data?.error ?? 'Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSsoLogin = async () => {
    setSsoError(null);
    if (!ssoEmail.trim()) {
      setSsoError('Enter your work email.');
      return;
    }
    setSsoLoading(true);
    try {
      const response = await api.post('/auth/mock-sso', { email: ssoEmail.trim() });
      const { token, user } = response.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err: any) {
      setSsoError(
        err.response?.status === 404
          ? 'No organisation found for this email domain.'
          : err.response?.data?.error ?? 'SSO sign-in failed.'
      );
    } finally {
      setSsoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="mb-6">
        <img src="/logo-transparent.png" alt="App Logo" className="h-70 w-auto mx-auto" />
        <Card className="w-full max-w-sm p-4 shadow-lg">
          <CardContent>
            <h2 className="text-2xl font-bold mb-2 text-center">Welcome Back!</h2>
            <p className="text-sm mb-4 text-center text-muted-foreground">
              Enter your email below to login to your account
            </p>

            {loginError && (
              <p className="text-sm text-red-500 mb-3 text-center">{loginError}</p>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="buddy@workbuddy.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <a href="/forgotPassword" className="underline py-2 underline-offset-4 text-sm block">
                  Forgot Password?
                </a>
                <Button type="submit" className="w-full" variant="outline" disabled={loginLoading}>
                  {loginLoading ? 'Signing in…' : 'Login'}
                </Button>
                <p className="text-sm text-center">
                  Don't have an account?{' '}
                  <a href="/signup" className="underline underline-offset-4">Sign up</a>
                </p>
              </form>
            </Form>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full mt-3 text-sm"
                onClick={() => setShowSso((v) => !v)}
              >
                Sign in with SSO
              </Button>

              {showSso && (
                <div className="mt-3 space-y-2">
                  {ssoError && (
                    <p className="text-xs text-red-400 text-center">{ssoError}</p>
                  )}
                  <Input
                    type="email"
                    placeholder="you@yourcompany.com"
                    value={ssoEmail}
                    onChange={(e) => setSsoEmail(e.target.value)}
                  />
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={handleSsoLogin}
                    disabled={ssoLoading}
                  >
                    {ssoLoading ? 'Signing in…' : 'Continue with SSO'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
