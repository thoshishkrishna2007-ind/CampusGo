import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { User, Phone, Mail, Building, Shield, Calendar, MapPin, Camera } from 'lucide-react';
import { format } from 'date-fns';
import EditProfileForm from '../components/EditProfileForm';

export default function ProfilePage() {
  const { dbUser, user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  if (!dbUser) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-serif font-bold text-midnight">My Profile</h2>
        <Button 
          onClick={() => setEditing(!editing)}
          variant={editing ? "outline" : "default"}
          className={editing ? "border-border-warm" : "bg-midnight text-ivory"}
        >
          {editing ? 'Cancel Editing' : 'Edit Profile'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <Card className="md:col-span-1 border-border-warm overflow-hidden h-fit">
          <div className="h-24 bg-midnight relative">
             <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-antique-gold/20 flex items-center justify-center text-3xl font-bold text-midnight overflow-hidden relative group">
                  {dbUser.photoUrl ? (
                    <img src={dbUser.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    dbUser.name.charAt(0)
                  )}
                  {editing && (
                    <div className="absolute inset-0 bg-midnight/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="text-white" size={20} />
                    </div>
                  )}
                </div>
             </div>
          </div>
          <CardContent className="pt-16 text-center space-y-2 pb-8">
            <h3 className="text-xl font-serif font-bold text-midnight">{dbUser.name}</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-antique-gold">{dbUser.role.replace('_', ' ')}</p>
            <div className="pt-4 space-y-3 text-left">
               <div className="flex items-center gap-3 text-sm text-midnight/60">
                 <Mail size={14} className="text-midnight/40" />
                 <span className="truncate">{dbUser.email}</span>
               </div>
               {dbUser.phone && (
                 <div className="flex items-center gap-3 text-sm text-midnight/60">
                   <Phone size={14} className="text-midnight/40" />
                   <span>{dbUser.phone}</span>
                 </div>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Detailed Info / Form */}
        <Card className="md:col-span-2 border-border-warm">
          <CardHeader>
            <CardTitle className="font-serif">Identity & Institutional Details</CardTitle>
            <CardDescription>View and manage your official record in the CampusGo system.</CardDescription>
          </CardHeader>
          <CardContent>
            {editing ? (
              <EditProfileForm 
                onSuccess={() => {
                  setEditing(false);
                  refreshUser();
                }} 
                onCancel={() => setEditing(false)} 
              />
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <InfoItem icon={Shield} label="User ID / Reg No" value={dbUser.studentProfile?.idNo || dbUser.staffProfile?.employeeId || 'N/A'} />
                  <InfoItem icon={Building} label="Department" value={dbUser.studentProfile?.department || dbUser.staffProfile?.department || 'N/A'} />
                  {dbUser.role === 'student' && (
                    <>
                      <InfoItem icon={MapPin} label="Hostel & Room" value={`${dbUser.studentProfile?.hostel} · Room ${dbUser.studentProfile?.room}`} />
                      <InfoItem icon={Calendar} label="Year of Study" value={`${dbUser.studentProfile?.year} Year`} />
                    </>
                  )}
                  {dbUser.staffProfile && (
                    <InfoItem icon={Shield} label="Designation" value={dbUser.staffProfile.designation} />
                  )}
                </div>

                <div className="pt-6 border-t border-border-warm">
                  <h4 className="text-[10px] uppercase font-bold text-midnight/30 tracking-widest mb-4">Account Security</h4>
                  <div className="flex items-center justify-between p-4 bg-neutral rounded-lg border border-border-warm">
                    <div>
                      <p className="text-sm font-bold text-midnight">Last Login Activity</p>
                      <p className="text-xs text-midnight/40">{dbUser.lastLoginAt ? format(new Date(dbUser.lastLoginAt), 'PPP · p') : 'First session active'}</p>
                    </div>
                    <Button variant="outline" size="sm" className="text-xs border-border-warm">Reset Password</Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded bg-neutral flex items-center justify-center text-midnight/40 border border-border-warm shrink-0">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[10px] uppercase font-bold text-midnight/30 leading-none mb-1">{label}</p>
        <p className="text-sm font-semibold text-midnight">{value}</p>
      </div>
    </div>
  );
}
