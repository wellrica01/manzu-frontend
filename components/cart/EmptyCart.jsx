import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  Search, 
  Heart, 
  Package, 
  ArrowRight,
  Sparkles,
  Truck,
  Shield,
  Clock,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const EmptyCart = () => {
  const features = [
    {
      icon: Search,
      title: 'Find Medications',
      description: 'Search through thousands of medications from verified pharmacies',
      color: 'text-[#225F91]',
      bgColor: 'bg-[#225F91]/10',
      borderColor: 'border-[#225F91]/20'
    },
    {
      icon: Package,
      title: 'Fast Delivery',
      description: 'Same-day delivery available in major cities across Nigeria',
      color: 'text-[#1ABA7F]',
      bgColor: 'bg-[#1ABA7F]/10',
      borderColor: 'border-[#1ABA7F]/20'
    },
    {
      icon: Shield,
      title: 'Secure & Verified',
      description: 'All pharmacies are verified and medications are authentic',
      color: 'text-[#225F91]',
      bgColor: 'bg-[#225F91]/10',
      borderColor: 'border-[#225F91]/20'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Get help anytime with our round-the-clock customer support',
      color: 'text-[#1ABA7F]',
      bgColor: 'bg-[#1ABA7F]/10',
      borderColor: 'border-[#1ABA7F]/20'
    }
  ];

  const popularCategories = [
    { name: 'Pain Relief', icon: '💊', count: '150+ items' },
    { name: 'Antibiotics', icon: '🩺', count: '80+ items' },
    { name: 'Vitamins', icon: '🥗', count: '200+ items' },
    { name: 'First Aid', icon: '🩹', count: '120+ items' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1ABA7F]/10 via-gray-50/50 to-white/80 py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-4xl">
        {/* Enhanced Empty State */}
        <div className="text-center mb-12">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-full flex items-center justify-center mx-auto shadow-xl">
              <ShoppingCart className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-[#1ABA7F] to-[#225F91] rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-bold text-[#225F91] mb-4 tracking-tight">
            Your Cart is Empty
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Start shopping for medications from verified pharmacies. Find what you need and add it to your cart.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="bg-gradient-to-r from-[#1ABA7F] to-[#1ABA7F]/90 hover:from-[#1ABA7F]/90 hover:to-[#1ABA7F] text-white shadow-lg hover:shadow-xl px-8 py-3 text-lg font-semibold">
                <Search className="h-5 w-5 mr-2" />
                Start Shopping
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            
            <Button variant="outline" className="border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10 px-8 py-3 text-lg font-semibold">
              <Heart className="h-5 w-5 mr-2" />
              View Wishlist
            </Button>
          </div>
        </div>

        {/* Enhanced Features Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#225F91] text-center mb-8">
            Why Choose Manzu?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const FeatureIcon = feature.icon;
              return (
                <Card key={index} className="bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "p-3 rounded-xl shadow-sm",
                        feature.bgColor
                      )}>
                        <FeatureIcon className={cn("h-6 w-6", feature.color)} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#225F91] text-lg mb-2">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Enhanced Popular Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-[#225F91] text-center mb-8">
            Popular Categories
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {popularCategories.map((category, index) => (
              <Link key={index} href={`/?category=${category.name.toLowerCase().replace(' ', '-')}`}>
                <Card className="bg-white/95 backdrop-blur-sm border border-[#1ABA7F]/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-3">{category.icon}</div>
                    <h3 className="font-semibold text-[#225F91] mb-1">
                      {category.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {category.count}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Enhanced Trust Indicators */}
        <div className="bg-gradient-to-r from-[#225F91]/5 to-[#1ABA7F]/5 rounded-2xl border border-[#1ABA7F]/20 p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#225F91] mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust Manzu for their medication needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#1ABA7F] mb-2">50,000+</div>
              <p className="text-gray-600">Happy Customers</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#225F91] mb-2">500+</div>
              <p className="text-gray-600">Verified Pharmacies</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#1ABA7F] mb-2">24/7</div>
              <p className="text-gray-600">Customer Support</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
            ))}
            <span className="text-sm text-gray-600 ml-2">4.8/5 from 10,000+ reviews</span>
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-[#1ABA7F]/10 to-[#225F91]/10 rounded-2xl border border-[#1ABA7F]/20 p-8">
            <h3 className="text-2xl font-bold text-[#225F91] mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Find the medications you need from our extensive catalog of verified products
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-[#1ABA7F] to-[#1ABA7F]/90 hover:from-[#1ABA7F]/90 hover:to-[#1ABA7F] text-white shadow-lg hover:shadow-xl px-8 py-3 text-lg font-semibold">
                <Search className="h-5 w-5 mr-2" />
                Browse Medications
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyCart;