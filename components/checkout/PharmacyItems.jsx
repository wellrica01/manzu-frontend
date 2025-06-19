const PharmacyItems = ({ cart, calculateItemPrice }) => {
  return (
    <>
      {cart.pharmacies.map((pharmacy) => (
        <div key={pharmacy.pharmacy.id} className="mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate max-w-[250px] sm:max-w-full">
            {pharmacy.pharmacy.name}
          </h3>
          {pharmacy.items.map((item) => (
            <div key={item.id} className="mb-4 mt-2">
              <p className="text-gray-900 text-sm sm:text-base font-medium truncate max-w-[250px] sm:max-w-full">{item.medication.displayName}</p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Quantity: {item.quantity}</p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Unit Price: ₦{item.price.toLocaleString()}</p>
              <p className="text-gray-600 text-xs sm:text-sm font-medium">Total: ₦{calculateItemPrice(item).toLocaleString()}</p>
              {item.medication.prescriptionRequired && (
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Prescription Required</p>
              )}
            </div>
          ))}
          <p className="text-gray-900 text-sm sm:text-base font-semibold">
            Subtotal: ₦{pharmacy.subtotal.toLocaleString()}
          </p>
        </div>
      ))}
    </>
  );
};

export default PharmacyItems;