import React, { useState } from 'react';
import { X, Home } from 'lucide-react';

export default function EditProfileDialog({ open, onClose, pharmacy }) {
  const [form, setForm] = useState(pharmacy || {});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  React.useEffect(() => {
    setForm(pharmacy || {});
    setError(null);
    setSuccess(null);
  }, [pharmacy, open]);

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('pharmacyToken');
      const res = await fetch('http://localhost:5000/api/pharmacy/profile', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: {}, pharmacy: form }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      setSuccess('Profile updated!');
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
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 focus:outline-none"
          onClick={() => onClose(false)}
          aria-label="Close Edit Profile Dialog"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <Home className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">Edit Pharmacy Profile</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-500">{error}</div>}
          {success && <div className="text-green-600">{success}</div>}
          <div className="border-b pb-2 mb-2">
            <label className="block mb-1 font-medium">Name</label>
            <input type="text" name="name" value={form.name || ''} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50" aria-label="Pharmacy Name" />
          </div>
          <div className="border-b pb-2 mb-2">
            <label className="block mb-1 font-medium">Address</label>
            <input type="text" name="address" value={form.address || ''} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50" aria-label="Pharmacy Address" />
          </div>
          <div className="border-b pb-2 mb-2">
            <label className="block mb-1 font-medium">Phone <span className="text-xs text-gray-400">(e.g. 08012345678)</span></label>
            <input type="text" name="phone" value={form.phone || ''} onChange={handleChange} required className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 font-mono" aria-label="Pharmacy Phone" />
          </div>
          <div className="border-b pb-2 mb-2">
            <label className="block mb-1 font-medium">Logo URL <span className="text-xs text-gray-400" title="Paste a direct image URL">(optional)</span></label>
            <input type="text" name="logoUrl" value={form.logoUrl || ''} onChange={handleChange} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50" aria-label="Pharmacy Logo URL" />
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-primary/50 transition flex items-center justify-center gap-2" disabled={submitting} aria-label="Save Profile Changes">
              {submitting && <span className="loader border-t-2 border-white border-solid rounded-full w-4 h-4 animate-spin" />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-gray-400 transition" onClick={() => onClose(false)} disabled={submitting} aria-label="Cancel Edit Profile">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 