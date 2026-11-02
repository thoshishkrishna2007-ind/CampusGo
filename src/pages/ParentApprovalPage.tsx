import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Info, Calendar, MapPin, Clock, ShieldCheck } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import { format } from 'date-fns';

export default function ParentApprovalPage() {
  const { token } = useParams();
  const [permission, setPermission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [signature, setSignature] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    const fetchPermission = async () => {
      try {
        const res = await fetch(`/api/public/permission/${token}`);
        if (res.ok) {
          const data = await res.json();
          setPermission(data);
        } else {
          toast.error('Invalid or expired link');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPermission();
  }, [token]);

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (status === 'approved' && !signature) {
      toast.error('Signature is required for approval');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/permission/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks, signature })
      });

      if (res.ok) {
        toast.success(`Request ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
        setPermission({ ...permission, status: status === 'approved' ? 'warden_pending' : 'rejected' });
      } else {
        toast.error('Submission failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="font-serif animate-pulse text-midnight/40 italic">Authenticating Secure Link...</p></div>;
  if (!permission) return <div className="flex items-center justify-center min-h-screen text-center"><h1 className="text-2xl font-serif text-midnight">Invalid Link</h1><p className="text-midnight/40">This approval link is invalid or has expired.</p></div>;

  if (permission.status !== 'parent_pending') {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-neutral">
        <Card className="max-w-md w-full border-border-warm text-center p-8">
          <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 ${permission.status === 'rejected' ? 'bg-crimson/10 text-crimson' : 'bg-emerald/10 text-emerald'}`}>
            {permission.status === 'rejected' ? <XCircle size={32} /> : <CheckCircle2 size={32} />}
          </div>
          <CardTitle className="text-2xl font-serif text-midnight mb-2">Decision Recorded</CardTitle>
          <p className="text-midnight/50 mb-6">Your response has already been securely processed by the CampusGo system.</p>
          <div className="h-px bg-border-warm w-full mb-6"></div>
          <p className="text-xs text-midnight/40 uppercase tracking-widest font-bold">Transaction Complete</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral py-12 px-6 flex items-center justify-center">
      <Card className="max-w-3xl w-full border-border-warm shadow-2xl overflow-hidden">
        <div className="bg-midnight p-8 text-ivory flex justify-between items-start border-b border-antique-gold/30">
          <div className="space-y-1">
            <p className="text-antique-gold text-[10px] uppercase tracking-widest font-bold">Secure Institutional Approval</p>
            <CardTitle className="text-3xl font-serif">Parental Authorization</CardTitle>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-antique-gold/70">{permission.uniqueId}</p>
            <p className="text-[10px] uppercase font-bold text-ivory/50">Ref ID</p>
          </div>
        </div>

        <CardContent className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] uppercase font-bold text-midnight/40 tracking-widest mb-2">Student Information</h3>
                <p className="text-xl font-serif font-bold text-midnight">{permission.student?.user?.name}</p>
                <p className="text-sm text-midnight/60">ID: {permission.student?.idNo} · {permission.student?.department}</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-border-warm">
                <h3 className="text-[10px] uppercase font-bold text-midnight/40 tracking-widest mb-2">Request Details</h3>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-antique-gold/10 flex items-center justify-center text-antique-gold">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-midnight/30 leading-none mb-1">Destination</p>
                    <p className="text-sm font-semibold">{permission.destination}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-antique-gold/10 flex items-center justify-center text-antique-gold">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-midnight/30 leading-none mb-1">Departure</p>
                    <p className="text-sm font-semibold">{format(new Date(permission.departureAt), 'MMM dd, yyyy · p')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-antique-gold/10 flex items-center justify-center text-antique-gold">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-midnight/30 leading-none mb-1">Return By</p>
                    <p className="text-sm font-semibold">{format(new Date(permission.returnAt), 'MMM dd, yyyy · p')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-ivory/30 p-6 rounded-xl border border-border-warm">
              <div className="flex items-start gap-3">
                <Info className="text-antique-gold shrink-0 mt-1" size={18} />
                <p className="text-xs text-midnight/60 italic leading-relaxed">
                  "I am requesting permission for {permission.purpose}. I understand the rules and will return by the stipulated time."
                </p>
              </div>
              <div className="pt-6 border-t border-border-warm/50">
                <p className="text-[10px] uppercase font-bold text-midnight/40 mb-2">Student Digital Signature</p>
                <img src={permission.studentSignature} alt="Student Signature" className="h-20 object-contain mix-blend-multiply opacity-80" />
              </div>
            </div>
          </div>

          <div className="h-px bg-border-warm w-full"></div>

          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="text-lg font-serif">Parental Decision</Label>
              <Input 
                placeholder="Remarks / Conditions (Optional)" 
                value={remarks}
                onChange={(e: any) => setRemarks(e.target.value)}
                className="bg-white border-border-warm"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-serif">Handwritten Signature Authorization</Label>
              <div className="p-4 bg-white rounded-xl border border-border-warm">
                <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
              </div>
              <p className="text-[10px] text-midnight/40 text-center">
                By signing, you authorize the student to travel to the specified destination.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <Button 
                variant="outline" 
                className="h-14 text-crimson border-crimson/20 hover:bg-crimson hover:text-white font-bold"
                onClick={() => handleDecision('rejected')}
                disabled={submitting}
              >
                <XCircle className="mr-2" size={20} />
                Deny Permission
              </Button>
              <Button 
                className="h-14 bg-emerald hover:bg-emerald/90 text-white font-bold"
                onClick={() => handleDecision('approved')}
                disabled={submitting}
              >
                <ShieldCheck className="mr-2" size={20} />
                Grant Approval
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
