import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../services/api";
import Spinner from "../components/common/Spinner";
import { MapPin, Clock, Package, Edit, Trash2, CheckCircle, MessageSquare } from "lucide-react";

const STATUS_CLASSES = {
  active: "badge-active",
  claimed: "badge-claimed",
  completed: "badge-completed",
  expired: "badge-expired",
};

const CATEGORY_EMOJI = {
  cooked: "🍲", raw: "🥩", packaged: "📦", fruits: "🍎",
  vegetables: "🥦", dairy: "🥛", bakery: "🍞", other: "🌿",
};

const TABS = ["all", "active", "claimed", "completed", "expired"];

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [actionId, setActionId] = useState(null); // listing currently being acted on

  const fetchMyListings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/listings/my");
      setListings(data.listings);
    } catch {
      toast.error("Failed to load your listings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyListings(); }, [fetchMyListings]);

  const handleComplete = async (id) => {
    setActionId(id);
    try {
      await api.put(`/listings/${id}/complete`);
      toast.success("Exchange marked as complete! 🎉");
      fetchMyListings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    setActionId(id);
    try {
      await api.delete(`/listings/${id}`);
      toast.success("Listing deleted");
      fetchMyListings();
    } catch {
      toast.error("Failed to delete listing");
    } finally {
      setActionId(null);
    }
  };

  const visible = tab === "all" ? listings : listings.filter((l) => l.status === tab);

  return (
    <div className="page-container py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-text">My Listings</h1>
          <p className="text-gray-sub text-sm mt-1">{listings.length} listing{listings.length !== 1 ? "s" : ""} total</p>
        </div>
        <Link to="/listings/create" className="btn-primary self-start">+ Donate Food</Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 border-b border-gray-100 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 px-1 text-sm font-medium capitalize border-b-2 transition-colors whitespace-nowrap ${
              tab === t ? "border-green-primary text-green-primary" : "border-transparent text-gray-sub hover:text-gray-text"
            }`}
          >
            {t} {t !== "all" && `(${listings.filter((l) => l.status === t).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : visible.length === 0 ? (
        <div className="card p-16 text-center">
          <p className="text-4xl mb-3">🥬</p>
          <p className="font-medium text-gray-text">No listings here yet</p>
          <p className="text-sm text-gray-sub mt-1">Create a listing to start sharing surplus food.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((listing) => {
            const { _id, foodName, quantity, category, expiryDate, location, images, status, claimedBy } = listing;
            const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
            const busy = actionId === _id;

            return (
              <div key={_id} className="card overflow-hidden">
                <Link to={`/listings/${_id}`} className="block group">
                  <div className="relative h-40 bg-green-light overflow-hidden">
                    {images?.[0]?.url ? (
                      <img src={images[0].url} alt={foodName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">{CATEGORY_EMOJI[category] || "🌿"}</div>
                    )}
                    <span className={`absolute top-2 left-2 ${STATUS_CLASSES[status]}`}>{status}</span>
                  </div>
                  <div className="p-4 pb-2">
                    <h3 className="font-heading font-semibold text-gray-text truncate mb-1">{foodName}</h3>
                    <div className="space-y-1.5 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-sub">
                        <Package className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{quantity}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-sub">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{location?.address || "Location not specified"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-sub">
                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}</span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Owner actions */}
                <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2">
                  {status === "claimed" && claimedBy && (
                    <Link
                      to={`/messages/${_id}/${claimedBy._id}`}
                      className="btn-outline flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </Link>
                  )}
                  {status === "claimed" && (
                    <button
                      onClick={() => handleComplete(_id)}
                      disabled={busy}
                      className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> {busy ? "Updating…" : "Complete"}
                    </button>
                  )}
                  {status === "active" && (
                    <Link to={`/listings/${_id}/edit`} className="btn-outline flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                  )}
                  {status !== "completed" && (
                    <button
                      onClick={() => handleDelete(_id)}
                      disabled={busy}
                      className="btn-danger flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {busy ? "…" : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}