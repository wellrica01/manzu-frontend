'use client';

import * as React from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';

const ResumeOrderModal = () => {
  const [form, setForm] = React.useState({ email: '', phone: '' });
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const handleResume = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(
        'http://localhost:5000/api/checkout/session/retrieve',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resume session');
      }
      const data = await response.json();
      localStorage.setItem('guestId', data.guestId);
      localStorage.setItem('prescriptionId', data.prescriptionId);
      localStorage.setItem('resumeOrderId', data.order?.id); // ✅ Save the order ID


      setOpen(false); // CLOSE THE MODAL FIRST

      // Wait a tick to ensure modal closes before navigation
      setTimeout(() => {
        router.push('/checkout');
      }, 200);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="link"
          className="text-foreground hover:text-secondary font-medium"
        >
          Resume Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
        <DialogHeader>
          <DialogTitle>Resume Order</DialogTitle>
          <DialogDescription>
            Enter your email and phone number to resume your previous order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleResume} className="mt-4 flex flex-col gap-4">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Enter email"
            required
            className="input input-bordered w-full"
          />
          <input
            type="text"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Enter phone"
            required
            className="input input-bordered w-full"
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Loading...' : 'Resume Order'}
          </Button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </form>
        <DialogClose asChild>
          <button aria-label="Close" className="absolute top-4 right-4">
            ✕
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default ResumeOrderModal;
