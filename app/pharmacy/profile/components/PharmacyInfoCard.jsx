import React from 'react';
import { BadgeCheck, MapPin, Phone, ShieldCheck, Landmark, Home } from 'lucide-react';

export default function PharmacyInfoCard({ pharmacy, onEdit, onChangePassword }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center text-center max-w-xl mx-auto w-full">
      {pharmacy.logoUrl && (
        <div className="mb-4 bg-gray-100 rounded-full p-2 border-2 border-primary">
          <img src={pharmacy.logoUrl} alt="Pharmacy Logo" className="w-24 h-24 rounded-full object-cover" />
        </div>
      )}
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        <Home className="w-5 h-5 text-primary" /> {pharmacy.name}
        <span className="ml-2 inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold" title="Verified">
          <BadgeCheck className="w-4 h-4" /> Verified
        </span>
      </h2>
      <div className="mb-2 text-gray-600 flex items-center gap-2 justify-center">
        <MapPin className="w-4 h-4 text-gray-400" />
        <span>{pharmacy.address}</span>
      </div>
      <div className="mb-2 text-gray-600 flex items-center gap-2 justify-center">
        <Phone className="w-4 h-4 text-gray-400" />
        <span className="font-mono">{pharmacy.phone}</span>
      </div>
      <div className="mb-2 text-gray-600 flex items-center gap-2 justify-center">
        <ShieldCheck className="w-4 h-4 text-gray-400" title="License Number" />
        <span className="font-mono" title="License Number">{pharmacy.licenseNumber}</span>
      </div>
      <div className="mb-2 text-gray-600 flex items-center gap-2 justify-center">
        <Landmark className="w-4 h-4 text-gray-400" title="LGA/State/Ward" />
        <span>LGA: {pharmacy.lga}</span>
        <span>| State: {pharmacy.state}</span>
        <span>| Ward: {pharmacy.ward}</span>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mt-6 w-full justify-center">
        <button
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
          onClick={onEdit}
          aria-label="Edit Pharmacy Profile"
        >
          Edit Profile
        </button>
        <button
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          onClick={onChangePassword}
          aria-label="Change Password"
        >
          Change Password
        </button>
      </div>
    </div>
  );
} 