'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, AlertCircle, Info, CreditCard, Shield } from 'lucide-react';

const PendingMessage = ({ message, paymentStatus = 'idle' }) => {
  if (!message) return null;

  const getMessageType = () => {
    if (message.includes('Proceeding to payment')) return 'payment';
    if (message.includes('submitted for verification')) return 'verification';
    if (message.includes('awaiting verification')) return 'pending';
    return 'info';
  };

  const messageType = getMessageType();

  const getIcon = () => {
    switch (messageType) {
      case 'payment':
        return <CreditCard className="h-6 w-6 text-blue-600" />;
      case 'verification':
        return <Shield className="h-6 w-6 text-orange-600" />;
      case 'pending':
        return <Clock className="h-6 w-6 text-orange-600" />;
      default:
        return <Info className="h-6 w-6 text-blue-600" />;
    }
  };

  const getBadgeVariant = () => {
    switch (messageType) {
      case 'payment':
        return 'default';
      case 'verification':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getBadgeText = () => {
    switch (messageType) {
      case 'payment':
        return 'Payment';
      case 'verification':
        return 'Verification';
      case 'pending':
        return 'Pending';
      default:
        return 'Info';
    }
  };

  const getBackgroundColor = () => {
    switch (messageType) {
      case 'payment':
        return 'bg-blue-50 border-blue-200';
      case 'verification':
        return 'bg-orange-50 border-orange-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (messageType) {
      case 'payment':
        return 'text-blue-800';
      case 'verification':
        return 'text-orange-800';
      case 'pending':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  const getTitle = () => {
    switch (messageType) {
      case 'payment':
        return 'Processing Payment';
      case 'verification':
        return 'Prescription Submitted';
      case 'pending':
        return 'Order Status';
      default:
        return 'Order Update';
    }
  };

  const getSimpleMessage = () => {
    switch (messageType) {
      case 'payment':
        return 'Redirecting to secure payment...';
      case 'verification':
        return 'Your prescription has been submitted. You will receive an email when ready to pay.';
      case 'pending':
        return 'Some items need prescription verification. You will be notified when ready.';
      default:
        return message;
    }
  };

  return (
    <Card className={`${getBackgroundColor()} rounded-xl border shadow-sm mb-6 animate-in slide-in-from-top duration-500`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <CardTitle className={`text-lg font-semibold ${getTextColor()}`}>
                {getTitle()}
              </CardTitle>
              <Badge variant={getBadgeVariant()} className="mt-1">
                {getBadgeText()}
              </Badge>
            </div>
          </div>
          {messageType === 'payment' && (
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className={`text-sm ${getTextColor()} mb-4`}>
          {getSimpleMessage()}
        </p>
        
        {messageType === 'payment' && (
          <div className="p-3 bg-white/80 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">What's happening:</p>
                <ul className="space-y-1">
                  <li>• Opening secure payment page</li>
                  <li>• Complete your payment</li>
                  <li>• You'll be redirected back</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {messageType === 'verification' && (
          <div className="p-3 bg-white/80 rounded-lg border border-orange-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-orange-700">
                <p className="font-medium mb-1">Next steps:</p>
                <ul className="space-y-1">
                  <li>• We'll review your prescription</li>
                  <li>• You'll get email when ready</li>
                  <li>• Complete payment then</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {messageType === 'pending' && (
          <div className="p-3 bg-white/80 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-700">
                <p className="font-medium mb-1">Timeline:</p>
                <ul className="space-y-1">
                  <li>• Review: 24-48 hours</li>
                  <li>• Email notification</li>
                  <li>• Pay when approved</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingMessage;