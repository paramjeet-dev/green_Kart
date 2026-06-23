import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { User, Mail, Phone, MapPin, Edit2, Save, X } from "lucide-react";

const roleLabel = { donor: "🍱 Donor", ngo: "🤝 NGO", individual: "🙋 Individual" };

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: user?.name, phone: user?.phone, address: user?.address },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { data: res } = await api.put("/auth/profile", data);
      updateUser(res.user);
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    reset({ name: user?.name, phone: user?.phone, address: user?.address });
    setEditing(false);
  };

  return (
    <div className="page-container py-8 max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-gray-text mb-6">Profile</h1>

      <div className="card p-8 space-y-6">
        {/* Avatar + Role */}
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-green-light rounded-2xl flex items-center justify-center">
            <span className="font-heading font-bold text-3xl text-green-primary">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <h2 className="font-heading font-semibold text-xl text-gray-text">{user?.name}</h2>
            <span className="badge badge-active mt-1">{roleLabel[user?.role]}</span>
            <p className="text-xs text-gray-400 mt-1.5">Member since {new Date(user?.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-light rounded-xl p-4 text-center">
            <p className="font-heading font-bold text-2xl text-green-primary">{user?.totalDonations || 0}</p>
            <p className="text-sm text-gray-sub mt-0.5">Food Donated</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <p className="font-heading font-bold text-2xl text-blue-600">{user?.totalReceived || 0}</p>
            <p className="text-sm text-gray-sub mt-0.5">Food Received</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Profile Info */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Account Details</h3>
            {!editing && (
              <button onClick={() => setEditing(true)} className="btn-outline py-1.5 px-3 text-sm flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-text mb-1.5">Full Name</label>
                <input type="text" className={`input-field ${errors.name ? "border-red-error" : ""}`}
                  {...register("name", { required: "Name is required" })} />
                {errors.name && <p className="error-text">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-text mb-1.5">Phone</label>
                <input type="tel" className="input-field" placeholder="+91 98765 43210" {...register("phone")} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-text mb-1.5">Address</label>
                <input type="text" className="input-field" placeholder="Your address" {...register("address")} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={cancelEdit} className="btn-outline flex-1 flex items-center justify-center gap-2">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {[
                { icon: User, label: "Name", value: user?.name },
                { icon: Mail, label: "Email", value: user?.email },
                { icon: Phone, label: "Phone", value: user?.phone || "Not provided" },
                { icon: MapPin, label: "Address", value: user?.address || "Not provided" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-sub">{label}</p>
                    <p className="text-sm text-gray-text">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
