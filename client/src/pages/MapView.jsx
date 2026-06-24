import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import Spinner from "../components/common/Spinner";
import { MapPin, List, Filter, X, Clock, Package, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

// Leaflet loaded via CDN in HTML — we use it through window.L
const CATEGORY_EMOJI = {
  cooked: "🍲", raw: "🥩", packaged: "📦", fruits: "🍎",
  vegetables: "🥦", dairy: "🥛", bakery: "🍞", other: "🌿",
};

const STATUS_COLOR = {
  active: "#2E7D32",
  claimed: "#F59E0B",
};

function ListingCard({ listing, onClose }) {
  if (!listing) return null;
  const daysLeft = Math.ceil((new Date(listing.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-[1000] overflow-hidden">
      <div className="relative">
        {listing.images?.[0]?.url ? (
          <img src={listing.images[0].url} alt={listing.foodName} className="w-full h-32 object-cover" />
        ) : (
          <div className="w-full h-32 bg-green-50 flex items-center justify-center text-5xl">
            {CATEGORY_EMOJI[listing.category] || "🌿"}
          </div>
        )}
        <button onClick={onClose} className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
          <X className="w-3.5 h-3.5 text-gray-600" />
        </button>
        <span className={`absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full font-medium text-white ${listing.status === "active" ? "bg-green-primary" : "bg-yellow-500"}`}>
          {listing.status}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-gray-900 mb-1">{listing.foodName}</h3>
        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Package className="w-3.5 h-3.5" />
            <span>{listing.quantity}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">{listing.location?.address}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${daysLeft <= 1 ? "text-orange-600 font-medium" : "text-gray-500"}`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Expires today" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span>by {listing.donor?.name}</span>
          </div>
        </div>
        <Link
          to={`/listings/${listing._id}`}
          className="flex items-center justify-center gap-1.5 w-full py-2 bg-green-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
        >
          View Listing <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function MapView() {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef([]);
  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showList, setShowList] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet CSS + JS
  useEffect(() => {
    if (window.L) { setLeafletReady(true); return; }

    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(css);

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => setLeafletReady(true);
    document.head.appendChild(script);
  }, []);

  // Fetch listings
  useEffect(() => {
    api.get("/listings/map-data")
      .then(({ data }) => {
        setListings(data.listings);
        setFiltered(data.listings);
      })
      .catch(() => toast.error("Failed to load map data"))
      .finally(() => setLoading(false));
  }, []);

  // Filter listings
  useEffect(() => {
    if (categoryFilter === "all") {
      setFiltered(listings);
    } else {
      setFiltered(listings.filter((l) => l.category === categoryFilter));
    }
  }, [categoryFilter, listings]);

  // Init map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || leafletMap.current) return;
    const L = window.L;

    leafletMap.current = L.map(mapRef.current, {
      center: [20.5937, 78.9629], // India center
      zoom: 5,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(leafletMap.current);
  }, [leafletReady]);

  // Draw markers
  useEffect(() => {
    if (!leafletReady || !leafletMap.current) return;
    const L = window.L;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    filtered.forEach((listing) => {
      if (!listing.location?.lat || !listing.location?.lng) return;

      const color = STATUS_COLOR[listing.status] || "#2E7D32";
      const emoji = CATEGORY_EMOJI[listing.category] || "🌿";

      const icon = L.divIcon({
        html: `
          <div style="
            width: 36px; height: 36px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            display: flex; align-items: center; justify-content: center;
          ">
            <span style="transform: rotate(45deg); font-size: 14px; display: block; margin-top: 2px;">${emoji}</span>
          </div>
        `,
        className: "",
        iconSize: [36, 36],
        iconAnchor: [18, 36],
      });

      const marker = L.marker([listing.location.lat, listing.location.lng], { icon })
        .addTo(leafletMap.current)
        .on("click", () => {
          setSelected(listing);
          leafletMap.current.setView([listing.location.lat, listing.location.lng], 14, { animate: true });
        });

      markersRef.current.push(marker);
    });

    // Fit bounds if markers exist
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      leafletMap.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [filtered, leafletReady]);

  const focusMarker = (listing) => {
    if (!leafletMap.current || !listing.location?.lat) return;
    leafletMap.current.setView([listing.location.lat, listing.location.lng], 15, { animate: true });
    setSelected(listing);
    setShowList(false);
  };

  const categories = ["all", ...new Set(listings.map((l) => l.category))];

  return (
    <div className="flex flex-col h-screen" style={{ height: "calc(100vh - 64px)" }}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-wrap z-10">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MapPin className="w-4 h-4 text-green-primary flex-shrink-0" />
          <h1 className="font-heading font-semibold text-gray-900">Food Map</h1>
          <span className="text-sm text-gray-400">·</span>
          <span className="text-sm text-gray-500">{filtered.length} listing{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                categoryFilter === c ? "bg-green-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-primary"
              }`}
            >
              {c === "all" ? "All" : `${CATEGORY_EMOJI[c]} ${c}`}
            </button>
          ))}
        </div>

        {/* List toggle */}
        <button
          onClick={() => setShowList(!showList)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showList ? "bg-green-primary text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
        >
          <List className="w-4 h-4" />
          <span className="hidden sm:inline">List</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Side list */}
        {showList && (
          <div className="w-72 bg-white border-r border-gray-100 overflow-y-auto flex-shrink-0 z-10">
            <div className="p-3 space-y-1.5">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No listings with location data</p>
              ) : (
                filtered.map((l) => (
                  <button
                    key={l._id}
                    onClick={() => focusMarker(l)}
                    className={`w-full text-left p-3 rounded-lg hover:bg-green-50 transition-colors border ${selected?._id === l._id ? "border-green-primary bg-green-50" : "border-transparent"}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-xl flex-shrink-0">{CATEGORY_EMOJI[l.category] || "🌿"}</span>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{l.foodName}</p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{l.location?.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${l.status === "active" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>{l.status}</span>
                          <span className="text-xs text-gray-400">{l.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="flex-1 relative">
          {(loading || !leafletReady) && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
              <div className="text-center">
                <Spinner size="lg" />
                <p className="text-sm text-gray-500 mt-3">Loading map...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" />

          {/* Legend */}
          <div className="absolute top-3 right-3 bg-white rounded-lg shadow-md p-3 z-[500]">
            <p className="text-xs font-semibold text-gray-700 mb-2">Legend</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR.active }} />
                <span className="text-xs text-gray-600">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLOR.claimed }} />
                <span className="text-xs text-gray-600">Claimed</span>
              </div>
            </div>
          </div>

          {/* Selected listing card */}
          {selected && (
            <ListingCard listing={selected} onClose={() => setSelected(null)} />
          )}

          {/* Empty state overlay */}
          {!loading && leafletReady && filtered.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-10 pointer-events-none">
              <div className="text-center bg-white rounded-xl p-6 shadow-md">
                <p className="text-3xl mb-2">📍</p>
                <p className="font-medium text-gray-700">No listings with location data</p>
                <p className="text-sm text-gray-400 mt-1">Listings appear here when donors add an address</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
