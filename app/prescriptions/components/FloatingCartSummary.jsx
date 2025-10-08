
import React from 'react';

/**
 * FloatingCartSummary Component
 * Displays a floating "Go to Cart" button with item count
 * Only visible when cart has items
 * 
 * @param {Object} props
 * @param {number} props.cartItemsCount - Number of items in cart
 * @param {Function} props.onViewCart - Callback when cart button is clicked
 */
export const FloatingCartSummary = React.memo(({ cartItemsCount, onViewCart }) => {
  if (cartItemsCount === 0) return null;
  
  return (
    <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="relative">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full blur-2xl opacity-50 animate-pulse" />
        
        {/* Cart button */}
        <button
          onClick={onViewCart}
          aria-label={`View cart with ${cartItemsCount} items`}
          className="relative h-16 px-10 rounded-2xl bg-gradient-to-r from-[#1ABA7F] to-[#225F91] text-white font-black text-lg shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 border-2 border-white flex items-center gap-3"
        >
          <svg 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={3}
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
          Go to Cart ({cartItemsCount})
        </button>
      </div>
    </div>
  );
});

FloatingCartSummary.displayName = 'FloatingCartSummary';

export default FloatingCartSummary;