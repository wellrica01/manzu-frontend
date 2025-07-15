'use client';
import InventoryTable from './components/InventoryTable';
import AddMedicationDialog from './components/AddMedicationDialog';
import EditMedicationDialog from './components/EditMedicationDialog';
import DeleteMedicationDialog from './components/DeleteMedicationDialog';
import { useState } from 'react';

export default function InventoryPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (medication) => {
    setSelectedMedication(medication);
    setShowEditDialog(true);
  };

  const handleDelete = (medication) => {
    setSelectedMedication(medication);
    setShowDeleteDialog(true);
  };

  const handleRefresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <button
          className="bg-[#1ABA7F] text-white px-4 py-2 rounded hover:bg-[#15996a] transition"
          onClick={() => setShowAddDialog(true)}
        >
          Add Medication
        </button>
      </div>
      <InventoryTable onEdit={handleEdit} onDelete={handleDelete} refreshKey={refreshKey} />
      <AddMedicationDialog open={showAddDialog} onClose={() => { setShowAddDialog(false); handleRefresh(); }} />
      <EditMedicationDialog open={showEditDialog} onClose={() => { setShowEditDialog(false); handleRefresh(); }} medication={selectedMedication} />
      <DeleteMedicationDialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} medication={selectedMedication} onDelete={() => { setShowDeleteDialog(false); handleRefresh(); }} />
    </div>
  );
}
