import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../services/api";
import toast from "react-hot-toast";
import LocationInput from "../components/common/LocationInput";
import Spinner from "../components/common/Spinner";
import { ArrowLeft } from "lucide-react";

const CATEGORIES = ["cooked", "raw", "packaged", "fruits", "vegetables", "dairy", "bakery", "other"];

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [location, setLocation] = useState({ address: "", lat: null, lng: null });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    api.get(`/listings/${id}`)
      .then(({ data }) => {
        const l = data.listing;
        reset({
          foodName: l.foodName,
          description: l.description,
          quantity: l.quantity,
          category: l.category,
          expiryDate: l.expiryDate?.split("T")[0],
          pickupInstructions: l.pickupInstructions,
        });
        setLocation({ address: l.location?.address || "", lat: l.location?.lat, lng: l.location?.lng });
      })
      .catch(() => toast.error("Failed to load listing"))
      .finally(() => setFetching(false));
  }, [id, reset]);

  const onSubmit = async (data) => {
    if (!location.address) { toast.error("Please select a pickup location"); return; }
    setLoading(true);
    try {
      await api.put(`/listings/${id}`, { ...data, address: location.address, lat: location.lat, lng: location.lng });
      toast.success("Listing updated!");
      navigate(`/listings/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update listing");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="page-container py-8 max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-sub hover:text-gray-text mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-text">Edit Listing</h1>
        <p className="text-gray-sub text-sm mt-1">Update your food listing details.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Food Name *</label>
          <input type="text" className={`input-field ${errors.foodName ? "border-red-error" : ""}`}
            {...register("foodName", { required: "Food name is required" })} />
          {errors.foodName && <p className="error-text">{errors.foodName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Description</label>
          <textarea rows={3} className="input-field resize-none" {...register("description")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-text mb-1.5">Quantity *</label>
            <input type="text" className={`input-field ${errors.quantity ? "border-red-error" : ""}`}
              {...register("quantity", { required: "Quantity is required" })} />
            {errors.quantity && <p className="error-text">{errors.quantity.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-text mb-1.5">Category</label>
            <select className="input-field" {...register("category")}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Expiry Date *</label>
          <input type="date" min={minDate} className={`input-field ${errors.expiryDate ? "border-red-error" : ""}`}
            {...register("expiryDate", { required: "Expiry date is required" })} />
          {errors.expiryDate && <p className="error-text">{errors.expiryDate.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Pickup Location *</label>
          <LocationInput
            value={location.address}
            onSelect={(loc) => setLocation(loc)}
            onChange={(val) => setLocation((prev) => ({ ...prev, address: val }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-text mb-1.5">Pickup Instructions</label>
          <textarea rows={2} className="input-field resize-none" {...register("pickupInstructions")} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => navigate(-1)} className="btn-outline flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
