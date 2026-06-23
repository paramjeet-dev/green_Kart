import { Link } from "react-router-dom";
import { MapPin, Clock, Package, User } from "lucide-react";

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

export default function FoodCard({ listing }) {
  const { _id, foodName, quantity, category, expiryDate, location, images, status, donor } = listing;

  const daysLeft = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isUrgent = daysLeft <= 1 && status === "active";

  return (
    <Link to={`/listings/${_id}`} className="card block group">
      {/* Image */}
      <div className="relative h-44 bg-green-light overflow-hidden">
        {images?.[0]?.url ? (
          <img
            src={images[0].url}
            alt={foodName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {CATEGORY_EMOJI[category] || "🌿"}
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className={STATUS_CLASSES[status]}>{status}</span>
          {isUrgent && <span className="badge bg-orange-100 text-orange-700">⚡ Urgent</span>}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
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
          <div className={`flex items-center gap-1.5 text-xs ${isUrgent ? "text-orange-600 font-medium" : "text-gray-sub"}`}>
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              {daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Expires today" : `${daysLeft}d left`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-sub">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{donor?.name}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
