import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { useAuth } from '../lib/AuthContext';

interface EditProfileFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditProfileForm({ onSuccess, onCancel }: EditProfileFormProps) {
  const { dbUser, user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: dbUser?.name || '',
    phone: dbUser?.phone || '',
    photoUrl: dbUser?.photoUrl || '',
    studentData: {
      room: dbUser?.studentProfile?.room || '',
      parentPhone: dbUser?.studentProfile?.parentPhone || '',
      emergencyContact: dbUser?.studentProfile?.emergencyContact || '',
    },
    staffData: {
      designation: dbUser?.staffProfile?.designation || '',
      department: dbUser?.staffProfile?.department || '',
    }
  });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await user?.getIdToken();
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Profile updated successfully');
        await refreshUser();
        onSuccess?.();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Update failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!dbUser) return null;

  return (
    <form onSubmit={handleUpdate} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input 
            id="name"
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Mobile Number</Label>
          <Input 
            id="phone"
            value={formData.phone} 
            onChange={(e) => setFormData({...formData, phone: e.target.value})} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="photoUrl">Profile Picture URL</Label>
        <Input 
          id="photoUrl"
          value={formData.photoUrl} 
          onChange={(e) => setFormData({...formData, photoUrl: e.target.value})} 
          placeholder="https://example.com/photo.jpg"
        />
      </div>

      {dbUser.role === 'student' && (
        <div className="space-y-6 pt-4 border-t border-border-warm">
          <h4 className="text-sm font-bold uppercase text-midnight/40">Student Records</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="room">Room Number</Label>
              <Input 
                id="room"
                value={formData.studentData.room} 
                onChange={(e) => setFormData({
                  ...formData, 
                  studentData: {...formData.studentData, room: e.target.value}
                })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentPhone">Parent Phone</Label>
              <Input 
                id="parentPhone"
                value={formData.studentData.parentPhone} 
                onChange={(e) => setFormData({
                  ...formData, 
                  studentData: {...formData.studentData, parentPhone: e.target.value}
                })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input 
                id="emergencyContact"
                value={formData.studentData.emergencyContact} 
                onChange={(e) => setFormData({
                  ...formData, 
                  studentData: {...formData.studentData, emergencyContact: e.target.value}
                })} 
              />
            </div>
          </div>
        </div>
      )}

      {['admin', 'co_admin', 'faculty', 'warden', 'security'].includes(dbUser.role) && (
        <div className="space-y-6 pt-4 border-t border-border-warm">
          <h4 className="text-sm font-bold uppercase text-midnight/40">Staff Records</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input 
                id="designation"
                value={formData.staffData.designation} 
                onChange={(e) => setFormData({
                  ...formData, 
                  staffData: {...formData.staffData, designation: e.target.value}
                })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input 
                id="department"
                value={formData.staffData.department} 
                onChange={(e) => setFormData({
                  ...formData, 
                  staffData: {...formData.staffData, department: e.target.value}
                })} 
              />
            </div>
          </div>
        </div>
      )}

      <div className="pt-6 flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="bg-midnight text-ivory" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
