import { Button } from '@/components/ui/button';

const CartSummary = ({ cart, handleCheckout }) => {
  return (
    <div className="text-right mt-8">
      <p className="text-xl font-bold text-[#225F91] mb-4">
        Total: ₦{cart.totalPrice.toLocaleString()}
      </p>
      <Button
        className="h-12 px-8 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.3)] transition-all duration-300"
        onClick={handleCheckout}
        disabled={cart.pharmacies.length === 0}
        aria-label="Proceed to checkout"
      >
        Proceed to Checkout
      </Button>
    </div>
  );
};

export default CartSummary;