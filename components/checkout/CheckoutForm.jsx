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
  resumeOrderId,
  fileInputRef,
  cart,
  getUniquePharmacyAddresses,
  loading,
}) => {
  return (
    <Card
      className="shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
      <CardHeader className="bg-primary/10 p-6 sm:p-8">
        <CardTitle className="text-xl sm:text-2xl font-extrabold text-primary">
          User Information
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        <form onSubmit={handleCheckout} className="space-y-6 flex flex-col" role="form" aria-labelledby="checkout-form-title">
          <div>
            <Label htmlFor="name" className="text-sm font-semibold text-primary uppercase tracking-wider">
              Full Name
            </Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleInputChange}
              className="mt-2 h-10 sm:h-12 text-base sm:text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
              required
              aria-required="true"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-primary uppercase tracking-wider">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleInputChange}
              className="mt-2 h-10 sm:h-12 text-base sm:text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
              required
              aria-required="true"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm font-semibold text-primary uppercase tracking-wider">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleInputChange}
              className="mt-2 h-10 sm:h-12 text-base sm:text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
              required
              aria-required="true"
            />
          </div>
          {requiresUpload && !resumeOrderId && (
            <PrescriptionUpload
              handleFileChange={handleFileChange}
              fileInputRef={fileInputRef}
              prescriptionFile={form.prescriptionFile}
            />
          )}
          <div>
            <Label className="text-sm font-semibold text-primary uppercase tracking-wider">
              Delivery Method
            </Label>
            <RadioGroup
              value={form.deliveryMethod}
              onValueChange={handleDeliveryMethodChange}
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 mt-3"
              aria-label="Delivery method"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="pickup" id="pickup" className="h-5 w-5" />
                <Label htmlFor="pickup" className="text-gray-900 text-base font-medium">Pickup</Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="delivery" id="delivery" className="h-5 w-5" />
                <Label htmlFor="delivery" className="text-gray-900 text-base font-medium">Delivery</Label>
              </div>
            </RadioGroup>
          </div>
          {form.deliveryMethod === 'delivery' && (
            <div>
              <Label htmlFor="address" className="text-sm font-semibold text-primary uppercase tracking-wider">
                Delivery Address
              </Label>
              <Input
                id="address"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                className="mt-2 h-10 sm:h-12 text-base sm:text-lg font-medium rounded-2xl border-gray-200/50 bg-white/95 text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:border-primary/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                required
                aria-required="true"
              />
            </div>
          )}
          {form.deliveryMethod === 'pickup' && cart.pharmacies.length > 0 && (
            <div>
              <Label className="text-sm font-semibold text-primary uppercase tracking-wider">
                Pickup Addresses
              </Label>
              <div className="mt-3 space-y-3">
                {getUniquePharmacyAddresses().length > 0 ? (
                  getUniquePharmacyAddresses().map((pharmacy, index) => (
                    <p key={index} className="text-gray-600 text-sm sm:text-base font-medium truncate max-w-[250px] sm:max-w-full">
                      <span className="font-semibold text-gray-900">{pharmacy.name}</span>: {pharmacy.address}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm sm:text-base font-medium">Pharmacy address not available</p>
                )}
              </div>
            </div>
          )}
          <Button
            type="submit"
            className="w-full h-12 sm:h-14 px-8 text-base sm:text-lg font-semibold rounded-2xl bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-pulse disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none transition-all duration-300"
            disabled={loading}
            aria-label="Submit checkout"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </span>
            ) : requiresUpload ? (
              'Submit Prescription and Pay OTC'
            ) : (
              'Pay with Paystack'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CheckoutForm;