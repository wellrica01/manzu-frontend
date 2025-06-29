'use client';

import { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Pill, Microscope, Scale } from 'lucide-react';
import ProviderCards from './ProviderCards';
import ProviderTable from './ProviderTable';

const ServiceCard = ({ service, serviceType, handleAddToOrder, isInOrder, isAddingToOrder }) => {
  const isMedication = serviceType === 'medication';

  return (
    <Card
      className="relative shadow-xl border border-[#1ABA7F]/20 rounded-2xl overflow-hidden bg-white/95 backdrop-blur-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-[#1ABA7F]/30"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <CardHeader className="p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-gradient-to-r from-[#1ABA7F]/10 to-transparent">
        <div className="flex-1 flex items-center gap-3">
          {isMedication ? (
            <Pill className="h-8 w-8 text-[#225F91]" aria-hidden="true" />
          ) : (
            <Microscope className="h-8 w-8 text-[#225F91]" aria-hidden="true" />
          )}
          <div>
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
        <div className="flex items-center gap-3 mb-4">
          <Scale className="h-6 w-6 text-[#225F91]" aria-hidden="true" />
          <h3 className="text-2xl font-bold text-[#225F91]">
            Compare {isMedication ? 'Pharmacies' : 'Labs'}
          </h3>
        </div>
        <ProviderCards
          availability={service.availability}
          serviceId={service.id}
          handleAddToOrder={handleAddToOrder}
          isInOrder={isInOrder}
          isMedication={isMedication}
          displayName={service.displayName}
          isAddingToOrder={isAddingToOrder}
        />
        <ProviderTable
          availability={service.availability}
          serviceId={service.id}
          handleAddToOrder={handleAddToOrder}
          isInOrder={isInOrder}
          isMedication={isMedication}
          displayName={service.displayName}
          isAddingToOrder={isAddingToOrder}
          service={service}
        />
      </CardContent>
    </Card>
  );
};

export default ServiceCard;