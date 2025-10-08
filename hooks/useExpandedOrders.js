import { useState, useCallback } from 'react';

export function useExpandedOrders() {
  const [expandedOrders, setExpandedOrders] = useState({});

  const toggleOrder = useCallback((orderId) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  }, []);

  const expandAll = useCallback((orderIds) => {
    const expanded = {};
    orderIds.forEach(id => { expanded[id] = true; });
    setExpandedOrders(expanded);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedOrders({});
  }, []);

  return {
    expandedOrders,
    toggleOrder,
    expandAll,
    collapseAll
  };
}

