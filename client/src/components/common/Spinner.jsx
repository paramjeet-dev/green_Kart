import { Leaf } from "lucide-react";

export default function Spinner({ fullPage = false, size = "md" }) {
  const sizes = { sm: "w-4 h-4", md: "w-8 h-8", lg: "w-12 h-12" };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} border-4 border-green-light border-t-green-primary rounded-full animate-spin`} />
      {size === "lg" && <p className="text-sm text-gray-sub font-medium">Loading...</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-green-bg flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 bg-green-primary rounded-xl flex items-center justify-center mb-2">
          <Leaf className="w-7 h-7 text-white" />
        </div>
        {spinner}
      </div>
    );
  }

  return spinner;
}
