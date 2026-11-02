import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { updatePassword } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordPage() {
  const { user, refreshUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      if (user) {
        await updatePassword(user, password);
        
        // Sync with backend to clear flag
        const token = await user.getIdToken();
        await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success('Security settings updated');
        await refreshUser();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-border-warm shadow-2xl">
        <div className="bg-midnight h-2 w-full"></div>
        <CardHeader className="text-center space-y-2">
          <div className="w-16 h-16 bg-antique-gold/10 rounded-full flex items-center justify-center mx-auto text-antique-gold mb-4">
            <ShieldCheck size={32} />
          </div>
          <CardTitle className="text-3xl font-serif text-midnight">Security Upgrade Required</CardTitle>
          <CardDescription>
            You are logging in with a temporary password. Please set a new secure password to protect your institutional account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>New Secure Password</Label>
              <div className="relative">
                <Input 
                  type={show ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  className="pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight/30 hover:text-midnight"
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input 
                type={show ? 'text' : 'password'} 
                value={confirm} 
                onChange={e => setConfirm(e.target.value)} 
                required 
              />
            </div>
            
            <div className="bg-ivory/50 p-4 rounded-lg border border-border-warm text-[10px] text-midnight/60 space-y-1">
               <p className="font-bold uppercase tracking-widest text-midnight/40 mb-1">Security Standards</p>
               <p>• At least 8 characters long</p>
               <p>• Mix of uppercase and lowercase</p>
               <p>• Include numbers and special characters</p>
            </div>

            <Button type="submit" className="w-full h-12 bg-midnight text-ivory font-bold flex items-center gap-2" disabled={loading}>
              <Lock size={18} />
              {loading ? 'Securing Account...' : 'Update Security Settings'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
