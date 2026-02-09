import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import logoNexus from '@/assets/logo-nexus.png';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) setError(error);
    setSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSubmitting(true);
    const { supabaseExternal } = await import('@/lib/supabaseExternal');
    const { error } = await supabaseExternal.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError(error.message);
    else setResetSent(true);
    setResetSubmitting(false);
  };

  if (forgotMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <img src={logoNexus} alt="Nexus Digital logo" className="mx-auto mb-2 h-12 w-12 rounded-lg object-contain" />
            <CardTitle className="text-xl">Recuperar contraseña</CardTitle>
            <CardDescription>
              {resetSent
                ? 'Revisa tu email para el enlace de recuperación'
                : 'Ingresa tu email para recibir un enlace de recuperación'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetSent ? (
              <Button variant="outline" className="w-full" onClick={() => { setForgotMode(false); setResetSent(false); setError(''); }}>
                Volver al login
              </Button>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full shadow-md" disabled={resetSubmitting}>
                  {resetSubmitting ? 'Enviando...' : 'Enviar enlace'}
                </Button>
                <button
                  type="button"
                  className="w-full text-sm text-primary hover:text-primary/80 underline transition-colors"
                  onClick={() => { setForgotMode(false); setError(''); }}
                >
                  Volver al login
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={logoNexus} alt="Nexus Digital logo" className="mx-auto mb-2 h-12 w-12 rounded-lg object-contain" />
          <CardTitle className="text-xl">Nexus</CardTitle>
          <CardDescription>Inicia sesión para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full shadow-md" disabled={submitting}>
              {submitting ? 'Cargando...' : 'Iniciar sesión'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              className="text-sm text-muted-foreground hover:text-primary underline transition-colors"
              onClick={() => { setForgotMode(true); setError(''); }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
