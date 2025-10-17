import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, signupSchema } from '@/lib/validations';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Auth() {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/app');
    }
  }, [user, navigate]);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', adminToken: '', clientId: '' }
  });

  const handleLogin = async (data: any) => {
    setIsLoading(true);
    const { error } = await signIn(data.email, data.password);
    setIsLoading(false);
    
    if (!error) {
      navigate('/app');
    }
  };

  const handleSignup = async (data: any) => {
    setIsLoading(true);
    
    // Validate admin token (hardcoded for now - should be env var)
    const ADMIN_TOKEN = 'admin123';
    if (data.adminToken !== ADMIN_TOKEN) {
      signupForm.setError('adminToken', { message: 'Admin token inválido' });
      setIsLoading(false);
      return;
    }

    // Create user account
    const { error, data: userData } = await signUp(data.email, data.password);
    
    if (!error && userData.user) {
      // Login automatically to get auth session
      const { error: loginError } = await signIn(data.email, data.password);
      
      if (!loginError) {
        // Now user is authenticated, can insert with RLS
        const { error: orgError } = await supabase
          .from('users_organizations')
          .insert({
            user_id: userData.user.id,
            organization_id: data.clientId
          });

        if (orgError) {
          console.error('Erro ao associar organização:', orgError);
          signupForm.setError('clientId', { message: 'Client ID inválido ou erro ao associar' });
        } else {
          signupForm.reset();
          navigate('/app');
        }
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg0 p-4">
      <Card className="w-full max-w-md bg-bg1 border-borderc">
        <CardHeader>
          <CardTitle className="text-2xl text-textc">Bem-vindo</CardTitle>
          <CardDescription className="text-textdim">
            Entre ou crie sua conta para acessar o inbox
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-textc">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...loginForm.register('email')}
                    className="bg-bg2 border-borderc text-textc"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-textc">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    {...loginForm.register('password')}
                    className="bg-bg2 border-borderc text-textc"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-textc">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...signupForm.register('email')}
                    className="bg-bg2 border-borderc text-textc"
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-textc">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    {...signupForm.register('password')}
                    className="bg-bg2 border-borderc text-textc"
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-textc">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    {...signupForm.register('confirmPassword')}
                    className="bg-bg2 border-borderc text-textc"
                  />
                  {signupForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-token" className="text-textc">Admin Token</Label>
                  <Input
                    id="admin-token"
                    type="password"
                    placeholder="Token de administrador"
                    {...signupForm.register('adminToken')}
                    className="bg-bg2 border-borderc text-textc"
                  />
                  {signupForm.formState.errors.adminToken && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.adminToken.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client-id" className="text-textc">Client ID</Label>
                  <Input
                    id="client-id"
                    type="text"
                    placeholder="UUID da organização"
                    {...signupForm.register('clientId')}
                    className="bg-bg2 border-borderc text-textc"
                  />
                  {signupForm.formState.errors.clientId && (
                    <p className="text-sm text-destructive">{signupForm.formState.errors.clientId.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? 'Criando...' : 'Criar Conta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
