import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  DELIVERY_METHODS, 
  VALIDATION_RULES, 
  ERROR_MESSAGES,
  ORDER_TYPES 
} from '../constants/checkout';
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

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    address: false,
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

  // Input change handler
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: sanitizeInput(value) }));
  }, []);

  // Delivery method change handler
  const handleDeliveryMethodChange = useCallback((value) => {
    setForm(prev => ({ 
      ...prev, 
      deliveryMethod: value, 
      address: value === DELIVERY_METHODS.PICKUP ? '' : prev.address 
    }));
  }, []);

  // Blur handler
  const handleBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  }, []);

  // Validate individual field
  const validateField = useCallback((fieldName, value) => {
    switch (fieldName) {
      case 'name':
        if (!value) {
          return ERROR_MESSAGES['Name is required'];
        }
        if (value.length < VALIDATION_RULES.name.minLength) {
          return VALIDATION_RULES.name.message;
        }
        return null;

      case 'phone':
        if (!value) {
          return ERROR_MESSAGES['Phone number is required'];
        }
        if (!VALIDATION_RULES.phone.pattern.test(value)) {
          return VALIDATION_RULES.phone.message;
        }
        return null;

      case 'email':
        if (value && !VALIDATION_RULES.email.pattern.test(value)) {
          return VALIDATION_RULES.email.message;
        }
        return null;

      case 'address':
        if (form.deliveryMethod === DELIVERY_METHODS.COURIER && !value) {
          return VALIDATION_RULES.address.message;
        }
        return null;

      default:
        return null;
    }
  }, [form.deliveryMethod]);

  // Field errors (memoized)
  const errors = useMemo(() => ({
    name: touched.name ? validateField('name', form.name) : null,
    phone: touched.phone ? validateField('phone', form.phone) : null,
    email: touched.email ? validateField('email', form.email) : null,
    address: touched.address ? validateField('address', form.address) : null,
  }), [touched, form, validateField]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const hasRequiredFields = form.name && form.phone;
    const hasNoErrors = !validateField('name', form.name) && 
                        !validateField('phone', form.phone) && 
                        !validateField('email', form.email);
    const hasAddressIfNeeded = form.deliveryMethod === DELIVERY_METHODS.COURIER 
      ? !!form.address 
      : true;

    return hasRequiredFields && hasNoErrors && hasAddressIfNeeded;
  }, [form, validateField]);

  // Validate entire form (throws error)
  const validateForm = useCallback(() => {
    const validationErrors = [];

  // Trim values for validation
  const trimmedName = form.name.trim();
  const trimmedPhone = form.phone.trim();
  const trimmedEmail = form.email.trim();
  const trimmedAddress = form.address.trim();

    if (!trimmedName || trimmedName.length < VALIDATION_RULES.name.minLength) {
      validationErrors.push(VALIDATION_RULES.name.message);
    }

    if (!trimmedPhone || !VALIDATION_RULES.phone.pattern.test(trimmedPhone)) {
      validationErrors.push(VALIDATION_RULES.phone.message);
    }

    if (trimmedEmail && !VALIDATION_RULES.email.pattern.test(trimmedEmail)) {
      validationErrors.push(VALIDATION_RULES.email.message);
    }

    if (form.deliveryMethod === DELIVERY_METHODS.COURIER && !trimmedAddress) {
      validationErrors.push(ERROR_MESSAGES['Address is required for delivery']);
    }

    if (validationErrors.length > 0) {
      throw new Error(validationErrors[0]);
    }
  }, [form]);

  // Determine order type based on segments
  const getOrderType = useCallback((segments) => {
    const hasOTC = segments.readyForCheckout.some(
      item => !item.medication.prescriptionRequired
    );
    const hasPrescription = segments.readyForCheckout.some(
      item => item.medication.prescriptionRequired
    );

    if (hasOTC && hasPrescription) {
      return ORDER_TYPES.MIXED;
    } else if (hasOTC && !hasPrescription) {
      return ORDER_TYPES.OTC_ONLY;
    } else if (hasPrescription && !hasOTC) {
      return ORDER_TYPES.PRESCRIPTION_VERIFIED;
    } else {
      return ORDER_TYPES.READY;
    }
  }, []);

  // Clear form
  const clearForm = useCallback(() => {
    clearFormStorage();
    setForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      deliveryMethod: DELIVERY_METHODS.PICKUP,
    });
    setTouched({
      name: false,
      email: false,
      phone: false,
      address: false,
    });
  }, []);

  return {
    form,
    setForm,
    touched,
    errors,
    isFormValid,
    handleInputChange,
    handleDeliveryMethodChange,
    handleBlur,
    validateField,
    validateForm,
    getOrderType,
    clearForm
  };
}