import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShoppingCart, Search, TrendingUp, Heart, ArrowRight } from 'lucide-react';

const EmptyCart = () => {
  const popularCategories = [
    { name: 'Pain Relief', icon: '💊', color: 'bg-red-100 text-red-700' },
    { name: 'Vitamins', icon: '🩺', color: 'bg-blue-100 text-blue-700' },
    { name: 'First Aid', icon: '🏥', color: 'bg-green-100 text-green-700' },
    { name: 'Baby Care', icon: '👶', color: 'bg-pink-100 text-pink-700' },
  ];

  return (
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm text-center py-12 animate-in slide-in-from-top duration-700">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <div className="absolute top-4 right-4">
        <div className="w-2 h-2 bg-gradient-to-r from-[#1ABA7F] to-[#225F91] rounded-full animate-pulse" />
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-1/4 right-1/4 w-1 h-1 bg-[#1ABA7F]/30 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-[#225F91]/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      
      <CardHeader className="pb-6">
        <div className="mx-auto w-20 h-20 bg-[#1ABA7F]/10 rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="h-10 w-10 text-[#225F91]" />
        </div>
        <CardTitle className="text-3xl font-bold text-[#225F91] mb-2">
          Your Cart is Empty
        </CardTitle>
      <p className="text-gray-600 text-lg font-medium">
          Start building your order to get the medications you need
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            className="h-12 px-8 text-base font-semibold rounded-full bg-[#225F91] text-white hover:bg-[#1A4971] hover:shadow-[0_0_15px_rgba(34,95,145,0.3)] transition-all duration-300"
          >
            <Link href="/">
              <Search className="h-5 w-5 mr-2" />
              Start Shopping
            </Link>
          </Button>
          
          <Button
            variant="outline"
            asChild
            className="h-12 px-8 text-base font-semibold rounded-full border-[#1ABA7F] text-[#225F91] hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 transition-all duration-300"
          >
            <Link href="/prescription-upload">
              <TrendingUp className="h-5 w-5 mr-2" />
              Upload Prescription
            </Link>
          </Button>
        </div>

        {/* Popular Categories */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#225F91] flex items-center justify-center gap-2">
            <Heart className="h-5 w-5" />
            Popular Categories
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {popularCategories.map((category, index) => (
              <Button
                key={index}
                variant="outline"
                asChild
                className="h-16 flex-col gap-1 border-[#1ABA7F]/20 hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 transition-all duration-300"
              >
                <Link href={`/?category=${category.name.toLowerCase().replace(' ', '-')}`}>
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{category.name}</span>
        </Link>
              </Button>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <div className="text-center p-4 bg-[#1ABA7F]/5 rounded-xl">
            <div className="w-8 h-8 bg-[#1ABA7F] rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <h4 className="font-semibold text-[#225F91] mb-1">Verified Pharmacies</h4>
            <p className="text-xs text-gray-600">All pharmacies are verified and licensed</p>
          </div>
          
          <div className="text-center p-4 bg-[#225F91]/5 rounded-xl">
            <div className="w-8 h-8 bg-[#225F91] rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-sm font-bold">🚚</span>
            </div>
            <h4 className="font-semibold text-[#225F91] mb-1">Fast Delivery</h4>
            <p className="text-xs text-gray-600">Same-day delivery in major cities</p>
          </div>
          
          <div className="text-center p-4 bg-[#1ABA7F]/5 rounded-xl">
            <div className="w-8 h-8 bg-[#1ABA7F] rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-sm font-bold">💳</span>
            </div>
            <h4 className="font-semibold text-[#225F91] mb-1">Secure Payment</h4>
            <p className="text-xs text-gray-600">Multiple secure payment options</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="pt-4 border-t border-[#1ABA7F]/20">
          <p className="text-gray-600 mb-4">
            Need help finding medications? Our pharmacists are here to assist you.
          </p>
          <Button
            variant="outline"
            asChild
            className="h-10 px-6 text-sm font-medium rounded-full border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10 hover:border-[#1ABA7F]/50 transition-all duration-300"
          >
            <Link href="/contact">
              Contact Support
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyCart;