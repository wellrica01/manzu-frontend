'use client';
import { useState, useEffect } from 'react';
import PharmacyInfoCard from './components/PharmacyInfoCard';
import EditProfileDialog from './components/EditProfileDialog';
import ChangePasswordDialog from './components/ChangePasswordDialog';
import { UserCircle } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('pharmacyToken');
      const res = await fetch('http://localhost:5000/api/pharmacy/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      setProfile(data.pharmacy);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEditClose = (updated) => {
    setShowEdit(false);
    if (updated) fetchProfile();
  };
  const handlePasswordClose = (changed) => {
    setShowPassword(false);
    // Optionally show a toast or message if changed
  };

  if (loading) return <div className="p-6">Loading profile...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 mb-6 pb-2 flex items-center gap-3">
        <UserCircle className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold">Pharmacy Profile & Settings</h1>
      </div>
      <PharmacyInfoCard
        pharmacy={profile}
        onEdit={() => setShowEdit(true)}
        onChangePassword={() => setShowPassword(true)}
      />
      <EditProfileDialog open={showEdit} onClose={handleEditClose} pharmacy={profile} />
      <ChangePasswordDialog open={showPassword} onClose={handlePasswordClose} />
    </div>
  );
}
