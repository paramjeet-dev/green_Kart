import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import FoodCard from "../components/listings/FoodCard";
import Spinner from "../components/common/Spinner";
import { Search, X, MapPin, LocateFixed } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const CATEGORIES = ["all", "cooked", "raw", "packaged", "fruits", "vegetables", "dairy", "bakery", "other"];
const STATUSES = ["active", "claimed", "completed"];
const RADIUS_OPTIONS_KM = [2, 5, 10, 25, 50];

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

  // "Near me": once we have the browser's coordinates we send them to the
  // server, which does the actual radius query (see getListings /
  // $geoNear in listingController.js) — the browser only ever needs to
  // know its own position, not everyone else's.
  const [nearMe, setNearMe] = useState(null); // { lat, lng } | null
  const [radiusKm, setRadiusKm] = useState(10);
  const [locating, setLocating] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page, limit: 12 });
      if (category !== "all") params.append("category", category);

      if (nearMe) {
        // $geoNear can't be combined with $text search server-side, so an
        // active "near me" filter takes priority over the search box.
        params.append("lat", nearMe.lat);
        params.append("lng", nearMe.lng);
        params.append("radius", radiusKm);
      } else if (search) {
        params.append("search", search);
      }

      const { data } = await api.get(`/listings?${params}`);
      setListings(data.listings);
      setTotalPages(data.pages);
      setTotal(data.total);
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page, nearMe, radiusKm]);

  useEffect(() => {
    const timer = setTimeout(fetchListings, search && !nearMe ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchListings]);

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };
  const handleCategory = (c) => { setCategory(c); setPage(1); };
  const handleStatus = (s) => { setStatus(s); setPage(1); };

  const handleNearMe = () => {
    if (nearMe) { setNearMe(null); return; } // toggle off

    if (!("geolocation" in navigator)) {
      toast.error("Your browser doesn't support location access");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNearMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPage(1);
        setLocating(false);
      },
      () => {
        toast.error("Couldn't get your location — check your browser's location permission");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  };

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
        {/* Search + Near me */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              disabled={!!nearMe}
              placeholder={nearMe ? "Search is off while browsing nearby" : "Search food listings..."}
              className="input-field pl-9 disabled:bg-gray-50 disabled:text-gray-400"
            />
            {search && !nearMe && (
              <button onClick={() => { setSearch(""); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-text">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={handleNearMe}
            disabled={locating}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
              nearMe
                ? "bg-green-primary text-white border-green-primary"
                : "border-gray-200 text-gray-sub hover:border-green-primary hover:text-green-primary"
            } disabled:opacity-60`}
          >
            {locating ? <Spinner size="sm" /> : nearMe ? <LocateFixed className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            {nearMe ? "Near me" : "Use my location"}
          </button>
        </div>

        {nearMe && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-sub">Within</span>
            {RADIUS_OPTIONS_KM.map((r) => (
              <button
                key={r}
                onClick={() => { setRadiusKm(r); setPage(1); }}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  radiusKm === r ? "bg-green-primary text-white" : "bg-gray-100 text-gray-sub hover:bg-green-light hover:text-green-primary"
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        )}

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
          <p className="text-sm text-gray-sub mt-1">
            {nearMe ? "Try a wider radius" : "Try adjusting your search or filters"}
          </p>
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
