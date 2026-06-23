import { Link } from "react-router-dom";
import { Leaf, MapPin, MessageSquare, BarChart3, ArrowRight, Recycle, Users, Heart } from "lucide-react";

const features = [
  { icon: Leaf, title: "List Surplus Food", desc: "Quickly post food donations with photos, quantity, and pickup details.", color: "bg-green-light text-green-primary" },
  { icon: MapPin, title: "Discover Nearby", desc: "Find available food listings close to you with location-aware search.", color: "bg-blue-100 text-blue-600" },
  { icon: MessageSquare, title: "Real-Time Chat", desc: "Coordinate pickups instantly with donors and recipients via live messaging.", color: "bg-purple-100 text-purple-600" },
  { icon: BarChart3, title: "Track Impact", desc: "See your contribution — food saved, exchanges completed, community impact.", color: "bg-yellow-100 text-yellow-600" },
];

const stats = [
  { icon: Recycle, value: "10K+", label: "Meals Saved" },
  { icon: Users, value: "2K+", label: "Community Members" },
  { icon: Heart, value: "500+", label: "NGOs Partnered" },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-green-bg font-body">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="page-container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-green-primary">GreenKart</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-outline text-sm py-2 px-4">Login</Link>
            <Link to="/register" className="btn-primary text-sm py-2 px-4">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="page-container py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-light text-green-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <Leaf className="w-4 h-4" />
          Reducing Food Waste Together
        </div>
        <h1 className="font-heading font-bold text-4xl md:text-6xl text-gray-text mb-6 leading-tight">
          Don't Waste Food.<br />
          <span className="text-green-primary">Feed Communities.</span>
        </h1>
        <p className="text-gray-sub text-lg md:text-xl max-w-2xl mx-auto mb-10">
          GreenKart connects food donors, NGOs, and individuals to redistribute surplus food before it goes to waste. List it, discover it, coordinate it — all in real time.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register" className="btn-primary flex items-center justify-center gap-2 text-base py-3 px-7">
            Join GreenKart <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="btn-outline flex items-center justify-center gap-2 text-base py-3 px-7">
            Browse Listings
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-green-primary py-12">
        <div className="page-container grid grid-cols-3 gap-6 text-center text-white">
          {stats.map(({ icon: Icon, value, label }) => (
            <div key={label}>
              <Icon className="w-7 h-7 mx-auto mb-2 opacity-80" />
              <p className="font-heading font-bold text-3xl">{value}</p>
              <p className="text-sm opacity-80 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="page-container py-20">
        <h2 className="font-heading font-bold text-3xl text-gray-text text-center mb-3">How It Works</h2>
        <p className="text-gray-sub text-center mb-12 max-w-xl mx-auto">A simple, powerful platform built for donors, NGOs, and individuals who want to make a difference.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="card p-6 text-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-semibold text-gray-text mb-2">{title}</h3>
              <p className="text-sm text-gray-sub">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-light py-16">
        <div className="page-container text-center">
          <h2 className="font-heading font-bold text-3xl text-green-primary mb-4">Ready to Make a Difference?</h2>
          <p className="text-gray-sub mb-8 max-w-lg mx-auto">Join thousands of donors, NGOs, and community members already reducing food waste on GreenKart.</p>
          <Link to="/register" className="btn-primary text-base py-3 px-8 inline-flex items-center gap-2">
            Start Donating Today <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-6 text-center text-sm text-gray-sub">
        © {new Date().getFullYear()} GreenKart — Built to reduce food waste 🌱
      </footer>
    </div>
  );
}
