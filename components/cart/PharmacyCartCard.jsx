import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import CartItem from './CartItem';
import { MapPin, Phone, Clock, Star, Truck, CheckCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const PharmacyCartCard = ({
  pharmacy,
  handleQuantityChange,
  setRemoveItem,
  isUpdating,
  calculateItemPrice,
  segment = 'ready'
}) => {
  const totalItems = pharmacy.items.reduce((sum, item) => sum + item.quantity, 0);
  const isVerified = pharmacy.pharmacy.status === 'verified';

  // Segment-specific styling
  const getSegmentStyles = () => {
    switch (segment) {
      case 'prescription':
        return {
          card: 'border-orange-200 bg-orange-50/80',
          header: 'from-orange-100/50',
          accent: 'bg-orange-200',
          text: 'text-orange-800',
          badge: 'bg-orange-100 text-orange-800 border-orange-200'
        };
      case 'ready':
      default:
        return {
          card: 'border-[#1ABA7F]/20 bg-white/95',
          header: 'from-[#1ABA7F]/10',
          accent: 'bg-[#1ABA7F]/20',
          text: 'text-[#225F91]',
          badge: 'bg-[#225F91]/10 text-[#225F91] border-[#225F91]/20'
        };
    }
  };

  const styles = getSegmentStyles();

  return (
    <Card className={cn(
      "relative rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl",
      styles.card,
      segment === 'prescription' ? 'hover:ring-orange-300' : 'hover:ring-[#1ABA7F]/30'
    )}>
      {/* Decorative accent */}
      <div className={cn("absolute top-0 left-0 w-12 h-12 rounded-br-2xl", styles.accent)} />
      
      <CardHeader className={cn("bg-gradient-to-r p-4", styles.header)}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className={cn("text-lg font-semibold truncate", styles.text)}>
                {pharmacy.pharmacy.name}
              </CardTitle>
              <div className="flex items-center gap-1">
                {isVerified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs">
                    ✓ Verified
                  </Badge>
                )}
                <Badge variant="secondary" className={cn("text-xs", styles.badge)}>
                  {segment === 'prescription' ? (
                    <>
                      <FileText className="h-3 w-3 mr-1" />
                      Rx Required
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Ready
                    </>
                  )}
                </Badge>
              </div>
            </div>
            
            {/* Pharmacy Details - Simplified */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-[#1ABA7F]" />
                <span className="truncate">{pharmacy.pharmacy.address}</span>
              </div>
              
              {pharmacy.pharmacy.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-[#1ABA7F]" />
                  <span>{pharmacy.pharmacy.phone}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Pharmacy Stats */}
          <div className="text-right ml-4">
            <div className="flex items-center gap-1 justify-end mb-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs font-medium text-gray-700">4.8</span>
            </div>
            <Badge variant="secondary" className={cn("text-xs", styles.badge)}>
              {totalItems} items
            </Badge>
          </div>
        </div>
        
        {/* Delivery Info - Simplified */}
        <div className="mt-3 p-2 bg-[#1ABA7F]/5 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-[#225F91]">
            <Truck className="h-3 w-3" />
            <span className="font-medium">Same-day delivery available</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-3">
        {/* Items List */}
        <div className="space-y-3">
          {pharmacy.items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              handleQuantityChange={handleQuantityChange}
              setRemoveItem={setRemoveItem}
              isUpdating={isUpdating}
              calculateItemPrice={calculateItemPrice}
              segment={segment}
            />
          ))}
        </div>
        
        {/* Pharmacy Subtotal */}
        <div className="border-t border-[#1ABA7F]/10 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#225F91]">
                Subtotal for {pharmacy.pharmacy.name}
              </p>
              <p className="text-xs text-gray-500">
                {totalItems} item{totalItems !== 1 ? 's' : ''} • Free delivery
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#225F91]">
                ₦{(pharmacy.subtotal || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Pharmacy Actions - Simplified */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
            onClick={() => window.open(`tel:${pharmacy.pharmacy.phone}`, '_self')}
            disabled={!pharmacy.pharmacy.phone}
          >
            <Phone className="h-3 w-3 mr-1" />
            Contact
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
            onClick={() => {
              const url = `https://maps.google.com/?q=${pharmacy.pharmacy.address}`;
              window.open(url, '_blank');
            }}
          >
            <MapPin className="h-3 w-3 mr-1" />
            Directions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PharmacyCartCard;