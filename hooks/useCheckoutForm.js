import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { DELIVERY_METHODS, ERROR_MESSAGES } from '../constants/checkout';
import { 
  validateEmail, 
  validatePhone, 
  sanitizeInput,
  saveFormToStorage,
  loadFormFromStorage,
  clearFormStorage
} from '@/lib/checkoutUtils';

export function useCheckoutForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    deliveryMethod: DELIVERY_METHODS.PICKUP,
  });

  // Load form from storage on mount
  useEffect(() => {
    const savedForm = loadFormFromStorage();
    if (savedForm) {
      setForm(savedForm);
    }
  }, []);

  // Save form to storage with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveFormToStorage(form);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: sanitizeInput(value) }));
  }, []);

  const handleDeliveryMethodChange = useCallback((value) => {
    setForm(prev => ({ 
      ...prev, 
      deliveryMethod: value, 
      address: value === DELIVERY_METHODS.PICKUP ? '' : prev.address 
    }));
  }, []);

  const validateForm = useCallback(() => {
    const errors = [];

    if (!form.name || form.name.length < 2) {
      errors.push('Please enter a valid name.');
    }

    if (!form.phone || !validatePhone(form.phone)) {
      errors.push('Please enter a valid phone number (10-15 digits).');
    }

    if (form.email && !validateEmail(form.email)) {
      errors.push('Please enter a valid email address.');
    }

    if (form.deliveryMethod === DELIVERY_METHODS.COURIER && !form.address) {
      errors.push('Address is required for delivery.');
    }

    if (errors.length > 0) {
      throw new Error(errors[0]);
    }
  }, [form]);

  const clearForm = useCallback(() => {
    clearFormStorage();
    setForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      deliveryMethod: DELIVERY_METHODS.PICKUP,
    });
  }, []);

  return {
    form,
    setForm,
    handleInputChange,
    handleDeliveryMethodChange,
    validateForm,
    clearForm
  };
}