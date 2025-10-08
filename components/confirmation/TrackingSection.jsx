import { QRCode } from 'react-qrcode-logo';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin } from 'lucide-react';

export default function TrackingSection({ trackingCode, isDelivery, deliveryAddress }) {
  return (
    <Card className="bg-white/95 backdrop-blur-sm border-2 border-gray-200/50 rounded-2xl shadow-lg">
      <CardContent className="p-4 sm:p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200/50">
              <h3 className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wide">Tracking Code</h3>
              <p className="text-lg sm:text-2xl font-black text-[#225F91] font-mono">{trackingCode}</p>
            </div>

            {isDelivery && (
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Estimated Delivery</h3>
                </div>
                <p className="text-lg font-black text-green-800">2-3 Hours</p>
              </div>
            )}

            {deliveryAddress && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200/50">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Delivery Address</h3>
                </div>
                <p className="text-sm font-semibold text-gray-700">{deliveryAddress}</p>
              </div>
            )}
          </div>

          {trackingCode && typeof window !== 'undefined' && (
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200/50 shadow-inner">
              <h3 className="text-sm font-bold text-gray-600 mb-4 uppercase tracking-wide">Scan to Track</h3>
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <QRCode
                  value={`${window.location.protocol}//${window.location.host}/track-order?trackingCode=${encodeURIComponent(trackingCode)}`}
                  size={180}
                  fgColor="#225F91"
                  bgColor="#ffffff"
                  qrStyle="squares"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}