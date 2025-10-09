import { QRCode } from 'react-qrcode-logo';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin } from 'lucide-react';

export default function TrackingSection({ trackingCode, isDelivery, deliveryAddress }) {
  return (
    <Card className="bg-white border-2 border-gray-100 rounded-3xl shadow-lg">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-200">
                  <h3 className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">
                    Tracking Code
                    </h3>
                    <p className="text-2xl font-black text-[#225F91] font-mono break-all">
                      {trackingCode}
                    </p>
            </div>

            {isDelivery && (
              <div className="p-5 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-green-600" strokeWidth={2} />
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Estimated Delivery
                    </h3>
                </div>
                <p className="text-lg font-black text-green-900">2-3 Hours</p>
              </div>
            )}

            {deliveryAddress && (
              <div className="p-5 bg-gradient-to-br from-purple-50 to-white rounded-2xl border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Delivery Address
                    </h3>
                </div>
                <p className="text-sm font-semibold text-gray-700 leading-relaxed">
                  {deliveryAddress}
                  </p>
              </div>
            )}
          </div>

          {trackingCode && typeof window !== 'undefined' && (
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200">
            <h3 className="text-xs font-bold text-gray-600 mb-4 uppercase tracking-wider">
                Scan to Track
                </h3>
              <div className="p-4 bg-white rounded-xl shadow-lg">
                <QRCode
                  value={`${window.location.protocol}//${window.location.host}/track-order?trackingCode=${encodeURIComponent(trackingCode)}`}
                  size={180}
                  fgColor="#225F91"
                  bgColor="#ffffff"
                  qrStyle="squares"
                />
              </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              Scan with your phone to track order
            </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}