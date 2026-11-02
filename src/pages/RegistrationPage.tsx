import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export default function RegistrationPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    idNo: '',
    department: '',
    year: '',
    hostel: '',
    room: '',
    parentEmail: '',
    parentPhone: '',
    emergencyContact: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: user?.uid,
          email: user?.email,
          name: formData.name,
          role: 'student',
          studentData: {
            idNo: formData.idNo,
            department: formData.department,
            year: formData.year,
            hostel: formData.hostel,
            room: formData.room,
            parentEmail: formData.parentEmail,
            parentPhone: formData.parentPhone,
            emergencyContact: formData.emergencyContact,
          }
        })
      });

      if (res.ok) {
        toast.success('Profile completed successfully');
        await refreshUser();
      } else {
        toast.error('Registration failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <Card className="border-antique-gold/20 shadow-xl overflow-hidden">
        <div className="bg-midnight h-2 w-full"></div>
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-serif text-midnight">Student Onboarding</CardTitle>
          <CardDescription>Complete your profile to access the permission system.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Roll Number / ID No</Label>
                <Input value={formData.idNo} onChange={(e: any) => setFormData({...formData, idNo: e.target.value})} required placeholder="e.g. 24ACE012" />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select onValueChange={(val: any) => setFormData({...formData, department: val})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSE">Computer Science</SelectItem>
                    <SelectItem value="ECE">Electronics & Communication</SelectItem>
                    <SelectItem value="ME">Mechanical Engineering</SelectItem>
                    <SelectItem value="CE">Civil Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Current Year</Label>
                <Select onValueChange={(val: any) => setFormData({...formData, year: val})} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Year</SelectItem>
                    <SelectItem value="2nd">2nd Year</SelectItem>
                    <SelectItem value="3rd">3rd Year</SelectItem>
                    <SelectItem value="4th">4th Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hostel Name</Label>
                <Input value={formData.hostel} onChange={(e: any) => setFormData({...formData, hostel: e.target.value})} required placeholder="e.g. Krishna Block" />
              </div>
              <div className="space-y-2">
                <Label>Room Number</Label>
                <Input value={formData.room} onChange={(e: any) => setFormData({...formData, room: e.target.value})} required placeholder="e.g. 402-B" />
              </div>
            </div>

            <div className="pt-6 border-t border-border-warm space-y-6">
              <h3 className="font-serif font-bold text-midnight text-lg">Parental / Emergency Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Parent Email Address</Label>
                  <Input type="email" value={formData.parentEmail} onChange={(e: any) => setFormData({...formData, parentEmail: e.target.value})} required placeholder="For approval notifications" />
                </div>
                <div className="space-y-2">
                  <Label>Parent Phone Number</Label>
                  <Input value={formData.parentPhone} onChange={(e: any) => setFormData({...formData, parentPhone: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contact Number</Label>
                  <Input value={formData.emergencyContact} onChange={(e: any) => setFormData({...formData, emergencyContact: e.target.value})} required />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-bold bg-midnight hover:bg-midnight/90 text-ivory" disabled={loading}>
              {loading ? 'Initializing...' : 'Complete Registration'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
