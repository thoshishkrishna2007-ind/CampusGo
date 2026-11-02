import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Plus, Clock, CheckCircle2, XCircle, FileText, Calendar, ArrowRight } from 'lucide-react';
import SignaturePad from '../components/SignaturePad';
import { format } from 'date-fns';

export default function Dashboard() {
  const { dbUser, user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [signature, setSignature] = useState('');

  const [formData, setFormData] = useState({
    type: 'Outing',
    destination: '',
    purpose: '',
    departureAt: '',
    returnAt: '',
  });

  const fetchRequests = async () => {
    try {
      const token = await user?.getIdToken();
      const endpoint = dbUser.role === 'student' ? '/api/permissions/my' : '/api/permissions/pending-review';
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (dbUser) fetchRequests();
  }, [dbUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      toast.error('Signature is required');
      return;
    }

    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/permissions/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          studentSignature: signature
        })
      });

      if (res.ok) {
        toast.success('Request submitted for parent approval');
        setShowNewModal(false);
        fetchRequests();
      } else {
        toast.error('Submission failed');
      }
    } catch (error) {
      toast.error('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-emerald bg-emerald/10 border-emerald/20';
      case 'rejected': return 'text-crimson bg-crimson/10 border-crimson/20';
      case 'parent_pending': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'warden_pending': return 'text-secondary bg-secondary/10 border-secondary/20';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  if (dbUser?.role !== 'student') {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif font-bold text-midnight">Administrative Overview</h2>
            <p className="text-midnight/50">Welcome back, {dbUser?.name}. Manage pending institutional clearances.</p>
          </div>
          <Link to="/clearance">
            <Button className="bg-midnight text-ivory flex items-center gap-2">
              Review Queue
              <ArrowRight size={16} />
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border-warm bg-white/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-midnight/40 font-bold">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-serif font-bold text-midnight">{requests.filter(r => r.status === 'warden_pending').length}</div>
            </CardContent>
          </Card>
          <Card className="border-border-warm bg-white/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] uppercase tracking-widest text-midnight/40 font-bold">Today's Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-serif font-bold text-emerald">{requests.filter(r => r.status === 'approved').length}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border-warm">
          <CardHeader>
            <CardTitle className="font-serif">Clearance Activity Feed</CardTitle>
            <CardDescription>Recent applications moving through the authorization lifecycle.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
               <TableHeader>
                 <TableRow className="bg-ivory/20">
                   <TableHead>Student</TableHead>
                   <TableHead>Type</TableHead>
                   <TableHead>Destination</TableHead>
                   <TableHead className="text-right">Status</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {requests.slice(0, 5).map(req => (
                   <TableRow key={req.id}>
                     <TableCell className="font-bold text-midnight">{req.student?.user?.name}</TableCell>
                     <TableCell><span className="text-[10px] font-bold uppercase tracking-tighter bg-midnight/5 px-2 py-0.5 rounded border border-midnight/10">{req.type}</span></TableCell>
                     <TableCell className="text-sm text-midnight/60">{req.destination}</TableCell>
                     <TableCell className="text-right">
                       <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(req.status)}`}>
                         {req.status.replace('_', ' ')}
                       </span>
                     </TableCell>
                   </TableRow>
                 ))}
                 {requests.length === 0 && (
                   <TableRow><TableCell colSpan={4} className="text-center py-12 text-midnight/40 italic">No recent activity found.</TableCell></TableRow>
                 )}
               </TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-midnight">Student Dashboard</h2>
          <p className="text-midnight/50">Track your permissions and institutional clearances.</p>
        </div>
        
        <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
          <DialogTrigger>
            <Button className="bg-midnight hover:bg-midnight/90 text-ivory flex items-center gap-2">
              <Plus size={18} />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Apply for Permission</DialogTitle>
              <DialogDescription>Your request will be sent to your parent for initial approval.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Request Type</Label>
                  <Select onValueChange={(val: any) => setFormData({...formData, type: val})} defaultValue="Outing">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Outing">Outing (Day)</SelectItem>
                      <SelectItem value="Holiday">Holiday (Weekend/Vacation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Input placeholder="City, Location" onChange={(e: any) => setFormData({...formData, destination: e.target.value})} required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Purpose of Visit</Label>
                <Input placeholder="Reason for travel" onChange={(e: any) => setFormData({...formData, purpose: e.target.value})} required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Departure Time</Label>
                  <Input type="datetime-local" onChange={(e: any) => setFormData({...formData, departureAt: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Return Time</Label>
                  <Input type="datetime-local" onChange={(e: any) => setFormData({...formData, returnAt: e.target.value})} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Student Digital Signature</Label>
                <SignaturePad onSave={setSignature} onClear={() => setSignature('')} />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setShowNewModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-midnight text-ivory" disabled={loading}>
                  {loading ? 'Submitting...' : 'Send to Parent'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border-warm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-midnight/40 font-bold">Approved Slips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-emerald">{requests.filter(r => r.status === 'approved').length}</div>
          </CardContent>
        </Card>
        <Card className="border-border-warm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] uppercase tracking-widest text-midnight/40 font-bold">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-serif font-bold text-amber-500">{requests.filter(r => ['parent_pending', 'warden_pending'].includes(r.status)).length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border-warm">
        <CardHeader>
          <CardTitle className="font-serif">Recent Applications</CardTitle>
          <CardDescription>History of your permission requests and their status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-24">ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-midnight/40 italic">No applications found.</TableCell>
                </TableRow>
              ) : (
                requests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-ivory/50 transition-colors">
                    <TableCell className="font-mono text-[10px] font-bold text-midnight/60">{req.uniqueId}</TableCell>
                    <TableCell className="font-medium">{req.type}</TableCell>
                    <TableCell>{req.destination}</TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-antique-gold" />
                        {format(new Date(req.departureAt), 'MMM dd, p')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-3">
                      {req.status === 'approved' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-midnight/60 hover:text-midnight flex items-center gap-1.5"
                          onClick={async () => {
                            try {
                              const token = await user?.getIdToken();
                              const res = await fetch(`/api/permissions/${req.id}/pdf`, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              if (res.ok) {
                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `CampusGo_${req.uniqueId}.pdf`;
                                a.click();
                              } else {
                                toast.error('Failed to download PDF');
                              }
                            } catch (e) {
                              toast.error('Download failed');
                            }
                          }}
                        >
                          <FileText size={14} />
                          Slip
                        </Button>
                      )}
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(req.status)}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
