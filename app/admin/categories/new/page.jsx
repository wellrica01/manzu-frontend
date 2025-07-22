"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CategoryForm from '../CategoryForm';
import { createCategory } from '../api';

export default function NewCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      await createCategory(data);
      router.push('/admin/categories');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add Category</h1>
      <CategoryForm onSubmit={handleSubmit} loading={loading} error={error} />
    </div>
  );
} 