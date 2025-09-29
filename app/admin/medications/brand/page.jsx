"use client";
import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, Edit, Trash2, Plus, CheckCircle, Pill } from "lucide-react";
import { fetchMedications, deleteMedication } from "./api";
import Dialog from "../../components/Dialog";
import MedicationForm from "./MedicationForm";
import DataTableView from "../../components/DataTableView";

export default function MedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [form, setForm] = useState("");
  const [prescriptionRequired, setPrescriptionRequired] = useState("");
  const [allForms, setAllForms] = useState([]);

  const [editingMedication, setEditingMedication] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Extract unique forms for filter dropdown
  useEffect(() => {
    if (medications.length > 0) {
      const uniqueForms = Array.from(
        new Set(medications.map((m) => m.form).filter(Boolean))
      );
      setAllForms(uniqueForms);
    }
  }, [medications]);

  // Load medications
  useEffect(() => {
    async function loadMedications() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { brandName: search } : {}),
          ...(form ? { form: form.toUpperCase() } : {}),
        };

        if (prescriptionRequired === "true" || prescriptionRequired === "false") {
          params.prescriptionRequired = prescriptionRequired;
        }

        const data = await fetchMedications(params);
        setMedications(data.medications);
        setPagination(data.pagination);
      } catch (e) {
        setError("Failed to load medications.");
      } finally {
        setLoading(false);
      }
    }
    loadMedications();
  }, [pagination.page, search, form, prescriptionRequired]);

  function handlePageChange(newPage) {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }

  const handleEditClick = (med) => {
    setEditingMedication(med);
    setDialogOpen(true);
  };

  async function handleDelete(id) {
    setDeleteLoading(true);
    try {
      await deleteMedication(id);
      setDeleteSuccess(true);
      setMedications((prev) => prev.filter((m) => m.id !== id));
      setTimeout(() => {
        setDeleteId(null);
        setDeleteSuccess(false);
      }, 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  // Helper function to format ingredients
  const formatIngredients = (ingredients) => {
    if (!ingredients || ingredients.length === 0) return "Not specified";
    
    const names = ingredients
      .map((i) => i.activeSubstanceName)
      .filter(Boolean);
    
    if (names.length === 0) return "Not specified";
    if (names.length <= 2) return names.join(" / ");
    
    return (
      <span title={names.join(", ")}>
        {names.slice(0, 2).join(", ")} 
        <span className="text-gray-500 text-xs ml-1">+{names.length - 2} more</span>
      </span>
    );
  };

  // Helper function to format strengths
  const formatStrengths = (ingredients) => {
    if (!ingredients || ingredients.length === 0) return "Not specified";
    
    const strengths = ingredients
      .map((i) => `${i.strengthValue || ""} ${i.strengthUnit || ""}`.trim())
      .filter(Boolean);
    
    if (strengths.length === 0) return "Not specified";
    if (strengths.length <= 2) return strengths.join(" / ");
    
    return (
      <span title={strengths.join(", ")}>
        {strengths.slice(0, 2).join(", ")} 
        <span className="text-gray-500 text-xs ml-1">+{strengths.length - 2} more</span>
      </span>
    );
  };

  // Mobile card component
  const renderMobileCard = (med) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{med.brandName}</h3>
          <p className="text-gray-600 text-sm">{med.Manufacturer?.name || "Unknown Manufacturer"}</p>
        </div>
        <div className="flex gap-2 ml-3">
          <button
            className="p-2 rounded-full hover:bg-[#1ABA7F]/10 text-[#1ABA7F] transition-colors"
            title="Edit medication"
            onClick={() => handleEditClick(med)}
            aria-label={`Edit ${med.brandName}`}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-full hover:bg-red-100 text-red-600 transition-colors"
            title="Delete medication"
            onClick={() => setDeleteId(med.id)}
            disabled={deleteLoading && deleteId === med.id}
            aria-label={`Delete ${med.brandName}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 font-medium">Form:</span>
          <p className="text-gray-900">{med.form || "Not specified"}</p>
        </div>
        <div>
          <span className="text-gray-500 font-medium">Pack Size:</span>
          <p className="text-gray-900">
            {med.packSizeQuantity} {med.packSizeUnit}
          </p>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500 font-medium">Active Ingredients:</span>
          <p className="text-gray-900">{formatIngredients(med.ingredients)}</p>
        </div>
        <div className="col-span-2">
          <span className="text-gray-500 font-medium">Strengths:</span>
          <p className="text-gray-900">{formatStrengths(med.ingredients)}</p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-gray-500 font-medium text-sm">Prescription Required:</span>
          {med.prescriptionRequired ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Yes
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              No
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Table columns configuration
  const columns = [
    {
      key: 'brandName',
      label: 'Brand',
      render: (med) => (
        <div className="font-medium text-gray-900">{med.brandName}</div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'ingredients',
      label: 'Active Ingredients',
      render: (med) => (
        <div className="text-sm text-gray-900 max-w-xs">
          {formatIngredients(med.ingredients)}
        </div>
      )
    },
    {
      key: 'strengths',
      label: 'Strengths',
      render: (med) => (
        <div className="text-sm text-gray-900 max-w-xs">
          {formatStrengths(med.ingredients)}
        </div>
      )
    },
    {
      key: 'form',
      label: 'Form',
      render: (med) => med.form || "Not specified",
      cellClassName: 'whitespace-nowrap text-sm text-gray-900'
    },
    {
      key: 'packSize',
      label: 'Pack Size',
      render: (med) => `${med.packSizeQuantity} ${med.packSizeUnit}`,
      cellClassName: 'whitespace-nowrap text-sm text-gray-900'
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      render: (med) => (
        <div className="text-sm text-gray-900 max-w-xs truncate" title={med.Manufacturer?.name}>
          {med.Manufacturer?.name || "Unknown"}
        </div>
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'prescription',
      label: 'Prescription',
      render: (med) => (
        med.prescriptionRequired ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Required
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Not Required
          </span>
        )
      ),
      cellClassName: 'whitespace-nowrap'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (med) => (
        <div className="flex gap-2">
          <button
            className="p-1.5 rounded-md hover:bg-[#1ABA7F]/10 text-[#1ABA7F] transition-colors"
            title="Edit medication"
            onClick={() => handleEditClick(med)}
            aria-label={`Edit ${med.brandName}`}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition-colors"
            title="Delete medication"
            onClick={() => setDeleteId(med.id)}
            disabled={deleteLoading && deleteId === med.id}
            aria-label={`Delete ${med.brandName}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      cellClassName: 'whitespace-nowrap text-sm font-medium'
    }
  ];

  // Filter configurations
  const filters = [
    {
      value: form,
      onChange: (value) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setForm(value);
      },
      options: allForms.map(f => ({ value: f, label: f })),
      placeholder: "All Forms",
      className: "sm:w-48"
    },
    {
      value: prescriptionRequired,
      onChange: (value) => {
        setPagination((prev) => ({ ...prev, page: 1 }));
        setPrescriptionRequired(value);
      },
      options: [
        { value: "true", label: "Prescription Required" },
        { value: "false", label: "No Prescription" }
      ],
      placeholder: "All Types",
      className: "sm:w-48"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingMedication(null);
        }}
        title={editingMedication ? "Edit Medication" : "Add Medication"}
        size="lg"
      >
        <MedicationForm
          medication={editingMedication || {}}
          mode={editingMedication ? "edit" : "create"}
          onSuccess={() => {
            setDialogOpen(false);
            setEditingMedication(null);
            setPagination((prev) => ({ ...prev })); // reload
          }}
        />
      </Dialog>

      {/* Delete Confirmation */}
      {deleteId && (
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete">
          <div className="mb-6">
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Are you sure you want to delete this medication?</p>
                <p className="text-red-600 text-sm mt-1">This action cannot be undone.</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
              onClick={() => setDeleteId(null)}
              disabled={deleteLoading}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
              onClick={() => handleDelete(deleteId)}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </Dialog>
      )}

      {/* Main Data Table View */}
      <DataTableView
        title="Medications"
        description="Manage your medication inventory"
        data={medications}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={(value) => {
          setPagination((prev) => ({ ...prev, page: 1 }));
          setSearch(value);
        }}
        searchPlaceholder="Search by brand name..."
        filters={filters}
        columns={columns}
        mobileCardRender={renderMobileCard}
        emptyState={{
          icon: Pill,
          title: "No medications found",
          showPrimaryAction: true
        }}
        primaryAction={{
          label: "Add Medication",
          icon: Plus,
          onClick: () => {
            setEditingMedication(null);
            setDialogOpen(true);
          }
        }}
        className = "p-3"
      />

      {/* Success Toast */}
      {deleteSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg z-50 animate-in slide-in-from-right">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Medication deleted successfully</span>
        </div>
      )}
    </div>
  );
}