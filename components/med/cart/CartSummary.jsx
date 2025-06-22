import { Button } from '@/components/ui/button';

const CartSummary = ({ cart, handleCheckout }) => {
  return (
    <div className="text-right mt-6">
      <p className="text-xl font-extrabold text-primary mb-4">
        Total: ₦{cart.totalPrice.toLocaleString()}
      </p>
      <Button
        className="h-12 px-8 text-lg font-semibold rounded-full bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse transition-all duration-300"
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