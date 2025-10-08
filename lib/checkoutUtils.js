import { FORM_CONFIG } from '../constants/checkout';

// Validation functions
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-]{10,15}$/;
  return phoneRegex.test(phone);
};

export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  // Remove dangerous characters
  return input.replace(/[<>;"'{}$]/g, "");
};

// Storage functions
const isFormExpired = () => {
  const expiry = localStorage.getItem(FORM_CONFIG.EXPIRY_KEY);
  if (!expiry) return true;
  return Date.now() > parseInt(expiry, 10);
};

export const saveFormToStorage = (formData) => {
  try {
    const expiryTime = Date.now() + (FORM_CONFIG.EXPIRY_HOURS * 60 * 60 * 1000);
    localStorage.setItem(FORM_CONFIG.STORAGE_KEY, JSON.stringify(formData));
    localStorage.setItem(FORM_CONFIG.EXPIRY_KEY, expiryTime.toString());
  } catch (error) {
    console.warn('Unable to save form data');
  }
};

export const loadFormFromStorage = () => {
  try {
    if (isFormExpired()) {
      localStorage.removeItem(FORM_CONFIG.STORAGE_KEY);
      localStorage.removeItem(FORM_CONFIG.EXPIRY_KEY);
      return null;
    }
    const saved = localStorage.getItem(FORM_CONFIG.STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
};

export const clearFormStorage = () => {
  try {
    localStorage.removeItem(FORM_CONFIG.STORAGE_KEY);
    localStorage.removeItem(FORM_CONFIG.EXPIRY_KEY);
  } catch (error) {
    // Silent fail
  }
};

// Get unique pharmacies
export const getUniquePharmacies = (items) => {
  const pharmacies = items
    .map((item) => item.pharmacy)
    .filter(Boolean);

  const unique = new Map();
  pharmacies.forEach((pharmacy) => {
    const key = `${pharmacy.name}-${pharmacy.address}`;
    if (!unique.has(key)) {
      unique.set(key, pharmacy);
    }
  });

  return [...unique.values()];
};