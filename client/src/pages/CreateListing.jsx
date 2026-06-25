import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../services/api";
import toast from "react-hot-toast";
import LocationInput from "../components/common/LocationInput";
import { Upload, X, ArrowLeft } from "lucide-react";

const CATEGORIES = ["cooked", "raw", "packaged", "fruits", "vegetables", "dairy", "bakery", "other"];

export default function CreateListing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [location, setLocation] = useState({ address: "", lat: null, lng: null });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: { category: "other" },
  });

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (i) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const onSubmit = async (data) => {
    if (!location.address) { toast.error("Please select a pickup location"); return; }
    if (!location.lat || !location.lng) { toast.error("Please pick an address from the dropdown — this enables map discovery"); return; }
    setLoading(true);

    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => formData.append(k, v));
    formData.append("address", location.address);
    if (location.lat) formData.append("lat", location.lat);
    if (location.lng) formData.append("lng", location.lng);
    images.forEach((img) => formData.append("images", img));

    try {
      await api.post("/listings", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Food listing created! 🌱");
      navigate("/listings");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  // Tomorrow as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="page-container py-8 max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-sub hover:text-gray-text mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-text">Donate Food 🌱</h1>
        <p className="text-gray-sub text-sm mt-1">Fill in the details below to create your food listing.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
        {/* Food Name */}
        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Food Name *</label>
          <input
            type="text"
            placeholder="e.g., Homemade Dal Rice"
            className={`input-field ${errors.foodName ? "border-red-error" : ""}`}
            {...register("foodName", { required: "Food name is required", maxLength: { value: 100, message: "Max 100 characters" } })}
          />
          {errors.foodName && <p className="error-text">{errors.foodName.message}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Description <span className="text-gray-400">(optional)</span></label>
          <textarea
            rows={3}
            placeholder="Describe the food, how it was prepared, allergies, etc."
            className="input-field resize-none"
            {...register("description", { maxLength: { value: 500, message: "Max 500 characters" } })}
          />
          {errors.description && <p className="error-text">{errors.description.message}</p>}
        </div>

        {/* Quantity + Category */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-text mb-1.5">Quantity *</label>
            <input
              type="text"
              placeholder="e.g., 5 kg, serves 10"
              className={`input-field ${errors.quantity ? "border-red-error" : ""}`}
              {...register("quantity", { required: "Quantity is required" })}
            />
            {errors.quantity && <p className="error-text">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-text mb-1.5">Category *</label>
            <select className="input-field" {...register("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Expiry Date *</label>
          <input
            type="date"
            min={minDate}
            className={`input-field ${errors.expiryDate ? "border-red-error" : ""}`}
            {...register("expiryDate", { required: "Expiry date is required" })}
          />
          {errors.expiryDate && <p className="error-text">{errors.expiryDate.message}</p>}
        </div>

        {/* Pickup Location */}
        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Pickup Location *</label>
          <LocationInput
            onSelect={(loc) => setLocation(loc)}
            onChange={(val) => setLocation((prev) => ({ ...prev, address: val }))}
            placeholder="Search your address..."
          />
          {!location.address && <p className="text-xs text-gray-400 mt-1">Start typing to search for your address</p>}
        </div>

        {/* Pickup Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Pickup Instructions <span className="text-gray-400">(optional)</span></label>
          <textarea
            rows={2}
            placeholder="e.g., Ring the doorbell, available between 5-7 PM"
            className="input-field resize-none"
            {...register("pickupInstructions")}
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Photos <span className="text-gray-400">(up to 3)</span></label>
          {previews.length > 0 && (
            <div className="flex gap-3 mb-3 flex-wrap">
              {previews.map((src, i) => (
                <div key={i} className="relative w-24 h-24">
                  <img src={src} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-error text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {previews.length < 3 && (
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-green-primary hover:bg-green-light/30 transition-colors">
              <Upload className="w-6 h-6 text-gray-400 mb-1.5" />
              <span className="text-sm text-gray-sub">Click to upload images</span>
              <span className="text-xs text-gray-400 mt-0.5">JPG, PNG, WebP — max 5MB each</span>
              <input type="file" accept="image/*" multiple onChange={handleImages} className="hidden" />
            </label>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? "Publishing..." : "Publish Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
