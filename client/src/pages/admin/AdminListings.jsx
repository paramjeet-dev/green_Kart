import { useEffect, useState, useCallback } from "react";
import api from "../../services/api";
import Spinner from "../../components/common/Spinner";
import { Search, Trash2, Clock, ChevronLeft, ChevronRight, MapPin, Package } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  active: "bg-green-50 text-green-700",
  claimed: "bg-yellow-50 text-yellow-700",
  completed: "bg-blue-50 text-blue-700",
  expired: "bg-red-50 text-red-600",
};

const CATEGORY_EMOJI = {
  cooked: "🍲", raw: "🥩", packaged: "📦", fruits: "🍎",
  vegetables: "🥦", dairy: "🥛", bakery: "🍞", other: "🌿",
};

export default function AdminListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.append("search", search);
      if (status) params.append("status", status);
      const { data } = await api.get(`/admin/listings?${params}`);
      setListings(data.listings);
      setTotal(data.total);
      setTotalPages(data.pages);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const t = setTimeout(fetch, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetch]);

  const handleExpire = async (id) => {
    try {
      const { data } = await api.put(`/admin/listings/${id}/expire`);
      setListings((prev) => prev.map((l) => l._id === id ? data.listing : l));
      toast.success("Listing marked as expired");
    } catch {
      toast.error("Failed to expire listing");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete listing "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/listings/${id}`);
      setListings((prev) => prev.filter((l) => l._id !== id));
      setTotal((t) => t - 1);
      toast.success("Listing deleted");
    } catch {
      toast.error("Failed to delete listing");
    }
  };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div>
        <h1 className="font-heading font-bold text-2xl text-gray-900">Listings</h1>
        <p className="text-gray-500 text-sm mt-1">{total} total listings</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search listings..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-primary focus:ring-2 focus:ring-green-primary/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-primary"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="claimed">Claimed</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">📦</p><p>No listings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {["Food", "Donor", "Category", "Location", "Status", "Expiry", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {listings.map((l) => {
                  const daysLeft = Math.ceil((new Date(l.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                  return (
                    <tr key={l._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                            {l.images?.[0]?.url
                              ? <img src={l.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                              : CATEGORY_EMOJI[l.category] || "🌿"
                            }
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate max-w-[160px]">{l.foodName}</p>
                            <p className="text-xs text-gray-400">{l.quantity}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700 truncate max-w-[120px]">{l.donor?.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{l.donor?.role}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">{l.category}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-500 truncate max-w-[130px]">{l.location?.address || "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${STATUS_STYLES[l.status]}`}>{l.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${daysLeft < 0 ? "text-red-500" : daysLeft <= 2 ? "text-orange-500" : "text-gray-500"}`}>
                          {daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Today" : `${daysLeft}d`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {l.status === "active" && (
                            <button onClick={() => handleExpire(l._id)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded transition-colors" title="Force expire">
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                          <button onClick={() => handleDelete(l._id, l.foodName)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
    </div>
  );
}