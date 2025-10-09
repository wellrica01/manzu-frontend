import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home } from 'lucide-react';

export default function StatusError({ error, onReset, onBackToHome }) {
  return (
    <Card className="relative bg-white border-2 border-gray-100 rounded-3xl shadow-lg overflow-hidden">
      <CardHeader className="relative bg-gradient-to-br from-red-50 to-red-50 p-8 text-center border-b border-yellow-100">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/30 to-pink-500/30 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
            <AlertCircle className="h-10 w-10 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <CardTitle className="space-y-2">
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">
            Not Found
          </h2>
          <p className="text-lg text-gray-600 font-semibold">We couldn't find your prescription</p>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-8 space-y-6">
        <div className="p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl border-2 border-red-200/50">
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            {error}
          </p>
          <p className="text-xs text-gray-600">
            Please verify your contact information and try again, or contact support if the issue persists.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onReset}
            className="flex-1 h-12 bg-gradient-to-r from-[#225F91] to-[#1a4a73] hover:from-[#1a4a73] hover:to-[#225F91] text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Try Again
          </Button>
          <Button
            onClick={onBackToHome}
            variant="outline"
            className="flex-1 h-12 border-2 border-[#1ABA7F] text-[#1ABA7F] hover:bg-[#1ABA7F]/10 font-bold rounded-lg transition-all duration-300"
          >
            <Home className="mr-2 h-5 w-5" />
            Back to Home
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}