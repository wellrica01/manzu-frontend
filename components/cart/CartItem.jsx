import { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Plus, Minus, Trash2, Clock, CheckCircle, AlertCircle, FileText, Package, AlertTriangle, Pill, Shield, Building, Info, ChevronDown, Box } from 'lucide-react';
import { cn } from '@/lib/utils';

const CartItem = ({ 
  item, 
  handleQuantityChange, 
  setRemoveItem, 
  isUpdating, 
  calculateItemPrice, 
  segment = 'ready',
  selectionMode = false,
  isSelected = false,
  onToggleSelect
}) => {
  const [showMeta, setShowMeta] = useState(false);
  const metaRef = useRef(null);
  const [metaHeight, setMetaHeight] = useState('0px');

  useLayoutEffect(() => {
    if (metaRef.current) {
      setMetaHeight(showMeta ? `${metaRef.current.scrollHeight}px` : '0px');
    }
  }, [showMeta, item]);

  const itemStatus = useMemo(() => {
    if (item.medication?.prescriptionRequired) {
      switch (item.prescriptionStatus) {
        case 'VERIFIED':
          return { 
            status: 'verified', 
            icon: CheckCircle, 
            color: 'text-green-700', 
            bgColor: 'bg-green-50', 
            borderColor: 'border-green-200', 
            text: 'Verified' 
          };
        case 'PENDING':
          return { 
            status: 'pending', 
            icon: Clock, 
            color: 'text-orange-600', 
            bgColor: 'bg-orange-50', 
            borderColor: 'border-orange-200', 
            text: 'Under Review' 
          };
        case 'REJECTED':
          return { 
            status: 'rejected', 
            icon: AlertTriangle, 
            color: 'text-red-600', 
            bgColor: 'bg-red-50', 
            borderColor: 'border-red-200', 
            text: 'Rejected' 
          };
        default:
          return { 
            status: 'needs_prescription', 
            icon: AlertCircle, 
            color: 'text-orange-600', 
            bgColor: 'bg-orange-50', 
            borderColor: 'border-orange-200', 
            text: 'Rx Required' 
          };
      }
    }
    return { 
      status: 'ready', 
      icon: Package, 
      color: 'text-[#225F91]', 
      bgColor: 'bg-[#225F91]/5', 
      borderColor: 'border-[#225F91]/20', 
      text: 'Ready' 
    };
  }, [item.medication?.prescriptionRequired, item.prescriptionStatus]);

  const StatusIcon = itemStatus.icon;

  const handleQuantityUpdate = (newQuantity) => {
    if (newQuantity < 1) return;
    handleQuantityChange(item.id, newQuantity, item.medication.displayName);
  };

  const handleRemove = () => {
    setRemoveItem({ id: item.id, name: item.medication.displayName, quantity: item.quantity });
  };

  return (
    <Card className={cn(
      "bg-white border-2 rounded-xl transition-all duration-200",
      itemStatus.borderColor,
      selectionMode && "cursor-pointer hover:shadow-md",
      isSelected && "ring-2 ring-[#1ABA7F] border-[#1ABA7F] shadow-md"
    )}
    onClick={selectionMode ? () => onToggleSelect(item.id) : undefined}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-3 left-3 z-20">
          <div className={cn(
            "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors duration-200",
            isSelected 
              ? "bg-[#1ABA7F] border-[#1ABA7F]" 
              : "bg-white border-gray-300 hover:border-[#1ABA7F]"
          )}>
            {isSelected && (
              <CheckCircle className="h-4 w-4 text-white" strokeWidth={2} />
            )}
          </div>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex gap-4">
          {/* Image */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-gray-200 overflow-hidden">
              {item.medication.imageUrl ? (
                <Dialog>
                  <DialogTrigger asChild>
                    <img 
                      src={item.medication.imageUrl} 
                      alt={item.medication.displayName} 
                      className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform duration-200" 
                      loading="lazy" 
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl p-0 rounded-2xl">
                    <VisuallyHidden>
                      <DialogTitle>{item.medication.displayName}</DialogTitle>
                    </VisuallyHidden>
                    <img src={item.medication.imageUrl} alt={item.medication.displayName} className="w-full h-auto" />
                  </DialogContent>
                </Dialog>
              ) : (
                <Pill className="h-8 w-8 text-gray-400" strokeWidth={2} />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#225F91] leading-tight mb-1 line-clamp-2">
              {item.medication.displayName}
            </h3>
            
            {item.medication.ingredients?.length > 0 && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {item.medication.ingredients.map(ing => 
                  `${ing.activeSubstance} ${ing.strengthValue}${ing.strengthUnit}`
                ).join(" + ")}
              </p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn(
                item.medication.prescriptionRequired 
                  ? "bg-purple-50 text-purple-700 border-purple-200" 
                  : "bg-[#225F91]/10 text-[#225F91] border-[#225F91]/20",
                "border text-xs font-bold px-2 py-1 rounded-lg"
              )}>
                {item.medication.prescriptionRequired ? (
                  <>
                    <FileText className="h-3 w-3 mr-1" strokeWidth={2} />
                    Rx
                  </>
                ) : (
                  <>
                    <Package className="h-3 w-3 mr-1" strokeWidth={2} />
                    OTC
                  </>
                )}
              </Badge>

              <Badge className={cn(
                "border text-xs font-bold px-2 py-1 rounded-lg",
                itemStatus.bgColor,
                itemStatus.color,
                itemStatus.borderColor
              )}>
                <StatusIcon className="h-3 w-3 mr-1" strokeWidth={2} />
                {itemStatus.text}
              </Badge>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="p-3 rounded-xl bg-[#1ABA7F]/5 border border-[#1ABA7F]/20">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-gray-600 font-medium uppercase">
                Total Price
              </span>
              {item.quantity > 1 && (
                <span className="text-sm text-[#1ABA7F] font-semibold">
                  {item.quantity} × ₦{item.price.toLocaleString()}
                </span>
              )}
            </div>
            <div className="text-xl font-black text-[#225F91]">
              ₦{calculateItemPrice(item).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <QuantityControl
            quantity={item.quantity}
            onUpdate={handleQuantityUpdate}
            isUpdating={isUpdating[item.id]}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isUpdating[item.id]}
            className="h-10 px-4 text-sm font-bold hover:bg-red-50 text-red-600 border-2 hover:border-red-200 rounded-lg"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>

        {/* Expandable Details */}
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMeta(!showMeta)}
            className="w-full justify-between text-[#225F91] hover:bg-[#225F91]/5 rounded-lg h-10"
          >
            <span className="flex items-center gap-2 text-sm font-bold">
              <Info className="h-4 w-4" strokeWidth={2} />
              Details
            </span>
            <ChevronDown 
              className={cn(
                "h-4 w-4 transition-transform duration-200", 
                showMeta && "rotate-180"
              )} 
              strokeWidth={2}
            />
          </Button>

          <div 
            ref={metaRef} 
            style={{ maxHeight: metaHeight }} 
            className="overflow-hidden transition-all duration-200"
          >
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-sm">
              {item.medication.manufacturerName && (
                <MetaRow 
                  icon={Building} 
                  label="Manufacturer" 
                  value={item.medication.manufacturerName} 
                />
              )}
              {item.medication.nafdacCode && (
                <MetaRow 
                  icon={Shield} 
                  label="NAFDAC" 
                  value={item.medication.nafdacCode} 
                />
              )}
              {item.medication.packSizeQuantity && (
                <MetaRow 
                  icon={Box} 
                  label="Pack Size" 
                  value={`${item.medication.packSizeExpression} ${item.medication.packSizeUnit}`} 
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const MetaRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon className="h-4 w-4 text-[#225F91] flex-shrink-0 mt-0.5" strokeWidth={2} />
    <div className="flex-1 min-w-0">
      <span className="text-gray-600 font-medium">{label}: </span>
      <span className="text-gray-900 font-bold break-words">{value}</span>
    </div>
  </div>
);

const QuantityControl = ({ quantity, onUpdate, isUpdating }) => (
  <div className="flex items-center gap-2">
    <span className="text-sm font-bold text-gray-700 mr-2">Qty:</span>
    <div className="flex items-center gap-1 bg-white rounded-lg border-2 border-gray-200">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onUpdate(quantity - 1)} 
        disabled={quantity <= 1 || isUpdating} 
        className="h-9 w-9 p-0 hover:bg-[#1ABA7F]/10 text-[#225F91] disabled:opacity-50 rounded-l-lg"
      >
        <Minus className="h-4 w-4" strokeWidth={2} />
      </Button>
      <span className="px-3 py-2 text-sm font-bold text-[#225F91] min-w-[2.5rem] text-center">
        {isUpdating ? (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#1ABA7F] border-t-transparent mx-auto" />
        ) : (
          quantity
        )}
      </span>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => onUpdate(quantity + 1)} 
        disabled={isUpdating} 
        className="h-9 w-9 p-0 hover:bg-[#1ABA7F]/10 text-[#225F91] rounded-r-lg"
      >
        <Plus className="h-4 w-4" strokeWidth={2} />
      </Button>
    </div>
  </div>
);

export default CartItem;