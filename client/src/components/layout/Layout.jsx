import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-green-bg flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-100 py-4 text-center text-xs text-gray-sub">
        © {new Date().getFullYear()} GreenKart — Reducing food waste, one meal at a time 🌱
      </footer>
    </div>
  );
}
