import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, FileText, Home } from 'lucide-react';

export default function StatusUnderReview({ prescription, onReset, onBackToHome }) {
  return (
    <Card className="relative bg-white/95 backdrop-blur-sm border-2 border-[#1ABA7F]/30 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-bl-full" />
      
      <CardHeader className="relative z-10 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 p-8 text-center">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/30 to-yellow-500/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-orange-500 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
            <Clock className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>

        <CardTitle className="space-y-2">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-600">
            Under Review
          </h2>
          <p className="text-lg text-gray-600 font-semibold">Almost there! We're verifying your prescription now</p>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">
        <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200/50">
          <div className="flex items-start gap-3">
            <FileText className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 text-lg">What's happening?</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Our pharmacy team is reviewing your prescription to make sure 
                everything is accurate and safe. This usually takes just a few minutes, 
                and you'll be notified as soon as it's complete.
              </p>
            </div>
          </div>
        </div>

        {prescription?.id && (
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Prescription ID</p>
              <p className="text-sm font-bold text-gray-900">{prescription.id}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Status</p>
              <p className="text-sm font-bold text-orange-600">{prescription.status.replace('_', ' ')}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onReset}
            variant="outline"
            className="flex-1 h-12 p-3 border-2 border-[#225F91] text-[#225F91] hover:bg-[#225F91]/10 font-bold rounded-lg transition-all duration-300"
          >
            Check Another
          </Button>
          <Button
            onClick={onBackToHome}
            variant="outline"
            className="flex-1 h-12 p-3 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-lg transition-all duration-300"
          >
            <Home className="h-5 w-5 mr-2" />
            Back to Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}