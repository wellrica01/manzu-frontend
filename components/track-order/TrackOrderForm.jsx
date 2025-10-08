import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, Home, Loader2 } from 'lucide-react';

export default function TrackOrderForm({ 
  trackingCode, 
  onTrackingCodeChange, 
  onSubmit, 
  onBackToHome, 
  isLoading 
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(trackingCode);
  };

  return (
    <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top duration-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#1ABA7F]/20 to-transparent rounded-bl-full" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[#225F91]/20 to-transparent rounded-tr-full" />

      <CardHeader className="relative z-10 bg-gradient-to-r from-[#225F91]/10 to-[#1ABA7F]/10 px-3 py-4 sm:p-8">
        <div className="flex items-center gap-3 justify-center mb-2">
          <div className="p-3 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-xl">
            <Search className="h-6 w-6 text-[#225F91]" />
          </div>
          <CardTitle className="text-2xl font-black text-[#225F91]">
            Order Tracking
          </CardTitle>
        </div>
        <p className="text-center text-gray-600 text-sm">
          Track your medication delivery in real-time
        </p>
      </CardHeader>

      <CardContent className="relative z-10 p-6 sm:p-8 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="trackingCode" className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Tracking Code
            </Label>
            <Input
              id="trackingCode"
              value={trackingCode}
              onChange={(e) => onTrackingCodeChange(e.target.value)}
              className="h-12 text-base font-medium rounded-lg border-2 border-gray-300 focus:border-[#1ABA7F] focus:ring-4 focus:ring-[#1ABA7F]/20 transition-all duration-300"
              placeholder="e.g., TRK-00A7-LMK6X1-J8Q"
              required
            />
            <p className="text-xs text-gray-500">
              Your tracking code was sent to your email after checkout
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden disabled:opacity-70"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Tracking...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  Track Order
                </>
              )}
            </span>
            {!isLoading && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            )}
          </Button>
        </form>

        <Button
          onClick={onBackToHome}
          variant="outline"
          className="w-full h-12 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-lg transition-all duration-300"
        >
          <Home className="h-5 w-5 mr-2" />
          Back to Home
        </Button>
      </CardContent>
    </Card>
  );
}