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
  ArrowRight
} from 'lucide-react';

export default function EmptyCart() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1ABA7F]/5 via-white to-[#225F91]/5 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Enhanced Empty State Icon */}
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-[#1ABA7F]/20 to-[#225F91]/20 rounded-3xl flex items-center justify-center shadow-lg mb-8">
            <ShoppingCart className="h-12 w-12 text-[#225F91]" />
          </div>

          <h1 className="text-3xl font-bold text-[#225F91] mb-4">
            Your cart is empty
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            Start shopping for medications and health products. Find what you need from our verified pharmacies across Nigeria.
          </p>

          {/* Enhanced Primary CTA with Better Visual Hierarchy */}
          <div className="mb-8">
            <Link href="/">
              <Button className="bg-gradient-to-r from-[#1ABA7F] to-[#225F91] hover:from-[#1ABA7F]/90 hover:to-[#225F91]/90 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                <Search className="h-5 w-5 mr-2" />
                Start Shopping
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Enhanced Feature Highlights with Better Visual Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-[#1ABA7F]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Package className="h-6 w-6 text-[#1ABA7F]" />
                </div>
                <h3 className="font-semibold text-[#225F91] mb-2">Wide Selection</h3>
                <p className="text-sm text-gray-600">Thousands of medications and health products from verified pharmacies</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-[#225F91]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-6 w-6 text-[#225F91]" />
                </div>
                <h3 className="font-semibold text-[#225F91] mb-2">Fast Delivery</h3>
                <p className="text-sm text-gray-600">Same-day delivery in major cities across Nigeria</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-105">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-[#225F91] mb-2">Trusted Pharmacies</h3>
                <p className="text-sm text-gray-600">Verified and licensed pharmacies</p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Trust Indicators with Better Visual Design */}
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#1ABA7F]" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#225F91]" />
              <span>Free Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}