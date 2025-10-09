'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Home, Loader2, Clock } from 'lucide-react';

const TrackOrderForm = ({ 
  trackingCode, 
  onTrackingCodeChange, 
  onSubmit, 
  onBackToHome, 
  isLoading 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Card className="relative bg-white border-2 border-gray-100 rounded-3xl shadow-lg overflow-hidden">
      {/* Subtle decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1ABA7F]/5 to-transparent" />
      
      <CardHeader className="relative z-10 px-6 py-8 border-b border-gray-100">
        <div className="flex items-center gap-3 justify-center mb-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#1ABA7F] to-[#16a876] shadow-md">
            <Search className="h-6 w-6 text-white" strokeWidth={2} />
          </div>
          <CardTitle className="text-3xl font-bold text-[#225F91]">
            Track Your Order
          </CardTitle>
        </div>
        <p className="text-center text-gray-600 leading-relaxed">
          Enter your tracking code to see real-time order status
        </p>
      </CardHeader>

      <CardContent className="relative z-10 p-6 sm:p-8 space-y-6">
        <div className="space-y-6">
          <div className="space-y-3">
            <Label 
              htmlFor="trackingCode" 
              className="text-sm font-bold text-gray-900 uppercase tracking-wider"
            >
              Tracking Code
            </Label>
            
            <div className="relative">
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-[#1ABA7F] to-[#16a876] opacity-0 blur-lg transition-opacity duration-300 ${
                isFocused ? 'opacity-20' : ''
              }`} />
              
              <Input
                id="trackingCode"
                value={trackingCode}
                onChange={(e) => onTrackingCodeChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="relative h-14 text-base font-medium rounded-xl border-2 border-gray-200 focus:border-[#1ABA7F] focus:ring-4 focus:ring-[#1ABA7F]/10 transition-all duration-300 px-4"
                placeholder="e.g., TRK-00A7-LMK6X1-J8Q"
                required
              />
            </div>
            
            <p className="text-sm text-gray-500 flex items-start gap-2">
              <Clock className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
              <span>Your tracking code was sent to your email or phone after checkout</span>
            </p>
          </div>

          <Button
            onClick={() => onSubmit(trackingCode)}
            disabled={isLoading || !trackingCode}
            className="w-full h-14 bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2.5} />
                Tracking Order...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Search className="h-5 w-5" strokeWidth={2.5} />
                Track Order
              </span>
            )}
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-500 font-medium">or</span>
          </div>
        </div>

        <Button
          onClick={onBackToHome}
          variant="outline"
          className="w-full h-12 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-semibold rounded-xl transition-all duration-200"
        >
          <Home className="h-5 w-5 mr-2" strokeWidth={2} />
          Back to Home
        </Button>
      </CardContent>
    </Card>
  );
}

export default TrackOrderForm;