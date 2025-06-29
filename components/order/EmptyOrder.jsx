import { Card } from '@/components/ui/card';
import Link from 'next/link';

const EmptyOrder = () => {
  return (
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm text-center py-12 animate-in slide-in-from-top duration-700">
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <p className="text-gray-600 text-lg font-medium">
        Your order is empty.{' '}
        <Link
          href="/"
          className="text-[#225F91] hover:text-[#1A4971] font-semibold underline transition-colors duration-300"
        >
          Start shopping
        </Link>
      </p>
    </Card>
  );
};

export default EmptyOrder;