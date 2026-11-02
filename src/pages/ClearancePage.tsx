import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, FileText, Calendar, User, ShieldCheck, Mail } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import { format } from 'date-fns';

export default function ClearancePage() {
  const { user, dbUser } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [signature, setSignature] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchPending = async () => {
    const token = await user?.getIdToken();
    const res = await fetch('/api/permissions/pending-review', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setRequests(await res.json());
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleDecision = async (status: 'approved' | 'rejected') => {
    if (status === 'approved' && !signature) {
      toast.error('Signature is required');
      return;
    }

    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/permissions/warden-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          permissionId: selectedReq.id,
          status,
          remarks,
          signature
        })
      });

      if (res.ok) {
        toast.success(`Request ${status} successfully`);
        setSelectedReq(null);
        fetchPending();
      } else {
        toast.error('Failed to save decision');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-midnight">Institutional Clearance</h2>
        <p className="text-midnight/50">Review and authorize permissions that have received parental consent.</p>
      </div>

      <Card className="border-border-warm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-ivory/30">
                <TableHead>Ref ID</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent Approval</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-midnight/40 italic font-serif">No pending applications in the clearance queue.</TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-mono text-[10px] font-bold text-midnight/60">{req.uniqueId}</TableCell>
                    <TableCell>
                      <div className="font-bold text-midnight">{req.student?.user?.name}</div>
                      <div className="text-[10px] text-midnight/40 uppercase font-bold tracking-tighter">{req.student?.idNo} · {req.student?.year} {req.student?.department}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-xs bg-midnight/5 px-2 py-1 rounded border border-midnight/10">{req.type}</span>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2 text-emerald">
                         <CheckCircle2 size={14} />
                         <span className="text-xs font-bold uppercase tracking-widest">Verified</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        onClick={() => setSelectedReq(req)}
                        className="bg-midnight text-ivory text-xs h-8"
                      >
                        Review Request
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedReq} onOpenChange={() => setSelectedReq(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedReq && (
            <div className="space-y-8 py-4">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif">Institutional Permission Review</DialogTitle>
                <DialogDescription>Review details, parent authorization, and grant final institutional clearance.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-4 bg-neutral rounded-lg border border-border-warm space-y-4">
                    <h4 className="text-[10px] uppercase font-bold text-midnight/40 tracking-widest">Student & Trip Particulars</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="text-antique-gold" size={16} />
                        <p className="text-sm"><b>{selectedReq.student?.user?.name}</b> ({selectedReq.student?.idNo})</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="text-antique-gold" size={16} />
                        <p className="text-sm"><b>Departure:</b> {format(new Date(selectedReq.departureAt), 'MMM dd, p')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="text-antique-gold" size={16} />
                        <p className="text-sm"><b>Return:</b> {format(new Date(selectedReq.returnAt), 'MMM dd, p')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <FileText className="text-antique-gold" size={16} />
                        <p className="text-sm italic">"{selectedReq.purpose}"</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald/5 rounded-lg border border-emerald/20 space-y-4">
                    <h4 className="text-[10px] uppercase font-bold text-emerald tracking-widest flex items-center gap-2">
                      <ShieldCheck size={14} />
                      Parental Verification
                    </h4>
                    {selectedReq.approvals?.filter((a: any) => a.role === 'parent').map((app: any) => (
                      <div key={app.id} className="space-y-3">
                        <div className="flex items-center gap-3 text-xs">
                          <Mail className="text-emerald" size={14} />
                          <p>Verified via Parent Email link at <b>{format(new Date(app.createdAt), 'MMM dd, p')}</b></p>
                        </div>
                        <div className="bg-white p-2 rounded border border-emerald/10">
                          <img src={app.signatureUrl} alt="Parent Signature" className="h-12 object-contain mix-blend-multiply mx-auto" />
                        </div>
                        {app.remarks && <p className="text-[10px] italic text-midnight/60">"Remarks: {app.remarks}"</p>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="font-serif text-lg">Institutional Remarks</Label>
                    <Input 
                      placeholder="Add warden/faculty remarks..." 
                      value={remarks}
                      onChange={(e: any) => setRemarks(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <Label className="font-serif text-lg">Handwritten Signature Authorization</Label>
                    <div className="p-4 bg-white rounded-xl border border-border-warm">
                      <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button 
                      variant="outline" 
                      className="text-crimson border-crimson/20 hover:bg-crimson hover:text-white"
                      onClick={() => handleDecision('rejected')}
                      disabled={loading}
                    >
                      Reject
                    </Button>
                    <Button 
                      className="bg-midnight text-ivory"
                      onClick={() => handleDecision('approved')}
                      disabled={loading}
                    >
                      Authorize Permission
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
