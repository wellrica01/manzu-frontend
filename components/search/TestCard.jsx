import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import LabCards from './LabCards';
import LabTable from './LabTable';

const TestCard = ({ test, handleAddToBooking, isInBooking, isAddingToBooking }) => {
  return (
    <Card
      className="relative shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
      <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex-1">
          <CardTitle className="text-3xl font-extrabold text-primary tracking-tight leading-tight">
            {test.displayName}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            {test.orderRequired && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full animate-pulse">
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
              className="w-full h-full object-cover rounded-2xl border border-gray-200/50 shadow-md transition-transform duration-300 hover:scale-110"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-primary mb-4">Compare Labs</h3>
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