"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchUsers } from "./api";
import DataTableView from "../components/DataTableView";
import { ShoppingCart } from "lucide-react";

const roleOptions = ["ADMIN", "SUPER_ADMIN", "SUPPORT"];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");

  // Fetch users
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
          ...(search ? { email: search } : {}),
          ...(role ? { role } : {}),
        };
        const data = await fetchUsers(params);
        setUsers(data.data?.users || []);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
      } catch (e) {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    }
    loadUsers();
  }, [pagination.page, search, role]);

  const handlePageChange = (newPage) => setPagination(prev => ({ ...prev, page: newPage }));

  // Mobile card render
  const renderMobileCard = (user) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{user.name}</h3>
          <p className="text-gray-600 text-sm">{user.email}</p>
        </div>
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
        </span>
      </div>
      <div className="flex justify-between items-center text-sm">
        <span>ID: {user.id}</span>
        <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="pt-2 border-t border-gray-100 mt-2">
        <Link
          href={`/admin/users/${user.id}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition text-sm"
        >
          View
        </Link>
      </div>
    </div>
  );

  // Table columns
  const columns = [
    { key: "id", label: "ID", render: u => u.id },
    { key: "name", label: "Name", render: u => u.name },
    { key: "email", label: "Email", render: u => u.email },
    { key: "role", label: "Role", render: u => u.role.charAt(0) + u.role.slice(1).toLowerCase() },
    { key: "createdAt", label: "Created", render: u => new Date(u.createdAt).toLocaleDateString() },
    { key: "actions", label: "Actions", render: u => (
        <Link
          href={`/admin/users/${u.id}`}
          className="px-4 py-2 rounded-lg bg-[#225F91] text-white font-semibold hover:bg-[#1A4971] transition text-sm"
        >
          View
        </Link>
      )
    },
  ];

  // Filters
  const filters = [
    {
      value: role,
      onChange: setRole,
      options: roleOptions.map(r => ({ value: r, label: r })),
      placeholder: "All Roles",
    }
  ];

  return (
    <div>

      <DataTableView
        title="Admin Platform Users"
        description=""
        data={users}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        searchValue={search}
        onSearchChange={v => { setPagination(prev => ({ ...prev, page: 1 })); setSearch(v); }}
        searchPlaceholder="Search by email..."
        filters={filters}
        columns={columns}
        mobileCardRender={renderMobileCard}
        emptyState={{
          icon: ShoppingCart,
          title: "No users found",
          description: search || role !== "ALL" ? "Try adjusting your search or filters." : "Users will appear here once added.",
          showPrimaryAction: false,
        }}
        className = "p-3"
      />
    </div>
  );
}
