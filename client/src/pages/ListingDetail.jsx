import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/common/Spinner";
import toast from "react-hot-toast";
import { MapPin, Clock, Package, User, MessageSquare, CheckCircle, Edit, Trash2, ArrowLeft } from "lucide-react";

const CATEGORY_EMOJI = {
  cooked: "🍲", raw: "🥩", packaged: "📦", fruits: "🍎",
  vegetables: "🥦", dairy: "🥛", bakery: "🍞", other: "🌿",
};

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(({ data }) => setListing(data.listing))
      .catch(() => toast.error("Listing not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!listing) return <div className="page-container py-20 text-center text-gray-sub">Listing not found.</div>;

  const isDonor = user._id === listing.donor._id;
  const daysLeft = Math.ceil((new Date(listing.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

  const handleClaim = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.put(`/listings/${id}/claim`);
      setListing(data.listing);
      toast.success("Listing claimed! Contact the donor to arrange pickup.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to claim listing");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.put(`/listings/${id}/complete`);
      setListing(data.listing);
      toast.success("Exchange marked as complete! 🎉");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await api.delete(`/listings/${id}`);
      toast.success("Listing deleted");
      navigate("/listings");
    } catch {
      toast.error("Failed to delete listing");
    }
  };

  const statusColor = {
    active: "badge-active", claimed: "badge-claimed",
    completed: "badge-completed", expired: "badge-expired",
  };

  return (
    <div className="page-container py-8">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-sub hover:text-gray-text mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Images + Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div className="card overflow-hidden">
            <div className="h-72 sm:h-96 bg-green-light relative">
              {listing.images?.length > 0 ? (
                <img
                  src={listing.images[activeImg]?.url}
                  alt={listing.foodName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl">
                  {CATEGORY_EMOJI[listing.category] || "🌿"}
                </div>
              )}
              <span className={`absolute top-3 left-3 ${statusColor[listing.status]}`}>{listing.status}</span>
            </div>
            {listing.images?.length > 1 && (
              <div className="flex gap-2 p-3">
                {listing.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImg === i ? "border-green-primary" : "border-transparent"}`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="card p-6 space-y-5">
            <div>
              <h1 className="font-heading font-bold text-2xl text-gray-text">{listing.foodName}</h1>
              {listing.description && <p className="text-gray-sub mt-2 text-sm leading-relaxed">{listing.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-sub mb-1">Quantity</p>
                <div className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-green-primary" />
                  <span className="text-sm font-medium text-gray-text">{listing.quantity}</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-sub mb-1">Expires</p>
                <div className="flex items-center gap-1.5">
                  <Clock className={`w-4 h-4 ${daysLeft <= 1 ? "text-orange-500" : "text-green-primary"}`} />
                  <span className={`text-sm font-medium ${daysLeft <= 1 ? "text-orange-600" : "text-gray-text"}`}>
                    {daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Today" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-sub mb-1.5">Pickup Location</p>
              <div className="flex items-start gap-2 text-sm text-gray-text">
                <MapPin className="w-4 h-4 text-green-primary mt-0.5 flex-shrink-0" />
                <span>{listing.location?.address}</span>
              </div>
            </div>

            {listing.pickupInstructions && (
              <div className="bg-green-light rounded-lg p-4">
                <p className="text-xs font-medium text-green-primary mb-1">Pickup Instructions</p>
                <p className="text-sm text-gray-text">{listing.pickupInstructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Donor info + Actions */}
        <div className="space-y-4">
          {/* Donor Card */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-gray-sub mb-3">Posted by</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-light rounded-full flex items-center justify-center">
                <span className="text-green-primary font-semibold">{listing.donor.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium text-gray-text text-sm">{listing.donor.name}</p>
                <p className="text-xs text-gray-sub capitalize">{listing.donor.role}</p>
              </div>
            </div>
            {listing.donor.phone && (
              <p className="text-xs text-gray-sub mt-3">📞 {listing.donor.phone}</p>
            )}
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-3">
            {/* Message donor (non-donors) */}
            {!isDonor && (
              <Link
                to={`/messages/${listing._id}/${listing.donor._id}`}
                className="btn-outline w-full flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Message Donor
              </Link>
            )}

            {/* Claim (NGO/Individual, active listing, not their own) */}
            {!isDonor && listing.status === "active" && (
              <button onClick={handleClaim} disabled={actionLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {actionLoading ? "Claiming..." : "Claim This Food"}
              </button>
            )}

            {/* Message claimer if claimed */}
            {isDonor && listing.status === "claimed" && listing.claimedBy && (
              <Link
                to={`/messages/${listing._id}/${listing.claimedBy._id}`}
                className="btn-outline w-full flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Message Recipient
              </Link>
            )}

            {/* Mark complete (donor, claimed) */}
            {isDonor && listing.status === "claimed" && (
              <button onClick={handleComplete} disabled={actionLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {actionLoading ? "Updating..." : "Mark as Complete"}
              </button>
            )}

            {/* Donor edit/delete */}
            {isDonor && listing.status === "active" && (
              <div className="flex gap-2">
                <Link to={`/listings/${id}/edit`} className="btn-outline flex-1 flex items-center justify-center gap-2 text-sm">
                  <Edit className="w-4 h-4" /> Edit
                </Link>
                <button onClick={handleDelete} className="btn-danger flex-1 flex items-center justify-center gap-2 text-sm">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}

            {listing.status === "completed" && (
              <div className="text-center py-3">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-sm font-medium text-green-primary">Exchange Complete!</p>
                <p className="text-xs text-gray-sub mt-1">This food has been successfully redistributed.</p>
              </div>
            )}
          </div>

          {/* Claimed by */}
          {listing.claimedBy && (
            <div className="card p-4">
              <p className="text-xs text-gray-sub mb-2">Claimed by</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-700 font-semibold text-sm">{listing.claimedBy.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-text">{listing.claimedBy.name}</p>
                  <p className="text-xs text-gray-sub capitalize">{listing.claimedBy.role}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
