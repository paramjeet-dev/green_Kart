import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Menu, X, Leaf, Bell, MessageSquare, LogOut, User, LayoutDashboard, List, PlusCircle } from "lucide-react";

const roleLabel = { donor: "Donor", ngo: "NGO", individual: "Individual" };

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/listings", label: "Browse", icon: List },
    { to: "/messages", label: "Messages", icon: MessageSquare },
  ];

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-primary rounded-lg flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl text-green-primary">GreenKart</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? "bg-green-light text-green-primary" : "text-gray-sub hover:text-gray-text hover:bg-gray-50"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
            {user?.role === "donor" && (
              <Link to="/listings/create" className="btn-primary flex items-center gap-1.5 ml-2">
                <PlusCircle className="w-4 h-4" />
                Donate Food
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-light rounded-full flex items-center justify-center">
                  <span className="text-green-primary font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-medium text-gray-text leading-none">{user?.name}</p>
                  <p className="text-xs text-gray-sub mt-0.5">{roleLabel[user?.role]}</p>
                </div>
              </button>

              {dropOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-text hover:bg-gray-50"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-error hover:bg-red-50 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden py-3 border-t border-gray-100">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? "bg-green-light text-green-primary" : "text-gray-sub"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
            {user?.role === "donor" && (
              <Link to="/listings/create" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-green-primary">
                <PlusCircle className="w-4 h-4" /> Donate Food
              </Link>
            )}
            <hr className="my-2 border-gray-100" />
            <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-sub">
              <User className="w-4 h-4" /> Profile
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 text-sm text-red-error w-full">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
