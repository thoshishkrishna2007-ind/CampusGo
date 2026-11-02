import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Search, Filter, MoreVertical, Shield, User, Power, Send } from 'lucide-react';
import { format } from 'date-fns';

export default function UserManagementPage() {
  const { user, dbUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    role: 'student',
    studentData: {
      idNo: '',
      department: 'CSE',
      year: '1st',
      hostel: '',
      room: '',
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      emergencyContact: ''
    },
    staffData: {
      employeeId: '',
      department: '',
      designation: '',
      assignedLocation: ''
    }
  });

  const fetchUsers = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('User created successfully');
        setShowAddModal(false);
        fetchUsers();
      } else {
        toast.error('Failed to create user');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-midnight">User Management</h2>
          <p className="text-midnight/50">Create and manage institutional accounts across all roles.</p>
        </div>
        
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger>
            <Button className="bg-midnight text-ivory flex items-center gap-2">
              <UserPlus size={18} />
              Add New User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif">Onboard New Member</DialogTitle>
              <DialogDescription>Assign roles and institutional records. A temporary password invitation will be sent.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-8 pt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Unique Username</Label>
                  <Input value={formData.username} onChange={(e: any) => setFormData({...formData, username: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Assigned Role</Label>
                  <Select onValueChange={(val: any) => setFormData({...formData, role: val})} defaultValue="student">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="warden">Hostel Warden</SelectItem>
                      <SelectItem value="security">Security Staff</SelectItem>
                      <SelectItem value="co_admin">Co-Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.role === 'student' ? (
                <div className="space-y-6 pt-6 border-t border-border-warm">
                  <h4 className="text-sm font-bold uppercase text-midnight/40">Student Particulars</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <Input placeholder="Roll Number" onChange={(e: any) => setFormData({...formData, studentData: {...formData.studentData, idNo: e.target.value}})} required />
                    <Input placeholder="Hostel Name" onChange={(e: any) => setFormData({...formData, studentData: {...formData.studentData, hostel: e.target.value}})} required />
                    <Input placeholder="Room No" onChange={(e: any) => setFormData({...formData, studentData: {...formData.studentData, room: e.target.value}})} required />
                    <Input placeholder="Parent Name" onChange={(e: any) => setFormData({...formData, studentData: {...formData.studentData, parentName: e.target.value}})} required />
                    <Input placeholder="Parent Email" onChange={(e: any) => setFormData({...formData, studentData: {...formData.studentData, parentEmail: e.target.value}})} required />
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pt-6 border-t border-border-warm">
                  <h4 className="text-sm font-bold uppercase text-midnight/40">Staff / Faculty Particulars</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <Input placeholder="Employee ID" onChange={(e: any) => setFormData({...formData, staffData: {...formData.staffData, employeeId: e.target.value}})} required />
                    <Input placeholder="Department" onChange={(e: any) => setFormData({...formData, staffData: {...formData.staffData, department: e.target.value}})} required />
                    <Input placeholder="Designation" onChange={(e: any) => setFormData({...formData, staffData: {...formData.staffData, designation: e.target.value}})} required />
                    <Input placeholder="Assigned Location (Block/Gate)" onChange={(e: any) => setFormData({...formData, staffData: {...formData.staffData, assignedLocation: e.target.value}})} />
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="ghost" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-midnight text-ivory" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Account & Invite'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border-warm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-midnight/30" size={16} />
            <input 
              type="text" 
              placeholder="Search by name, email..." 
              className="w-full pl-10 pr-4 py-2 bg-neutral border border-border-warm rounded-lg text-sm focus:outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-border-warm text-xs">
              <Filter size={14} className="mr-2" /> Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-ivory/30">
                <TableHead>User / Identity</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Institutional ID</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12 animate-pulse">Loading directory...</TableCell></TableRow>
              ) : filteredUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-midnight/5 flex items-center justify-center text-midnight/40 font-bold text-xs border border-border-warm">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-midnight">{u.name}</div>
                        <div className="text-[10px] text-midnight/40">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-midnight/5 px-2 py-1 rounded border border-midnight/10">{u.role}</span>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] font-bold text-midnight/60">
                    {u.studentProfile?.idNo || u.staffProfile?.employeeId || 'ADMIN'}
                  </TableCell>
                  <TableCell className="text-[10px] text-midnight/50">
                    {u.lastLoginAt ? format(new Date(u.lastLoginAt), 'MMM dd, p') : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald' : 'bg-crimson'}`}></div>
                      <span className="text-[10px] font-bold uppercase text-midnight/40">{u.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                     <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-midnight/40 hover:text-midnight"><Power size={14} /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-midnight/40 hover:text-midnight"><Send size={14} /></Button>
                     </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
