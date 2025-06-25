'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ProviderCards from './ProviderCards'; // To be unified
import ProviderTable from './ProviderTable'; // To be unified

const ServiceCard = ({ service, serviceType, handleAddToOrder, isInOrder, isAddingToOrder }) => {
  const [quantity, setQuantity] = useState(1);
  const isMedication = serviceType === 'medication';

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  return (
    <Card
      className="relative shadow-xl border border-[#1ABA7F]/20 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-full" />
      <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-[#1ABA7F]/10 to-transparent">
        <div className="flex-1">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-[#225F91] tracking-tight leading-tight">
            {service.displayName}
          </CardTitle>
          <div className="flex items-center gap-2 mt-2">
            {service.prescriptionRequired && (
              <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-[#225F91] bg-[#225F91]/10 rounded-full">
                {isMedication ? 'Prescription Needed' : 'Order Required'}
              </span>
            )}
            <span className="text-sm text-gray-500">
              {isMedication ? service.genericName || 'Generic N/A' : service.testType || 'Type N/A'}
            </span>
          </div>
          <div className="mt-2">
            <p className="text-gray-600 text-base">
              <strong className="font-semibold text-gray-800">
                {isMedication ? 'NAFDAC Code' : 'Test Code'}:
              </strong>{' '}
              {isMedication ? service.nafdacCode || 'N/A' : service.testCode || 'N/A'}
            </p>
          </div>
        </div>
        {service.imageUrl && (
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
            <img
              src={service.imageUrl}
              alt={service.displayName}
              className="w-full h-full object-cover rounded-xl border border-[#1ABA7F]/20 shadow-md transition-transform duration-300 hover:scale-105"
              aria-describedby={`service-desc-${service.id}`}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {service.prepInstructions && !isMedication && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[#225F91]" id={`service-desc-${service.id}`}>
              Preparation Instructions
            </h3>
            <p className="text-gray-600 text-base">{service.prepInstructions}</p>
          </div>
        )}
        {isMedication && (
          <div className="mb-4">
            <label
              htmlFor={`quantity-${service.id}`}
              className="text-sm font-semibold text-[#225F91] uppercase tracking-wider"
            >
              Quantity
            </label>
            <Input
              id={`quantity-${service.id}`}
              type="number"
              min="1"
              value={quantity}
              onChange={handleQuantityChange}
              className="mt-2 w-24 h-10 border-[#1ABA7F]/20 rounded-xl text-gray-900 bg-white/95 focus:border-[#1ABA7F]/50 focus:shadow-[0_0_10px_rgba(26,186,127,0.3)]"
            />
          </div>
        )}
        <h3 className="text-xl font-bold text-[#225F91] mb-4">
          Compare {isMedication ? 'Pharmacies' : 'Labs'}
        </h3>
        <ProviderCards
          availability={service.availability}
          serviceId={service.id}
          handleAddToOrder={(providerId, displayName) =>
            handleAddToOrder(service.id, providerId, displayName, quantity)
          }
          isInOrder={isInOrder}
          isMedication={isMedication}
          displayName={service.displayName}
          isAddingToOrder={isAddingToOrder}
        />
        <ProviderTable
          availability={service.availability}
          serviceId={service.id}
          handleAddToOrder={(providerId, displayName) =>
            handleAddToOrder(service.id, providerId, displayName, quantity)
          }
          isInOrder={isInOrder}
          isMedication={isMedication}
          displayName={service.displayName}
          isAddingToOrder={isAddingToOrder}
        />
      </CardContent>
    </Card>
  );
};

export default ServiceCard;