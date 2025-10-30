import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  ShieldCheck, 
} from 'lucide-react';


const SuccessHeader = ({ firstName }) => {
  return (
    <Card className="relative bg-white border-2 border-gray-100 rounded-lg shadow-lg overflow-hidden">
      <CardHeader className="relative bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center border-b border-green-100">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <CardTitle className="space-y-3">
            <h1 className="text-4xl font-black text-gray-900">
              {firstName ? `Thank You, ${firstName}!` : 'Order Confirmed!'}
            </h1>
            <p className="text-lg text-gray-600 font-medium">
              Your order has been successfully placed
            </p>
          </CardTitle>

          <div className="flex items-center gap-2 mt-6 px-5 py-2.5 bg-white rounded-xl border border-green-200 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-green-600" strokeWidth={2} />
            <span className="text-sm font-bold text-green-900">Payment Verified</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

export default SuccessHeader;
