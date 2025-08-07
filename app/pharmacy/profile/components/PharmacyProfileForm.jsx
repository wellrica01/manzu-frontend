import React, { useEffect, useState } from 'react';

export default function PharmacyProfileForm() {
  const [form, setForm] = useState({ name: '', address: '', phone: '', logoUrl: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('pharmacyToken');
        // Placeholder: fetch pharmacy profile (replace endpoint as needed)
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        const data = await res.json();
        setForm({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          logoUrl: data.logoUrl || '',
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

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
      // Placeholder: update pharmacy profile (replace endpoint as needed)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/profile`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading profile...</div>;
  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Pharmacy Info</h2>
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
      <div>
        <label className="block mb-1 font-medium">Name</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Address</label>
        <input
          type="text"
          name="address"
          value={form.address}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Phone</label>
        <input
          type="text"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Logo URL</label>
        <input
          type="text"
          name="logoUrl"
          value={form.logoUrl}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-[#1ABA7F] text-white rounded hover:bg-[#15996a]"
        disabled={submitting}
      >
        {submitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
} 