import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-green-bg flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Leaf className="w-9 h-9 text-white" />
        </div>
        <h1 className="font-heading font-bold text-6xl text-green-primary mb-3">404</h1>
        <h2 className="font-heading font-semibold text-xl text-gray-text mb-2">Page Not Found</h2>
        <p className="text-gray-sub mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn-primary inline-flex">Back to Home</Link>
      </div>
    </div>
  );
}
