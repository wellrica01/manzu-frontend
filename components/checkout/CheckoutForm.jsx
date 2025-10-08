'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Truck, 
  Package,
  Shield,
  CreditCard,
  Loader2,
  Store,
  MapPin,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DELIVERY_METHODS, DELIVERY_OPTIONS, FORM_CONFIG } from '../../constants/checkout';

const CheckoutForm = ({
  form,
  touched,
  errors,
  isFormValid,
  handleInputChange,
  handleDeliveryMethodChange,
  handleBlur,
  handleCheckout,
  orderType,
  uniquePharmacies,
  loading
}) => {
  return (
    <Card className="relative bg-white border-2 border-[#1ABA7F]/20 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_rgba(26,186,127,0.15)]">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#1ABA7F]/10 to-transparent rounded-br-full" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#225F91]/10 to-transparent rounded-tl-full" />
      
      <CardHeader className="relative z-10 bg-gradient-to-r from-[#225F91]/10 via-[#1ABA7F]/5 to-transparent p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-xl blur-lg opacity-30 animate-pulse" />
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#1ABA7F] to-[#16a876] flex items-center justify-center shadow-lg">
              <User className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl font-black text-[#225F91] tracking-tight">
            Contact Information
          </CardTitle>
        </div>
        
        <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold", orderType.badgeClass)}>
          <Package className="h-3 w-3" />
          {orderType.title}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 p-5 sm:p-8 space-y-6">
        <form onSubmit={(e) => { e.preventDefault(); handleCheckout(e); }} className="space-y-6" noValidate>
          {/* Contact Fields */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-[#1ABA7F]" />
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('name')}
                  placeholder="Enter your full name"
                  className={cn(
                    "border-2 h-12 rounded-xl transition-all duration-300 focus:shadow-[0_0_20px_rgba(26,186,127,0.2)]",
                    errors.name ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#1ABA7F]"
                  )}
                  aria-required="true"
                  aria-invalid={!!errors.name}
                  required
                />
                {errors.name && (
                  <p className="text-xs text-red-600 font-medium flex items-center gap-1">
                    {errors.name}
                  </p>
                )}
              </div>
              
              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-[#225F91]" />
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('phone')}
                  placeholder="+234 801 234 5678"
                  className={cn(
                    "border-2 h-12 rounded-xl transition-all duration-300 focus:shadow-[0_0_20px_rgba(34,95,145,0.2)]",
                    errors.phone ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#225F91]"
                  )}
                  aria-required="true"
                  aria-invalid={!!errors.phone}
                  required
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 font-medium">{errors.phone}</p>
                )}
              </div>
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-[#76D1F3]" />
                Email Address (Optional)
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleInputChange}
                onBlur={() => handleBlur('email')}
                placeholder="your.email@example.com"
                className={cn(
                  "border-2 h-12 rounded-xl transition-all duration-300 focus:shadow-[0_0_20px_rgba(118,209,243,0.2)]",
                  errors.email ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#76D1F3]"
                )}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-red-600 font-medium">{errors.email}</p>
              )}
            </div>
          </div>

          <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Delivery Method */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-5 w-5 text-[#1ABA7F]" />
              Delivery Method <span className="text-red-500">*</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="radiogroup">
              {DELIVERY_OPTIONS.map((option) => {
                const IconComponent = option.value === DELIVERY_METHODS.PICKUP ? Store : Truck;
                const isSelected = form.deliveryMethod === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => handleDeliveryMethodChange(option.value)}
                    className={cn(
                      "group p-3 sm:p-4 border-2 rounded-2xl text-left transition-all duration-300 relative overflow-hidden",
                      "focus:outline-none focus:ring-2 focus:ring-[#1ABA7F]/50 focus:ring-offset-2",
                      isSelected
                        ? "border-[#1ABA7F] bg-gradient-to-br from-[#1ABA7F]/10 to-[#1ABA7F]/5 shadow-lg scale-105"
                        : "border-gray-200 hover:border-[#1ABA7F]/50 hover:shadow-md hover:scale-102"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-[#1ABA7F] to-[#16a876] flex items-center justify-center shadow-md">
                        <Package className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                        isSelected 
                          ? "bg-gradient-to-br from-[#1ABA7F] to-[#16a876] shadow-lg" 
                          : "bg-gray-100 group-hover:bg-[#1ABA7F]/10"
                      )}>
                        <IconComponent className={cn("h-6 w-6", isSelected ? "text-white" : "text-[#1ABA7F]")} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address or Pickup Info */}
          {form.deliveryMethod === DELIVERY_METHODS.COURIER ? (
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#1ABA7F]" />
                Delivery Address <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                onBlur={() => handleBlur('address')}
                placeholder="Enter your complete delivery address"
                rows={3}
                maxLength={FORM_CONFIG.ADDRESS_MAX_LENGTH}
                className={cn(
                  "w-full border-2 rounded-xl px-4 py-3 transition-all duration-300 resize-none focus:shadow-[0_0_20px_rgba(26,186,127,0.2)]",
                  errors.address ? "border-red-500 focus:border-red-500" : "border-gray-200 focus:border-[#1ABA7F]"
                )}
                aria-required="true"
                required
              />
              {errors.address && (
                <p className="text-xs text-red-600 font-medium">{errors.address}</p>
              )}
              <p className="text-xs text-gray-500">
                {form.address.length}/{FORM_CONFIG.ADDRESS_MAX_LENGTH} characters
              </p>
            </div>
          ) : (
            uniquePharmacies.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200">
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-900 font-bold">Pickup Locations</p>
                </div>
                <ul className="space-y-2">
                  {uniquePharmacies.map((pharmacy, index) => (
                    <li key={`${pharmacy.name}-${index}`} className="flex items-start gap-3 p-3 bg-white rounded-xl shadow-sm">
                      <Store className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-bold text-blue-900">{pharmacy.name}</p>
                        <p className="text-blue-700">{pharmacy.address}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}

          <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Security Notice */}
          <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-sm text-green-900">
                <p className="font-bold mb-1">Secure Checkout</p>
                <p>Your payment information is encrypted and secure. We use industry-standard SSL encryption to protect your data.</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="group w-full h-14 px-6 text-base font-bold rounded-xl bg-gradient-to-r from-[#225F91] to-[#1a4a73] text-white hover:from-[#1a4a73] hover:to-[#225F91] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 relative overflow-hidden"
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Proceed to Payment
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </>
            )}
          </Button>

          {!isFormValid && (touched.name || touched.phone) && (
            <p className="text-sm text-red-600 font-medium text-center p-3 bg-red-50 rounded-xl border border-red-200">
              Please fill in all required fields correctly before proceeding.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default CheckoutForm;