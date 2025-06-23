import React from 'react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import PrescriptionUpload from './PrescriptionUpload';

const CheckoutForm = ({
  form,
  setForm,
  handleInputChange,
  handleFileChange,
  handleDeliveryMethodChange,
  handleCheckout,
  requiresUpload,
  prescriptionStatuses,
  prescriptionFile,
  resumeOrderId,
  fileInputRef,
  cart,
  getUniquePharmacyAddresses,
  loading,
}) => {
  const [emailError, setEmailError] = React.useState('');
  const [phoneError, setPhoneError] = React.useState('');

  const validateEmail = (email) => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address';
    return '';
  };

  const validatePhone = (phone) => {
    if (!phone) return 'Phone number is required';
    if (!/^\+?\d{10,15}$/.test(phone)) return 'Invalid phone number (10-15 digits)';
    return '';
  };

  const onInputChange = (e) => {
    handleInputChange(e);
    const { name, value } = e.target;
    if (name === 'email') {
      setEmailError(validateEmail(value));
    } else if (name === 'phone') {
      setPhoneError(validatePhone(value));
    }
  };

  const orderItems = useMemo(() => {
    return cart.pharmacies?.flatMap((pharmacy) => pharmacy.items) || [];
  }, [cart.pharmacies]);

  const needsUpload = useMemo(() => {
    if (!requiresUpload || resumeOrderId) return false;
    return orderItems.some(
      (item) =>
        item.medication?.prescriptionRequired &&
        (prescriptionStatuses[item.pharmacyMedicationMedicationId.toString()] || 'none') !== 'verified'
    );
  }, [requiresUpload, prescriptionStatuses, orderItems, resumeOrderId]);

  console.log('CheckoutForm upload rendering:', { requiresUpload, prescriptionStatuses, needsUpload });

  const submitButtonText = useMemo(() => {
    if (resumeOrderId) {
      return 'Continue Payment';
    }

    const hasOTCItems = orderItems.some((item) => !item.medication?.prescriptionRequired);
    const hasPrescriptionItems = orderItems.some((item) => item.medication?.prescriptionRequired);
    const allPrescriptionsVerified =
      hasPrescriptionItems &&
      orderItems
        .filter((item) => item.medication?.prescriptionRequired)
        .every((item) => prescriptionStatuses[item.pharmacyMedicationMedicationId.toString()] === 'verified');

    if (!hasOTCItems && !hasPrescriptionItems) {
      return 'Submit Order';
    }

    if (hasPrescriptionItems && !allPrescriptionsVerified && needsUpload) {
      if (hasOTCItems || allPrescriptionsVerified) {
        return 'Pay Non-Prescription & Submit Prescription';
      }
      return 'Submit Prescription';
    }

    return 'Pay Now';
  }, [orderItems, needsUpload, prescriptionStatuses, resumeOrderId]);

  return (
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="bg-[#1ABA7F]/10 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-bold text-[#225F91]">
          User Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleCheckout} className="space-y-6 flex flex-col" role="form" aria-labelledby="checkout-form-title">
          <div>
            <Label htmlFor="name" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={onInputChange}
              className="mt-2 h-12 text-base font-medium rounded-xl border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
              required
              aria-required="true"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onInputChange}
              className={`mt-2 h-12 text-base font-medium rounded-xl border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300 ${emailError ? 'border-red-500' : ''}`}
              required
              aria-required="true"
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? 'email-error' : undefined}
            />
            {emailError && (
              <p id="email-error" className="text-red-500 text-xs mt-1">{emailError}</p>
            )}
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={onInputChange}
              className={`mt-2 h-12 text-base font-medium rounded-xl border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300 ${phoneError ? 'border-red-500' : ''}`}
              required
              aria-required="true"
              aria-invalid={phoneError ? 'true' : 'false'}
              aria-describedby={phoneError ? 'phone-error' : undefined}
            />
            {phoneError && (
              <p id="phone-error" className="text-red-500 text-xs mt-1">{phoneError}</p>
            )}
          </div>
          {needsUpload && (
            <PrescriptionUpload
              handleFileChange={handleFileChange}
              fileInputRef={fileInputRef}
              prescriptionFile={prescriptionFile}
            />
          )}
          <div>
            <Label className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
              Delivery Method
            </Label>
            <RadioGroup
              value={form.deliveryMethod}
              onValueChange={handleDeliveryMethodChange}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-3"
              aria-label="Delivery method"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="pickup" id="pickup" className="h-5 w-5 text-[#225F91]" />
                <Label htmlFor="pickup" className="text-gray-900 text-base font-medium">Pickup</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="delivery" id="delivery" className="h-5 w-5 text-[#225F91]" />
                <Label htmlFor="delivery" className="text-gray-900 text-base font-medium">Delivery</Label>
              </div>
            </RadioGroup>
            {form.deliveryMethod === 'delivery' && (
              <p className="text-sm text-gray-600 mt-2">Estimated delivery: 2-5 business days. Additional delivery fees may apply.</p>
            )}
          </div>
          {form.deliveryMethod === 'delivery' && (
            <div>
              <Label htmlFor="address" className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Delivery Address
              </Label>
              <Input
                id="address"
                name="address"
                value={form.address}
                onChange={onInputChange}
                className="mt-2 h-12 text-base font-medium rounded-xl border-[#1ABA7F]/20 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)] transition-all duration-300"
                required
                aria-required="true"
              />
            </div>
          )}
          {form.deliveryMethod === 'pickup' && cart.pharmacies.length > 0 && (
            <div>
              <Label className="text-sm font-semibold text-[#225F91] uppercase tracking-wider">
                Pickup Addresses
              </Label>
              <div className="mt-3 space-y-3">
                {getUniquePharmacyAddresses().length > 0 ? (
                  getUniquePharmacyAddresses().map((pharmacy, index) => (
                    <p key={index} className="text-gray-600 text-base font-medium">
                      <span className="font-semibold text-gray-900">{pharmacy.name}</span>: {pharmacy.address}
                    </p>
                  ))
                ) : (
                  <p className="text-red-500 text-base font-medium">Pharmacy address not available. Please select delivery or contact support.</p>
                )}
              </div>
            </div>
          )}
          <Button
            type="submit"
            className="w-full h-14 px-8 text-lg font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            disabled={loading || emailError || phoneError}
            aria-label={submitButtonText}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </span>
            ) : (
              submitButtonText
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CheckoutForm;