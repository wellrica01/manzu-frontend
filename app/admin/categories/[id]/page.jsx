"use client";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import CategoryForm from '../CategoryForm';
import { fetchCategory, updateCategory } from '../api';

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchCategory(id)
      .then((res) => {
        setInitialData(res.category || res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (data) => {
    setFormLoading(true);
    setFormError(null);
    try {
      await updateCategory(id, data);
      router.push('/admin/categories');
    } catch (err) {
      setFormError(err.message);
      setFormLoading(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Category</h1>
      <CategoryForm initialData={initialData} onSubmit={handleSubmit} loading={formLoading} error={formError} />
    </div>
  );
} 