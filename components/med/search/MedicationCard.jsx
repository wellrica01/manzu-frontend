import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import PharmacyTable from './PharmacyTable';
import PharmacyCards from './PharmacyCards';

const MedicationCard = ({ med, handleAddToCart, isInCart, isAddingToCart }) => {
  return (
    <Card
      className="relative shadow-xl border border-[#1ABA7F]/20 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
      <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-[#1ABA7F]/10 to-transparent">
        <div className="flex-1">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight leading-tight">
            {med.displayName}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            {med.prescriptionRequired && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-[#225F91] bg-[#225F91]/10 rounded-full">
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
              className="w-full h-full object-cover rounded-xl border border-[#1ABA7F]/20 shadow-md transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-[#225F91] mb-4">Compare Pharmacies</h3>
        <PharmacyCards
          availability={med.availability}
          medId={med.id}
          handleAddToCart={handleAddToCart}
          isInCart={isInCart}
          displayName={med.displayName}
          isAddingToCart={isAddingToCart}
        />
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