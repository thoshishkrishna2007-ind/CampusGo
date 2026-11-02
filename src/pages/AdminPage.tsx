import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Users, FileText, Activity, ShieldAlert, BarChart3, ShieldCheck, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminPage() {
  const { user, dbUser } = useAuth();
  const [stats, setStats] = useState<any>({
    totalStudents: 0,
    pendingClearances: 0,
    activePermissions: 0,
    securityIncidents: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Mon', value: 45 },
    { name: 'Tue', value: 52 },
    { name: 'Wed', value: 38 },
    { name: 'Thu', value: 65 },
    { name: 'Fri', value: 89 },
    { name: 'Sat', value: 120 },
    { name: 'Sun', value: 95 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-midnight">Administrative Command</h2>
          <p className="text-midnight/50">Institutional governance and system-wide analytics.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-border-warm">Export Logs</Button>
          <Button className="bg-midnight text-ivory">System Settings</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Enrolled" value={stats.totalStudents} icon={Users} color="bg-midnight" />
        <StatCard title="Pending Clearance" value={stats.pendingClearances} icon={Clock} color="bg-antique-gold" />
        <StatCard title="Authorized Outings" value={stats.activePermissions} icon={ShieldCheck} color="bg-emerald" />
        <StatCard title="Alerts/Violations" value={stats.securityIncidents} icon={ShieldAlert} color="bg-crimson" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border-warm">
          <CardHeader>
            <CardTitle className="font-serif">Traffic Analytics</CardTitle>
            <CardDescription>Daily student movement volume across main gates.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DEC9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#101629' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#101629' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#101629', border: 'none', borderRadius: '8px', color: '#F5F0E6' }}
                  itemStyle={{ color: '#D5AD65' }}
                />
                <Bar dataKey="value" fill="#101629" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border-warm">
          <CardHeader>
            <CardTitle className="font-serif">Security Feed</CardTitle>
            <CardDescription>Recent gate activity logs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4 items-start pb-4 border-b border-border-warm last:border-0 last:pb-0">
                  <div className="w-8 h-8 rounded bg-emerald/10 text-emerald flex items-center justify-center shrink-0">
                    <Activity size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-midnight">Gate Exit: V. Krishnabail</p>
                    <p className="text-[10px] text-midnight/40 uppercase">Authorized by Warden · 12:45 PM</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="students" className="w-full">
        <TabsList className="bg-white border border-border-warm p-1 h-12">
          <TabsTrigger value="students" className="data-[state=active]:bg-midnight data-[state=active]:text-ivory px-8">Enrollment</TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-midnight data-[state=active]:text-ivory px-8">Staff Directory</TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-midnight data-[state=active]:text-ivory px-8">Audit Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="students" className="pt-6">
          <Card className="border-border-warm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>ID No</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Hostel</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-bold">V. Krishnabail</TableCell>
                    <TableCell className="font-mono text-[10px]">24ACE012</TableCell>
                    <TableCell>CSE</TableCell>
                    <TableCell>Krishna Block</TableCell>
                    <TableCell className="text-right"><Badge className="bg-emerald">Active</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="border-border-warm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] uppercase tracking-widest text-midnight/40 font-bold">{title}</CardTitle>
        <div className={`p-2 rounded ${color} text-white`}>
          <Icon size={14} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-serif font-bold text-midnight">{value}</div>
      </CardContent>
    </Card>
  );
}

