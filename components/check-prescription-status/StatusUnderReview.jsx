import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, FileText, Home } from 'lucide-react';

const StatusUnderReview = ({ prescription, onReset, onBackToHome }) => {
  return (
    <Card className="relative bg-white border-2 border-gray-100 rounded-lg shadow-lg overflow-hidden">
      <CardHeader className="relative bg-gradient-to-br from-orange-50 to-yellow-50 p-8 text-center border-b border-orange-100">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full blur-xl opacity-40 animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
            <Clock className="h-10 w-10 text-white" strokeWidth={2} />
          </div>
        </div>

        <CardTitle className="space-y-3">
          <h2 className="text-3xl font-black text-gray-900">
            Under Review
          </h2>
          <p className="text-lg text-gray-600 font-medium">
            We're verifying your prescription now
          </p>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <FileText className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" strokeWidth={2} />
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900">What's happening?</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Our pharmacy team is reviewing your prescription to ensure everything is accurate and safe. 
                This usually takes just a few minutes, and you'll be notified as soon as it's complete.
              </p>
            </div>
          </div>
        </div>

        {prescription?.id && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Prescription ID
              </p>
              <p className="text-sm font-bold text-gray-900">{prescription.id}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Status
              </p>
              <p className="text-sm font-bold text-orange-600">
                {prescription.status?.replace('_', ' ')}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={onReset}
            variant="outline"
            className="flex-1 h-12 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200"
          >
            Check Another
          </Button>
          <Button
            onClick={onBackToHome}
            variant="outline"
            className="flex-1 h-12 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold rounded-lg transition-all duration-200"
          >
            <Home className="h-5 w-5 mr-2" strokeWidth={2} />
            Back to Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default  StatusUnderReview;