import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

const StatusNoMedications = ({ prescription, onReset, onBackToHome }) => {
  return (
    <Card className="relative bg-white border-2 border-gray-100 rounded-lg shadow-lg overflow-hidden">
      <CardHeader className="relative bg-gradient-to-br from-yellow-50 to-orange-50 p-8 text-center border-b border-yellow-100">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-xl opacity-40 animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <AlertCircle className="h-10 w-10 text-white" strokeWidth={2} />
          </div>
        </div>

        <CardTitle className="space-y-3">
          <h2 className="text-3xl font-black text-gray-900">
            Action Required
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            No medications available
          </p>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="p-5 bg-gradient-to-br from-yellow-50 to-white rounded-lg border border-yellow-200">
          <p className="text-sm text-gray-700 leading-relaxed">
            We couldn't find any medications associated with this prescription. This could mean your 
            prescription is still being processed or there may be an issue that needs attention.
          </p>
        </div>

        <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
          <h3 className="font-bold text-gray-900 mb-3">What should I do?</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
              <span>Contact our support team for assistance</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
              <span>Or start a new order if needed</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={() => console.log('Contact support')}
            className="flex-1 h-12 bg-gradient-to-r from-[#1ABA7F] to-[#16a876] hover:from-[#16a876] hover:to-[#1ABA7F] text-white font-bold rounded-lg"
          >
            Contact Support
          </Button>
          <Button
            onClick={onReset}
            variant="outline"
            className="flex-1 h-12 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg"
          >
            Check Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default  StatusNoMedications;