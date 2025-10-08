export const DELIVERY_METHODS = {
  PICKUP: 'PICKUP',
  COURIER: 'COURIER',
};

export const PAYMENT_STATUS = {
  IDLE: 'idle',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const FORM_CONFIG = {
  STORAGE_KEY: 'checkoutForm',
  EXPIRY_KEY: 'checkoutFormExpiry',
  EXPIRY_HOURS: 24,
  ADDRESS_MAX_LENGTH: 500,
};

export const VALIDATION_RULES = {
  phone: {
    pattern: /^\+?234\d{10}$|^0\d{10}$/,
    message: 'Enter a valid Nigerian phone number',
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  name: {
    minLength: 2,
    message: 'Name must be at least 2 characters',
  },
  address: {
    message: 'Delivery address is required',
  },
};

export const DELIVERY_OPTIONS = [
  {
    value: DELIVERY_METHODS.PICKUP,
    label: 'Pickup',
    description: 'Collect from pharmacy',
  },
  {
    value: DELIVERY_METHODS.COURIER,
    label: 'Delivery',
    description: 'Delivered to your address',
  },
];

export const ORDER_TYPES = {
  MIXED: {
    type: 'mixed',
    title: 'Mixed Order - OTC + Verified Prescriptions',
    badgeClass: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md',
  },
  OTC_ONLY: {
    type: 'otc_only',
    title: 'Over-the-Counter Order',
    badgeClass: 'bg-gradient-to-r from-[#1ABA7F] to-[#16a876] text-white border-0 shadow-md',
  },
  PRESCRIPTION_VERIFIED: {
    type: 'prescription_verified',
    title: 'Prescription Order - All Verified',
    badgeClass: 'bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-md',
  },
  READY: {
    type: 'ready',
    title: 'Ready for Checkout',
    badgeClass: 'bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white border-0 shadow-md',
  },
};

export const ERROR_MESSAGES = {
  'Invalid email address': 'Please enter a valid email address.',
  'Invalid phone number (10-15 digits)': 'Please enter a valid phone number with 10-15 digits.',
  'Address is required for delivery': 'Please provide a delivery address.',
  'Cart is empty or invalid': 'Your cart is empty or contains invalid medications.',
  'One or more pharmacy addresses are not available for pickup': 
    'One or more pharmacy addresses are unavailable for pickup. Please select delivery or contact support.',
  'Checkout failed: Server error': 'An error occurred during checkout. Please try again or contact support.',
  'Invalid transaction parameters': 'Payment couldn\'t be processed. Please check your details and try again.',
  'Failed to fetch cart or invalid cart data': 'Unable to load cart. Please try again or contact support.',
  'Invalid cart data: missing or invalid pharmacies': 'Unable to load cart. Please try again or contact support.',
  'Guest ID not found': 'Unable to identify user. Please try again or contact support.',
  'All fields are required': 'Please fill in all required fields.',
  'Invalid phone number': 'Please enter a valid phone number.',
  'No medications ready for checkout': 'Please complete prescription requirements in your cart.',
  'Network request failed': 'Network error. Please check your connection and try again.',
  'Request timeout': 'Request timed out. Please try again.',
  'Phone number is required': 'Phone number is required',
  'Name is required': 'Name is required',
  'Please fill in all required fields correctly': 'Please fill in all required fields correctly before proceeding.',
};