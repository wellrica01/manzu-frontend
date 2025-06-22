import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import PharmacyTable from './PharmacyTable';
import PharmacyCards from './PharmacyCards';

const MedicationCard = ({ med, handleAddToCart, isInCart, isAddingToCart }) => {
  return (
    <Card
      className="relative shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)]"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
      <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex-1">
          <CardTitle className="text-3xl font-extrabold text-primary tracking-tight leading-tight">
            {med.displayName}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            {med.prescriptionRequired && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full animate-pulse">
                Prescription Needed
              </span>
            )}
            <span className="text-sm text-gray-500">
              {med.genericName || 'Generic N/A'}
            </span>
          </div>
          <div className="mt-2">
            <p className="text-gray-600 text-base">
              <strong className="font-semibold text-gray-800">NAFDAC Code:</strong> {med.nafdacCode || 'N/A'}
            </p>
          </div>
        </div>
        {med.imageUrl && (
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
            <img
              src={med.imageUrl}
              alt={med.displayName}
              className="w-full h-full object-cover rounded-2xl border border-gray-200/50 shadow-md transition-transform duration-300 hover:scale-110"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-primary mb-4">Compare Pharmacies</h3>
        {/* Mobile Pharmacy Cards */}
        <PharmacyCards
          availability={med.availability}
          medId={med.id}
          handleAddToCart={handleAddToCart}
          isInCart={isInCart}
          displayName={med.displayName}
          isAddingToCart={isAddingToCart}
        />
        {/* Desktop Pharmacy Table */}
        <PharmacyTable
          availability={med.availability}
          medId={med.id}
          handleAddToCart={handleAddToCart}
          isInCart={isInCart}
          displayName={med.displayName}
          isAddingToCart={isAddingToCart}
        />
      </CardContent>
    </Card>
  );
};

export default MedicationCard;