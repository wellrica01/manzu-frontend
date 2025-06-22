import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import LabCards from './LabCards';
import LabTable from './LabTable';

const TestCard = ({ test, handleAddToCart, isInCart, setShowTestImage }) => {
  return (
    <Card
      className="relative shadow-2xl border border-gray-100/30 rounded-3xl overflow-hidden bg-gradient-to-br from-white/90 to-gray-50/90 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(59,130,246,0.2)] animate-in slide-in-from-top-10"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-primary/20 rounded-br-full" />
      <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex-1">
          <CardTitle className="text-3xl font-extrabold text-primary tracking-tight leading-tight">
            {test.name}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            {test.orderRequired && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-100 rounded-full animate-pulse">
                Test Order Required
              </span>
            )}
            <div className="relative group">
              <span className="text-sm text-gray-500">{test.description || 'Description N/A'}</span>
            </div>
            <div className="relative group flex items-center">
              <span className="text-base font-medium text-gray-600">
                Quantity: {test.quantity}
              </span>
              <Info className="h-4 w-4 text-primary/50 ml-1" aria-hidden="true" />
              <div className="absolute z-10 hidden group-hover:block bg-gray-800 text-white text-sm rounded-lg p-2 mt-1 shadow-lg max-w-xs">
                This is the recommended quantity. You can adjust it in the cart.
              </div>
            </div>
          </div>
        </div>
        {(test.imageUrl || true) && (
          <div
            className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 cursor-pointer"
            onClick={() => setShowTestImage(test.id)}
            aria-label={`View image of ${test.name}`}
          >
            <img
              src={test.imageUrl || '/fallback-test.png'}
              alt={test.name}
              className="w-full h-full object-cover rounded-2xl border border-gray-200/50 shadow-md transition-transform duration-300 hover:scale-110"
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-primary mb-4">Compare Labs</h3>
        {/* Mobile Lab Cards */}
        <LabCards
          availability={test.availability}
          testId={test.id}
          handleAddToCart={handleAddToCart}
          isInCart={isInCart}
          name={test.name}
        />
        {/* Desktop Lab Table */}
        <LabTable
          availability={test.availability}
          testId={test.id}
          handleAddToCart={handleAddToCart}
          isInCart={isInCart}
          name={test.name}
        />
      </CardContent>
    </Card>
  );
};

export default TestCard;