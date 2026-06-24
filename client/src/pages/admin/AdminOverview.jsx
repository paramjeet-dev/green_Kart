import { useEffect, useState } from "react";
import api from "../../services/api";
import Spinner from "../../components/common/Spinner";
import { Users, List, CheckCircle, MessageSquare, TrendingUp, Package, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function StatCard({ icon: Icon, label, value, sub, color = "green" }) {
  const colors = {
    green: "bg-green-50 text-green-primary",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    yellow: "bg-yellow-50 text-yellow-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-heading font-bold text-gray-900">{value ?? "—"}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniBar({ data, valueKey, labelKeys, color = "#2E7D32" }) {
  if (!data?.length) return <p className="text-sm text-gray-400 py-4 text-center">No data yet</p>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="flex items-end gap-1.5 h-20">
      {data.map((d, i) => {
        const val = d[valueKey] || 0;
        const height = Math.max((val / max) * 100, 4);
        const month = MONTHS[(d._id?.month || 1) - 1];
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-gray-400">{val}</span>
            <div className="w-full rounded-t" style={{ height: `${height}%`, backgroundColor: color, minHeight: "4px" }} title={`${month}: ${val}`} />
            <span className="text-xs text-gray-400">{month}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/stats")
      .then(({ data }) => setStats(data.stats))
      .catch(() => toast.error("Failed to load admin stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!stats) return null;

  const { users, listings, messages, recentUsers, recentListings, monthlyListings, monthlyUsers } = stats;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-heading font-bold text-2xl text-gray-900">Platform Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Real-time GreenKart statistics</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={users.total} sub={`${users.donors} donors · ${users.ngos} NGOs`} color="blue" />
        <StatCard icon={List} label="Total Listings" value={listings.total} sub={`${listings.active} active`} color="green" />
        <StatCard icon={CheckCircle} label="Completed Exchanges" value={listings.completed} color="purple" />
        <StatCard icon={MessageSquare} label="Total Messages" value={messages.total} color="orange" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Active Listings" value={listings.active} color="green" />
        <StatCard icon={Clock} label="Claimed" value={listings.claimed} color="yellow" />
        <StatCard icon={AlertCircle} label="Expired" value={listings.expired} color="orange" />
        <StatCard icon={TrendingUp} label="Completion Rate" value={listings.total ? `${Math.round((listings.completed / listings.total) * 100)}%` : "0%"} color="purple" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-heading font-semibold text-gray-900 mb-4">Listings (Last 6 Months)</h3>
          <MiniBar data={monthlyListings} valueKey="total" color="#2E7D32" />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-heading font-semibold text-gray-900 mb-4">New Users (Last 6 Months)</h3>
          <MiniBar data={monthlyUsers} valueKey="count" color="#4CAF50" />
        </div>
      </div>

      {/* Role breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: "Donors", value: users.donors, total: users.total, color: "#2E7D32" },
          { label: "NGOs", value: users.ngos, total: users.total, color: "#4CAF50" },
          { label: "Individuals", value: users.individuals, total: users.total, color: "#FFC107" },
        ].map(({ label, value, total, color }) => {
          const pct = total ? Math.round((value / total) * 100) : 0;
          return (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm font-bold text-gray-900">{value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-heading font-semibold text-gray-900">Recent Users</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers?.map((u) => (
              <div key={u._id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-primary text-xs font-semibold">{u.name?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-primary capitalize">{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent listings */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-heading font-semibold text-gray-900">Recent Listings</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {recentListings?.map((l) => (
              <div key={l._id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{l.foodName}</p>
                  <p className="text-xs text-gray-400">by {l.donor?.name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  l.status === "active" ? "bg-green-50 text-green-primary" :
                  l.status === "completed" ? "bg-blue-50 text-blue-600" :
                  "bg-gray-100 text-gray-500"
                }`}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}