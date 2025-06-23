import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import LabCards from './LabCards';
import LabTable from './LabTable';

const TestCard = ({ test, handleAddToBooking, isInBooking, isAddingToBooking }) => {
  return (
    <Card className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30">
      <div className="absolute top-0 left-0 w-16 h-16 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-[#1ABA7F]/5 to-transparent">
        <div className="flex-1">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight leading-tight">
            {test.displayName}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            {test.orderRequired && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-[#225F91] bg-[#225F91]/10 rounded-full animate-pulse">
                Order Required
              </span>
            )}
            <span className="text-sm text-gray-500">
              {test.testType || 'Type N/A'}
            </span>
          </div>
          <div className="mt-2">
            <p className="text-gray-600 text-base">
              <strong className="font-semibold text-gray-800">Test Code:</strong> {test.testCode || 'N/A'}
            </p>
          </div>
        </div>
        {test.imageUrl && (
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
            <img
              src={test.imageUrl}
              alt={test.displayName}
              className="w-full h-full object-cover rounded-2xl border border-[#1ABA7F]/20 shadow-md transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-[#225F91] mb-4">Compare Labs</h3>
        <LabCards
          availability={test.availability}
          testId={test.id}
          handleAddToBooking={handleAddToBooking}
          isInBooking={isInBooking}
          displayName={test.displayName}
          isAddingToBooking={isAddingToBooking}
        />
        <LabTable
          availability={test.availability}
          testId={test.id}
          handleAddToBooking={handleAddToBooking}
          isInBooking={isInBooking}
          displayName={test.displayName}
          isAddingToBooking={isAddingToBooking}
        />
      </CardContent>
    </Card>
  );
};

export default TestCard;