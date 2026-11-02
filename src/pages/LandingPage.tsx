import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { ShieldCheck, GraduationCap, Users, Clock, ArrowRight, Lock, Mail, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const { login, loginWithEmail, user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success('Access Granted');
      setShowLogin(false);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Email login is not enabled in Firebase. Please enable the "Email/Password" provider in the Firebase Console.', {
          duration: 10000
        });
      } else {
        toast.error(error.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral selection:bg-antique-gold/30">
      {/* Hero Section */}
      <nav className="h-20 border-b border-border-warm flex items-center justify-between px-12 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-2xl font-serif font-bold text-midnight tracking-tight">CampusGo</h1>
        <button 
          onClick={() => setShowLogin(true)}
          className="bg-midnight text-ivory px-6 py-2.5 rounded-lg text-sm font-semibold hover:ring-2 hover:ring-antique-gold transition-all"
        >
          Sign In to Portal
        </button>
      </nav>

      <section className="relative overflow-hidden pt-32 pb-20 px-12">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-antique-gold/5 -skew-x-12 transform origin-top-right"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-antique-gold/10 border border-antique-gold/20 text-antique-gold text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={14} />
              Secure Authorization System
            </div>
            
            <h2 className="text-6xl font-serif font-bold text-midnight leading-tight">
              Institutional Governance for the <span className="text-antique-gold">Modern Campus</span>
            </h2>
            
            <p className="text-lg text-midnight/60 leading-relaxed max-w-xl">
              CampusGo streamlines student outing and holiday permissions for <b>Aditya College of Engineering</b>. 
              A unified bridge between students, parents, and administrative wardens.
            </p>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowLogin(true)}
                className="bg-midnight text-ivory px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:scale-105 transition-transform group"
              >
                Access Student Portal
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="aspect-square bg-white rounded-3xl shadow-2xl border border-border-warm overflow-hidden p-8 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-ivory via-transparent to-ivory opacity-50"></div>
              {/* Branded Placeholder for Campus Image */}
              <div className="w-full h-full bg-midnight/5 rounded-2xl flex items-center justify-center border border-dashed border-midnight/10">
                <div className="text-center space-y-4">
                  <GraduationCap size={64} className="text-antique-gold mx-auto" />
                  <p className="font-serif italic text-midnight/40 text-lg">Aditya College of Engineering<br/>Campus Main Entrance</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-12 bg-white">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <p className="text-antique-gold font-bold uppercase tracking-widest text-xs">Features</p>
            <h3 className="text-4xl font-serif font-bold text-midnight">Institutional Clarity at Scale</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Users, title: 'Multi-Role Portal', desc: 'Dedicated dashboards for Students, Parents, Faculty, and Security Staff.' },
              { icon: ShieldCheck, title: 'Biometric Signatures', desc: 'Authentic digital handwritten signatures captured for every approval level.' },
              { icon: Clock, title: 'Real-time Verification', desc: 'Instant QR code scanning at security gates with automated exit/entry logs.' }
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-neutral border border-border-warm hover:shadow-xl transition-shadow group">
                <div className="w-14 h-14 rounded-xl bg-midnight text-ivory flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon size={28} />
                </div>
                <h4 className="text-xl font-serif font-bold text-midnight mb-4">{feature.title}</h4>
                <p className="text-midnight/50 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-[400px] border-border-warm shadow-2xl p-0 overflow-hidden">
          <div className="bg-midnight p-8 text-center space-y-2">
            <div className="w-12 h-12 bg-antique-gold/20 rounded-full flex items-center justify-center mx-auto text-antique-gold mb-2">
              <ShieldCheck size={24} />
            </div>
            <DialogTitle className="text-2xl font-serif text-ivory">Portal Authentication</DialogTitle>
            <DialogDescription className="text-ivory/50">Access your institutional dashboard</DialogDescription>
          </div>
          
          <div className="p-8 space-y-6">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Institutional Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight/30" size={16} />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@campusgo.local" 
                    className="pl-10" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Security Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight/30" size={16} />
                  <Input 
                    id="password" 
                    type="password" 
                    className="pl-10" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-midnight text-ivory h-12 font-bold" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border-warm"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-midnight/30 tracking-widest">Or continue with</span></div>
            </div>

            <Button 
              variant="outline" 
              onClick={login} 
              className="w-full border-border-warm hover:bg-neutral h-12 flex items-center justify-center gap-3"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              Institutional G-Suite
            </Button>

            <p className="text-[10px] text-center text-midnight/40 leading-relaxed">
              By signing in, you agree to the <b>Aditya College of Engineering</b> Information Security Policy and Student Code of Conduct.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
