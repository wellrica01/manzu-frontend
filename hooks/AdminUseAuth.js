'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

export function AdminUseAuth(redirect = true) {
  const [adminId, setAdminId] = useState(null);
  const [adminRole, setAdminRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');

    if (!token) {
      if (redirect) router.replace('/admin/login');
      setIsLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const { id, role } = decoded;

      if (!id || !['admin', 'support'].includes(role)) {
        throw new Error('Unauthorized');
      }

      setAdminId(id);
      setAdminRole(role);
    } catch (err) {
      localStorage.removeItem('adminToken');
      if (redirect) router.replace('/admin/login');
    } finally {
      setIsLoading(false);
    }
  }, [router, redirect]);

  return {
    adminId,
    adminRole,
    isAuthenticated: !!adminId,
    isLoading,
  };
}
