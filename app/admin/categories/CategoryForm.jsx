"use client";
import { useState } from 'react';

export default function CategoryForm({ initialData = {}, onSubmit, loading = false, error = null }) {
  const [name, setName] = useState(initialData.name || '');
  const [formError, setFormError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    try {
      await onSubmit({ name });
    } catch (err) {
      setFormError(err.message || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
      <div>
        <label className="block font-semibold mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          disabled={loading}
        />
      </div>
      {(formError || error) && <div className="text-red-600">{formError || error}</div>}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
} 