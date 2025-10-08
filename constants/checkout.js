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
};
