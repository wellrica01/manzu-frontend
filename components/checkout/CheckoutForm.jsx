'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Truck, 
  Store, 
  CheckCircle, 
  AlertCircle,
  Package,
  Shield,
  Info,
  CreditCard,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CheckoutForm = ({
  form,
  setForm,
  handleInputChange,
  handleDeliveryMethodChange,
  handleCheckout,
  segments,
  getUniquePharmacyAddresses,
  loading,
}) => {
  const [showUploadStatus, setShowUploadStatus] = useState(false);

  const validatePhone = () => {
    if (!form.phone) return 'Phone number is required';
    if (!/^\+?\d{10,15}$/.test(form.phone)) {
      return 'Please enter a valid phone number';
    }
    return null;
  };

  const validateEmail = () => {
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const getOrderType = () => {
    const hasOTC = segments.readyForCheckout.some(item => !item.medication.prescriptionRequired);
    const hasPrescription = segments.readyForCheckout.some(item => item.medication.prescriptionRequired);

    if (hasOTC && hasPrescription) {
      return {
        type: 'mixed',
        title: 'Mixed Order - OTC + Verified Prescriptions',
        description: 'All items are ready for immediate payment.',
        buttonText: 'Pay Now',
        buttonIcon: 'CreditCard',
        infoColor: 'green'
      };
    } else if (hasOTC && !hasPrescription) {
      return {
        type: 'otc_only',
        title: 'Over-the-Counter Order',
        description: 'All items are ready for immediate payment.',
        buttonText: 'Pay Now',
        buttonIcon: 'CreditCard',
        infoColor: 'green'
      };
    } else if (hasPrescription && !hasOTC) {
      return {
        type: 'prescription_verified',
        title: 'Prescription Order - All Verified',
        description: 'All prescription items are verified and ready for payment.',
        buttonText: 'Pay Now',
        buttonIcon: 'CreditCard',
        infoColor: 'green'
      };
    } else {
      return {
        type: 'empty',
        title: 'Review Your Order',
        description: 'Please review your cart items.',
        buttonText: 'Continue',
        buttonIcon: 'ArrowRight',
        infoColor: 'gray'
      };
    }
  };

  const orderType = getOrderType();

  return (
    <Card className="bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm transition-all duration-500 hover:ring-2 hover:ring-[#1ABA7F]/30">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="bg-[#225F91]/10 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-bold text-[#225F91] flex items-center gap-2">
          <User className="h-6 w-6 text-[#1ABA7F]" />
          Contact Information
        </CardTitle>
        {/* Order Type Badge */}
        <div className="mt-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
            orderType.infoColor === 'green' ? 'bg-green-100 text-green-800' :
            orderType.infoColor === 'blue' ? 'bg-blue-100 text-blue-800' :
            orderType.infoColor === 'orange' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            <Package className="h-3 w-3" />
            {orderType.title}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 space-y-6">
        <form onSubmit={handleCheckout} className="space-y-6">
          {/* Order Type Description */}
          <div className={`p-4 rounded-xl border ${
            orderType.infoColor === 'green' ? 'bg-green-50 border-green-200' :
            orderType.infoColor === 'blue' ? 'bg-blue-50 border-blue-200' :
            orderType.infoColor === 'orange' ? 'bg-orange-50 border-orange-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-gray-900 mb-1">{orderType.description}</p>
                <p className="text-gray-600">All items are ready for immediate checkout.</p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="border-[#1ABA7F]/20 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_8px_rgba(26,186,127,0.3)] transition-all duration-300"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder="+234 801 234 5678"
                  className="border-[#1ABA7F]/20 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_8px_rgba(26,186,127,0.3)] transition-all duration-300"
                  required
                />
                {validatePhone() && (
                  <p className="text-xs text-red-600">{validatePhone()}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address (Optional)
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleInputChange}
                placeholder="your.email@example.com"
                className="border-[#1ABA7F]/20 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_8px_rgba(26,186,127,0.3)] transition-all duration-300"
              />
              {validateEmail() && (
                <p className="text-xs text-red-600">{validateEmail()}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Delivery Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Truck className="h-5 w-5 text-[#1ABA7F]" />
              Delivery Method
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleDeliveryMethodChange('pickup')}
                className={cn(
                  "p-4 border-2 rounded-xl text-left transition-all duration-300",
                  form.deliveryMethod === 'pickup'
                    ? "border-[#1ABA7F] bg-[#1ABA7F]/10"
                    : "border-gray-200 hover:border-[#1ABA7F]/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-[#1ABA7F]" />
                  <div>
                    <div className="font-medium text-gray-900">Pickup</div>
                    <div className="text-sm text-gray-600">Collect from pharmacy</div>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handleDeliveryMethodChange('delivery')}
                className={cn(
                  "p-4 border-2 rounded-xl text-left transition-all duration-300",
                  form.deliveryMethod === 'delivery'
                    ? "border-[#1ABA7F] bg-[#1ABA7F]/10"
                    : "border-gray-200 hover:border-[#1ABA7F]/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-[#1ABA7F]" />
                  <div>
                    <div className="font-medium text-gray-900">Delivery</div>
                    <div className="text-sm text-gray-600">Delivered to your address</div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Delivery Address */}
          {form.deliveryMethod === 'delivery' && (
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                Delivery Address *
              </Label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                placeholder="Enter your complete delivery address"
                rows={3}
                className="w-full border border-[#1ABA7F]/20 rounded-lg px-3 py-2 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_8px_rgba(26,186,127,0.3)] transition-all duration-300 resize-none"
                required
              />
            </div>
          )}

          {/* Pickup Information */}
          {form.deliveryMethod === 'pickup' && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Pickup Locations</p>
                  <div className="space-y-1">
                    {getUniquePharmacyAddresses().map((address, index) => (
                      <p key={index} className="text-blue-700">{address}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Security Notice */}
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Secure Checkout</p>
                <p>Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full h-14 text-lg font-semibold rounded-xl bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_20px_rgba(34,95,145,0.4)] transition-all duration-300"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                {orderType.buttonText}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CheckoutForm;