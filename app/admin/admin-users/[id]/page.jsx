'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminUserDetails() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const params = useParams();
  const [authChecked, setAuthChecked] = useState(false); // ✅ Block rendering until auth check completes

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.replace('/admin/login'); // 🔒 Redirect to login if not authenticated
    } else {
      setAuthChecked(true); // ✅ Only show content if authenticated
    }
  }, [router]);


  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      const response = await fetch(`http://localhost:5000/api/admin/admin-users/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          // Unauthorized: redirect to login
          localStorage.removeItem('adminToken');
          router.replace('/admin/login');
          return;
        }
        throw new Error('Failed to fetch admin user');
      }
      const result = await response.json();
      setUser(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [params.id, authChecked]);

   if (!authChecked) {
    return null; // ⛔ Prevent rendering anything while checking auth
  }

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">Error: {error}</div>;
  if (!user) return <div className="text-center p-6">Admin user not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin User #{user.id}</h1>
        <Link href="/admin/admin-users">
          <Button variant="outline">Back to Admin Users</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Admin User Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </CardContent>
      </Card>
    </div>
  );
}