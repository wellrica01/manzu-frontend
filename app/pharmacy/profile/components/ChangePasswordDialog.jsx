import React, { useState } from 'react';
import { X, KeyRound } from 'lucide-react';

export default function ChangePasswordDialog({ open, onClose }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  React.useEffect(() => {
    setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setError(null);
    setSuccess(null);
  }, [open]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match');
      setSubmitting(false);
      return;
    }
    try {
      const token = localStorage.getItem('pharmacyToken');
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      if (!res.ok) throw new Error('Failed to change password');
      setSuccess('Password changed!');
      setTimeout(() => onClose(true), 800);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none"
          onClick={() => onClose(false)}
          aria-label="Close Change Password Dialog"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Change Password</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500">{error}</div>}
          {success && <div className="text-green-600">{success}</div>}
          <div className="border-b pb-2 mb-2">
            <label className="block mb-1 font-medium">Current Password</label>
            <input type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50" aria-label="Current Password" />
          </div>
          <div className="border-b pb-2 mb-2">
            <label className="block mb-1 font-medium">New Password</label>
            <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50" aria-label="New Password" />
          </div>
          <div className="border-b pb-2 mb-2">
            <label className="block mb-1 font-medium">Confirm New Password</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50" aria-label="Confirm New Password" />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition flex items-center justify-center gap-2" disabled={submitting} aria-label="Change Password">
              {submitting && <span className="loader border-t-2 border-white border-solid rounded-full w-4 h-4 animate-spin" />}
              {submitting ? 'Changing...' : 'Change Password'}
            </button>
            <button type="button" className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-gray-400 transition" onClick={() => onClose(false)} disabled={submitting} aria-label="Cancel Change Password">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 