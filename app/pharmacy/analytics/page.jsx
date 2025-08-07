'use client';
import React, { useEffect, useState } from 'react';
import { Spin } from 'antd'; // Optional: for loading spinner, can remove if not using antd
import SalesChart from './components/SalesChart';
import OrderStatusChart from './components/OrderStatusChart';
import TopMedications from './components/TopMedications';
import CustomerInsights from './components/CustomerInsights';
import InventoryHealth from './components/InventoryHealth';
import OrderFulfillment from './components/OrderFulfillment';
import dayjs from 'dayjs';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import {
  LineChart as LucideLineChart,
  PieChart as LucidePieChart,
  Pill as LucidePill,
  Users as LucideUsers,
  Warehouse as LucideWarehouse,
  Clock as LucideClock,
  Package as LucidePackage,
  DollarSign as LucideDollarSign,
  Calculator as LucideCalculator,
  Repeat as LucideRepeat,
} from 'lucide-react';

// Placeholder summary card component
function SummaryCard({ title, value, icon, tooltip, loading }) {
  return (
    <div className="flex flex-col items-start bg-white rounded-xl shadow p-4 min-w-[160px] min-h-[90px] relative group">
      <div className="text-2xl font-bold mb-1 flex items-center gap-2">
        {icon}
        {loading ? <span className="animate-pulse text-gray-300">...</span> : value}
      </div>
      <div className="text-xs text-gray-500 font-medium">{title}</div>
      {tooltip && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-800 text-white rounded px-2 py-1 z-10">{tooltip}</div>
      )}
    </div>
  );
}

const TIME_RANGES = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'All time', value: 'all' },
  { label: 'Custom', value: 'custom' },
];

function filterOrdersByRange(orders, range, customStart, customEnd) {
  if (range === 'all') return orders;
  let start, end = new Date();
  if (range === '7d') start = dayjs().subtract(7, 'day').startOf('day');
  else if (range === '30d') start = dayjs().subtract(30, 'day').startOf('day');
  else if (range === '90d') start = dayjs().subtract(90, 'day').startOf('day');
  else if (range === 'custom' && customStart && customEnd) {
    start = dayjs(customStart).startOf('day');
    end = dayjs(customEnd).endOf('day');
  } else return orders;
  return orders.filter(o => {
    const d = dayjs(o.createdAt);
    return d.isAfter(start) && d.isBefore(end);
  });
}

export default function AnalyticsPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [medications, setMedications] = useState([]);
  // Time range filter state
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('pharmacyToken');
        const res = await fetch('http:///NEXT_PUBLIC_API_URL/api/pharmacy/orders', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    async function fetchMedications() {
      try {
        const token = localStorage.getItem('pharmacyToken');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/medications`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch medications');
        const data = await res.json();
        setMedications(data.medications || []);
      } catch (err) {
        // Optionally handle error
      }
    }
    fetchOrders();
    fetchMedications();
  }, []);

  // Filtered orders by time range
  const filteredOrders = filterOrdersByRange(orders, range, customStart, customEnd);

  // Compute summary metrics from filteredOrders
  const totalSales = filteredOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders ? Math.round(totalSales / totalOrders) : 0;
  const customerOrderCounts = filteredOrders.reduce((acc, o) => {
    acc[o.userIdentifier] = (acc[o.userIdentifier] || 0) + 1;
    return acc;
  }, {});
  const returningCustomers = Object.values(customerOrderCounts).filter(c => c > 1).length;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans">
      {/* Sticky Topbar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-100 mb-6 pb-2">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <span className="text-primary"><LucideLineChart /></span>
          Pharmacy Analytics Dashboard
        </h1>
        {/* Time Range Filter */}
        <div className="mb-2 flex flex-wrap gap-4 items-center">
          <label className="font-medium">Time Range:</label>
          {TIME_RANGES.map(opt => (
            <button
              key={opt.value}
              className={`px-3 py-1 rounded border shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-sm font-medium ${range === opt.value ? 'bg-primary text-white border-primary shadow' : 'bg-white text-gray-700 border-gray-300 hover:bg-primary/10'}`}
              onClick={() => setRange(opt.value)}
              aria-pressed={range === opt.value}
            >
              {opt.label}
            </button>
          ))}
          {range === 'custom' && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={e => setCustomStart(e.target.value)}
                className="border rounded px-2 py-1 ml-2 focus:ring-2 focus:ring-primary/50 text-sm"
                aria-label="Custom start date"
              />
              <span className="mx-1">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={e => setCustomEnd(e.target.value)}
                className="border rounded px-2 py-1 focus:ring-2 focus:ring-primary/50 text-sm"
                aria-label="Custom end date"
              />
            </>
          )}
        </div>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
          <SummaryCard title="Total Sales" value={`₦${totalSales.toLocaleString()}`} icon={<LucideDollarSign className="w-5 h-5 text-primary" />} tooltip="Total revenue for selected period" loading={loading} />
          <SummaryCard title="Total Orders" value={totalOrders} icon={<LucidePackage className="w-5 h-5 text-primary" />} tooltip="Number of orders placed" loading={loading} />
          <SummaryCard title="Avg. Order Value" value={`₦${avgOrderValue.toLocaleString()}`} icon={<LucideCalculator className="w-5 h-5 text-primary" />} tooltip="Average value per order" loading={loading} />
          <SummaryCard title="Returning Customers" value={returningCustomers} icon={<LucideRepeat className="w-5 h-5 text-primary" />} tooltip="Customers who ordered more than once" loading={loading} />
        </div>
      </div>
      {error && <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>}
      <div className="divide-y divide-gray-200">
        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pt-6">
          <div className="bg-white rounded-xl shadow p-6 min-h-[320px] hover:shadow-lg transition group">
            {/* Sales Over Time Chart */}
            <div className="text-lg font-semibold mb-2 flex items-center gap-2">
              <LucideLineChart className="w-5 h-5 text-primary" /> Sales Over Time
              <span data-tooltip-id="sales-chart-tip" className="ml-1 cursor-pointer text-gray-400">?</span>
              <ReactTooltip id="sales-chart-tip" place="top" content="Shows total sales per day for the selected period." />
            </div>
            <SalesChart orders={filteredOrders} loading={loading} />
          </div>
          <div className="bg-white rounded-xl shadow p-6 min-h-[320px] hover:shadow-lg transition group">
            {/* Order Status Breakdown */}
            <div className="text-lg font-semibold mb-2 flex items-center gap-2">
              <LucidePieChart className="w-5 h-5 text-primary" /> Order Status Breakdown
              <span data-tooltip-id="order-status-tip" className="ml-1 cursor-pointer text-gray-400">?</span>
              <ReactTooltip id="order-status-tip" place="top" content="Distribution of order statuses for the selected period." />
            </div>
            <OrderStatusChart orders={filteredOrders} loading={loading} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 pt-6">
          <div className="bg-white rounded-xl shadow p-6 min-h-[320px] hover:shadow-lg transition group">
            {/* Top Medications */}
            <div className="text-lg font-semibold mb-2 flex items-center gap-2">
              <LucidePill className="w-5 h-5 text-primary" /> Top Medications
              <span data-tooltip-id="top-meds-tip" className="ml-1 cursor-pointer text-gray-400">?</span>
              <ReactTooltip id="top-meds-tip" place="top" content="Most frequently ordered medications." />
            </div>
            <TopMedications orders={filteredOrders} loading={loading} />
          </div>
          <div className="bg-white rounded-xl shadow p-6 min-h-[320px] hover:shadow-lg transition group">
            {/* Customer Insights */}
            <div className="text-lg font-semibold mb-2 flex items-center gap-2">
              <LucideUsers className="w-5 h-5 text-primary" /> Customer Insights
              <span data-tooltip-id="customer-insights-tip" className="ml-1 cursor-pointer text-gray-400">?</span>
              <ReactTooltip id="customer-insights-tip" place="top" content="Top customers and new vs returning breakdown." />
            </div>
            <CustomerInsights orders={filteredOrders} loading={loading} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          <div className="bg-white rounded-xl shadow p-6 min-h-[320px] hover:shadow-lg transition group">
            {/* Inventory Health */}
            <div className="text-lg font-semibold mb-2 flex items-center gap-2">
              <LucideWarehouse className="w-5 h-5 text-primary" /> Inventory Health
              <span data-tooltip-id="inventory-health-tip" className="ml-1 cursor-pointer text-gray-400">?</span>
              <ReactTooltip id="inventory-health-tip" place="top" content="Low stock and expiring soon medications." />
            </div>
            <InventoryHealth medications={medications} loading={loading} />
          </div>
          <div className="bg-white rounded-xl shadow p-6 min-h-[320px] hover:shadow-lg transition group">
            {/* Order Fulfillment */}
            <div className="text-lg font-semibold mb-2 flex items-center gap-2">
              <LucideClock className="w-5 h-5 text-primary" /> Order Fulfillment
              <span data-tooltip-id="order-fulfillment-tip" className="ml-1 cursor-pointer text-gray-400">?</span>
              <ReactTooltip id="order-fulfillment-tip" place="top" content="Average fulfillment time and recent cancellations." />
            </div>
            <OrderFulfillment orders={filteredOrders} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  );
}
