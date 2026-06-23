import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import StatCard from "../components/dashboard/StatCard";
import FoodCard from "../components/listings/FoodCard";
import Spinner from "../components/common/Spinner";
import { List, CheckCircle, Package, Globe, PlusCircle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentListings, setRecentListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, listingsRes] = await Promise.all([
          api.get("/listings/stats"),
          api.get("/listings?limit=4&status=active"),
        ]);
        setStats(statsRes.data.stats);
        setRecentListings(listingsRes.data.listings);

        if (user.role === "donor") {
          const myRes = await api.get("/listings/my");
          setMyListings(myRes.data.listings.slice(0, 4));
        }
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.role]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const isDonor = user.role === "donor";
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="page-container py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-text">
            {greeting()}, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-sub text-sm mt-1">
            {isDonor ? "Here's how your donations are making an impact." : "Find food listings near you and coordinate pickups."}
          </p>
        </div>
        {isDonor && (
          <Link to="/listings/create" className="btn-primary flex items-center gap-2 self-start">
            <PlusCircle className="w-4 h-4" /> Donate Food
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isDonor ? (
          <>
            <StatCard icon={List} label="Active Listings" value={stats?.activeListings} color="green" />
            <StatCard icon={Package} label="Total Donated" value={stats?.totalListings} color="blue" />
            <StatCard icon={CheckCircle} label="Completed" value={stats?.completedExchanges} color="purple" />
            <StatCard icon={Globe} label="Community Exchanges" value={stats?.communityExchanges} color="yellow" />
          </>
        ) : (
          <>
            <StatCard icon={Package} label="Items Claimed" value={stats?.claimedListings} color="green" />
            <StatCard icon={CheckCircle} label="Completed" value={stats?.completedExchanges} color="blue" />
            <StatCard icon={List} label="Available Now" value={stats?.availableListings} color="purple" />
            <StatCard icon={Globe} label="Community Exchanges" value={stats?.communityExchanges} color="yellow" />
          </>
        )}
      </div>

      {/* Donor: My Recent Listings */}
      {isDonor && myListings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">My Recent Listings</h2>
            <Link to="/listings/my" className="text-sm text-green-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {myListings.map((l) => <FoodCard key={l._id} listing={l} />)}
          </div>
        </section>
      )}

      {/* Recent Community Listings */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">
            {isDonor ? "Recent Community Listings" : "Available Food Near You"}
          </h2>
          <Link to="/listings" className="text-sm text-green-primary font-medium flex items-center gap-1 hover:gap-2 transition-all">
            Browse all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {recentListings.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🌱</p>
            <p className="font-medium text-gray-text">No listings yet</p>
            <p className="text-sm text-gray-sub mt-1">Be the first to donate food in your community!</p>
            {isDonor && (
              <Link to="/listings/create" className="btn-primary inline-flex mt-4 items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Create Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {recentListings.map((l) => <FoodCard key={l._id} listing={l} />)}
          </div>
        )}
      </section>
    </div>
  );
}
