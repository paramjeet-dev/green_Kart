import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import Spinner from "../../components/common/Spinner";
import { Search, UserX, UserCheck, Trash2, Eye, X, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const ROLE_COLORS = {
  donor: "bg-green-100 text-green-700",
  ngo: "bg-blue-100 text-blue-700",
  individual: "bg-purple-100 text-purple-700",
  admin: "bg-red-100 text-red-700",
};

function UserDetailModal({ userId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/users/${userId}`)
      .then(({ data }) => setData(data))
      .catch(() => toast.error("Failed to load user"))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-heading font-semibold text-gray-900">User Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : data ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-primary font-bold text-xl">{data.user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{data.user?.name}</p>
                <p className="text-sm text-gray-500">{data.user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${ROLE_COLORS[data.user?.role]}`}>{data.user?.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${data.user?.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                    {data.user?.isActive ? "Active" : "Deactivated"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{data.user?.totalDonations}</p>
                <p className="text-xs text-gray-500">Donations</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{data.user?.totalReceived}</p>
                <p className="text-xs text-gray-500">Received</p>
              </div>
            </div>

            {data.user?.phone && <p className="text-sm text-gray-600">📞 {data.user.phone}</p>}
            {data.user?.address && <p className="text-sm text-gray-600">📍 {data.user.address}</p>}
            <p className="text-xs text-gray-400">Joined {new Date(data.user?.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>

            {data.listings?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recent Listings ({data.listings.length})</p>
                <div className="space-y-1.5">
                  {data.listings.slice(0, 5).map((l) => (
                    <div key={l._id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate">{l.foodName}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${l.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>{l.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append("search", search);
      if (role) params.append("role", role);
      const { data } = await api.get(`/admin/users?${params}`);
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, role, page]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  const handleToggle = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle`);
      setUsers((prev) => prev.map((u) => u._id === userId ? data.user : u));
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user");
    }
  };

  const handleDelete = async (userId, name) => {
    if (!confirm(`Delete user "${name}" and all their data? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setTotal((t) => t - 1);
      toast.success("User deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{total} registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-primary focus:ring-2 focus:ring-green-primary/20"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-primary"
        >
          <option value="">All Roles</option>
          <option value="donor">Donor</option>
          <option value="ngo">NGO</option>
          <option value="individual">Individual</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">👤</p>
            <p>No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["User", "Role", "Donations", "Received", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-primary text-xs font-semibold">{u.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[140px]">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[140px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${ROLE_COLORS[u.role]}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{u.totalDonations}</td>
                    <td className="px-4 py-3 text-gray-700">{u.totalReceived}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedUser(u._id)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggle(u._id)} className={`p-1.5 rounded transition-colors ${u.isActive ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50" : "text-gray-400 hover:text-green-600 hover:bg-green-50"}`} title={u.isActive ? "Deactivate" : "Activate"}>
                          {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => handleDelete(u._id, u.name)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete user">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedUser && <UserDetailModal userId={selectedUser} onClose={() => setSelectedUser(null)} />}
    </div>
  );
}