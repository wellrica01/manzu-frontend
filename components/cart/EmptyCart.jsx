import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ShoppingCart, 
  Search, 
  Package, 
  Truck, 
  Shield, 
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function EmptyCart() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#1ABA7F]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#225F91]/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <div className="relative z-10 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center">
            {/* Premium Empty State Icon with Animation */}
            <div className="relative mx-auto w-24 h-24 mb-8">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1ABA7F]/30 to-[#225F91]/30 rounded-3xl blur-xl animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white/50 backdrop-blur-sm">
                <ShoppingCart className="h-16 w-16 text-[#225F91]" />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>

            {/* Enhanced Typography */}
            <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#225F91] to-[#1ABA7F] mb-4 tracking-tight">
              Your Cart Awaits
            </h2>
            <p className="text-base sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Begin your wellness journey today. Discover premium medications and health products from 
              <span className="font-semibold text-[#1ABA7F]"> Nigeria's most trusted pharmacies</span>.
            </p>

            {/* Premium CTA with Advanced Styling */}
            <div className="mb-12">
              <Link href="/">
                <Button className="relative h-14 px-8 bg-gradient-to-r from-[#1ABA7F] via-[#1ABA7F] to-[#225F91] hover:from-[#225F91] hover:to-[#1ABA7F] text-white text-lg font-bold rounded-2xl shadow-2xl hover:shadow-[#1ABA7F]/50 transition-all duration-500 transform hover:scale-105 group overflow-hidden">
                  <span className="relative z-10 flex items-center gap-3">
                    <Search className="h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
                    Start Shopping Now
                    <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Button>
              </Link>
            </div>

            {/* Premium Feature Cards with Enhanced Design */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Feature 1 */}
              <Card className="relative overflow-hidden bg-white/90 backdrop-blur-md border-2 border-[#1ABA7F]/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#1ABA7F]/20 to-transparent rounded-bl-full" />
                <CardContent className="relative p-8 text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute inset-0 bg-[#1ABA7F]/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-[#1ABA7F]/30 to-[#1ABA7F]/10 rounded-2xl flex items-center justify-center mx-auto border-2 border-[#1ABA7F]/30 group-hover:scale-110 transition-transform duration-300">
                      <Package className="h-8 w-8 text-[#1ABA7F]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#225F91] mb-3">Vast Selection</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Access thousands of authentic medications and wellness products from verified pharmacies nationwide
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="relative overflow-hidden bg-white/90 backdrop-blur-md border-2 border-[#225F91]/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#225F91]/20 to-transparent rounded-bl-full" />
                <CardContent className="relative p-8 text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute inset-0 bg-[#225F91]/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-[#225F91]/30 to-[#225F91]/10 rounded-2xl flex items-center justify-center mx-auto border-2 border-[#225F91]/30 group-hover:scale-110 transition-transform duration-300">
                      <Truck className="h-8 w-8 text-[#225F91]" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#225F91] mb-3">Swift Delivery</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Experience same-day delivery in major cities with real-time tracking across Nigeria
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="relative overflow-hidden bg-white/90 backdrop-blur-md border-2 border-yellow-400/30 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-yellow-400/20 to-transparent rounded-bl-full" />
                <CardContent className="relative p-8 text-center">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-300" />
                    <div className="relative w-16 h-16 bg-gradient-to-br from-yellow-400/30 to-yellow-400/10 rounded-2xl flex items-center justify-center mx-auto border-2 border-yellow-400/30 group-hover:scale-110 transition-transform duration-300">
                      <Star className="h-8 w-8 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-black text-[#225F91] mb-3">Verified Excellence</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Shop confidently from NAFDAC-certified and rigorously vetted pharmacy partners
                  </p>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}