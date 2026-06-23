import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import FoodCard from "../components/listings/FoodCard";
import Spinner from "../components/common/Spinner";
import { Search, Filter, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const CATEGORIES = ["all", "cooked", "raw", "packaged", "fruits", "vegetables", "dairy", "bakery", "other"];
const STATUSES = ["active", "claimed", "completed"];

export default function Listings() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page, limit: 12 });
      if (search) params.append("search", search);
      if (category !== "all") params.append("category", category);

      const { data } = await api.get(`/listings?${params}`);
      setListings(data.listings);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page]);

  useEffect(() => {
    const timer = setTimeout(fetchListings, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleCategory = (c) => { setCategory(c); setPage(1); };
  const handleStatus = (s) => { setStatus(s); setPage(1); };

  return (
    <div className="page-container py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-text">Food Listings</h1>
          <p className="text-gray-sub text-sm mt-1">{total} listing{total !== 1 ? "s" : ""} available</p>
        </div>
        {user?.role === "donor" && (
          <Link to="/listings/create" className="btn-primary self-start flex items-center gap-2">
            + Donate Food
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={handleSearch}
            placeholder="Search food listings..."
            className="input-field pl-9"
          />
          {search && (
            <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-text">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => handleCategory(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                category === c ? "bg-green-primary text-white" : "bg-gray-100 text-gray-sub hover:bg-green-light hover:text-green-primary"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 border-b border-gray-100">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatus(s)}
              className={`pb-2 px-1 text-sm font-medium capitalize border-b-2 transition-colors ${
                status === s ? "border-green-primary text-green-primary" : "border-transparent text-gray-sub hover:text-gray-text"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : listings.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-medium text-gray-text">No listings found</p>
          <p className="text-sm text-gray-sub mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {listings.map((l) => <FoodCard key={l._id} listing={l} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-outline py-1.5 px-4 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-sub">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn-outline py-1.5 px-4 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
