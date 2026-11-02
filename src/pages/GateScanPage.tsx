import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { ShieldCheck, XCircle, LogOut, LogIn, User, MapPin, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function GateScanPage() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<any>(null);
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
    };
  }, []);

  async function onScanSuccess(decodedText: string) {
    // Unique ID from QR
    fetchPermission(decodedText);
  }

  function onScanFailure(error: any) {
    // Silent fail
  }

  const fetchPermission = async (uniqueId: string) => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/gate/verify/${uniqueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPermission(data);
        if (scannerRef.current) scannerRef.current.pause(true);
      } else {
        toast.error('Permission not found or unauthorized');
      }
    } catch (error) {
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const recordEvent = async (type: 'OUT' | 'RETURN') => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/gate/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          permissionId: permission.id,
          type
        })
      });

      if (res.ok) {
        toast.success(`Event recorded: ${type}`);
        setPermission(null);
        if (scannerRef.current) scannerRef.current.resume();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to record event');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-midnight">Gate Verification</h2>
        <p className="text-midnight/50">Verify student permissions via QR scan or manual ID entry.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-border-warm overflow-hidden">
            <CardHeader className="bg-midnight text-ivory">
              <CardTitle className="text-lg font-serif">QR Scanner</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div id="reader" className="w-full"></div>
            </CardContent>
          </Card>

          <Card className="border-border-warm">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-midnight/40">Manual Entry</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Input 
                placeholder="Permission ID (e.g. AB123C4567)" 
                value={manualId}
                onChange={(e: any) => setManualId(e.target.value)}
                className="font-mono text-sm"
              />
              <Button 
                onClick={() => fetchPermission(manualId)}
                className="bg-midnight text-ivory shrink-0"
                disabled={loading}
              >
                Verify
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!permission ? (
            <Card className="border-border-warm bg-white/50 h-full flex items-center justify-center border-dashed border-2">
              <div className="text-center p-12 space-y-4">
                <ShieldCheck size={48} className="mx-auto text-midnight/10" />
                <p className="font-serif italic text-midnight/30 text-lg">Waiting for scan data...</p>
              </div>
            </Card>
          ) : (
            <Card className={`border-2 animate-in slide-in-from-right duration-300 ${permission.status === 'approved' ? 'border-emerald/30 bg-emerald/5' : 'border-crimson/30 bg-crimson/5'}`}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-serif">{permission.student?.user?.name}</CardTitle>
                  <CardDescription>{permission.student?.idNo} · Room {permission.student?.room}</CardDescription>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border ${permission.status === 'approved' ? 'bg-emerald text-white border-emerald' : 'bg-crimson text-white border-crimson'}`}>
                  {permission.status}
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-midnight/10">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-midnight/40 tracking-tighter">Permission Type</p>
                    <p className="font-bold text-lg">{permission.type}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-midnight/40 tracking-tighter">Unique ID</p>
                    <p className="font-mono text-xs bg-white/50 px-2 py-1 rounded inline-block font-bold">{permission.uniqueId}</p>
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-white/80 rounded-xl border border-midnight/5">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-antique-gold" />
                    <p className="text-sm"><b>Destination:</b> {permission.destination}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-midnight/60">
                    <Calendar size={14} />
                    <p>Expected Departure: <b>{format(new Date(permission.departureAt), 'MMM dd, p')}</b></p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-midnight/60">
                    <Clock size={14} />
                    <p>Expected Return: <b>{format(new Date(permission.returnAt), 'MMM dd, p')}</b></p>
                  </div>
                </div>

                {permission.status === 'approved' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      className="bg-midnight h-14 font-bold flex items-center gap-2"
                      onClick={() => recordEvent('OUT')}
                    >
                      <LogOut size={20} />
                      Log EXIT
                    </Button>
                    <Button 
                      className="bg-emerald h-14 font-bold flex items-center gap-2"
                      onClick={() => recordEvent('RETURN')}
                    >
                      <LogIn size={20} />
                      Log ENTRY
                    </Button>
                  </div>
                ) : (
                  <div className="p-6 bg-crimson/10 border border-crimson/20 rounded-xl text-crimson text-center space-y-2">
                    <XCircle size={32} className="mx-auto" />
                    <p className="font-bold">ACCESS DENIED</p>
                    <p className="text-xs">This permission is currently <b>{permission.status}</b> and is not valid for gate clearance.</p>
                  </div>
                )}
                
                <Button 
                  variant="ghost" 
                  className="w-full text-midnight/40 hover:text-midnight"
                  onClick={() => {
                    setPermission(null);
                    if (scannerRef.current) scannerRef.current.resume();
                  }}
                >
                  Discard and Scan Next
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
