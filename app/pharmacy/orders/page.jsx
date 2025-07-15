'use client';
import OrdersTable from './components/OrdersTable';
import OrderDetailsDialog from './components/OrderDetailsDialog';
import { useState } from 'react';

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedOrder(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
      <OrdersTable onViewDetails={handleViewDetails} refreshKey={refreshKey} />
      <OrderDetailsDialog open={showDetails} onClose={handleCloseDetails} order={selectedOrder} />
    </div>
  );
} 