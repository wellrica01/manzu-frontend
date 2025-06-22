import { Card } from '@/components/ui/card';
import Link from 'next/link';

const EmptyCart = () => {
  return (
    <Card
      className="shadow-2xl border border-gray-100/30 rounded-3xl bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md text-center py-12 animate-in slide-in-from-top-10 duration-500"
    >
      <p className="text-gray-600 text-lg font-medium">
        Your cart is empty.{' '}
        <Link href="/med" className="text-primary hover:text-primary/80 font-semibold underline transition-colors duration-200">
          Start shopping
        </Link>
      </p>
    </Card>
  );
};

export default EmptyCart;