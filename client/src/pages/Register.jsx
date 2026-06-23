import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Leaf, Eye, EyeOff, Mail, Lock, User, Phone, Leaf as LeafIcon } from "lucide-react";

const roles = [
  { value: "donor", label: "Donor", emoji: "🍱", desc: "I want to donate food" },
  { value: "ngo", label: "NGO", emoji: "🤝", desc: "We collect & distribute food" },
  { value: "individual", label: "Individual", emoji: "🙋", desc: "I'm looking for food" },
];

export default function Register() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();
  const role = watch("role");

  const selectRole = (value) => {
    setSelectedRole(value);
    setValue("role", value, { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await registerUser(data);
      toast.success("Account created! Welcome to GreenKart 🌱");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-green-primary rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-2xl text-green-primary">GreenKart</span>
          </Link>
          <h1 className="font-heading font-semibold text-2xl text-gray-text">Create your account</h1>
          <p className="text-gray-sub text-sm mt-1">Join the food waste reduction movement</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">I am a...</label>
              <div className="grid grid-cols-3 gap-3">
                {roles.map(({ value, label, emoji, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectRole(value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      selectedRole === value
                        ? "border-green-primary bg-green-light"
                        : "border-gray-200 hover:border-green-secondary"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{emoji}</span>
                    <span className="text-xs font-semibold text-gray-text block">{label}</span>
                    <span className="text-xs text-gray-sub">{desc}</span>
                  </button>
                ))}
              </div>
              <input type="hidden" {...register("role", { required: "Please select a role" })} />
              {errors.role && <p className="error-text">{errors.role.message}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-text mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Your name"
                  className={`input-field pl-9 ${errors.name ? "border-red-error" : ""}`}
                  {...register("name", { required: "Name is required", minLength: { value: 2, message: "Name too short" } })}
                />
              </div>
              {errors.name && <p className="error-text">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-text mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={`input-field pl-9 ${errors.email ? "border-red-error" : ""}`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
                  })}
                />
              </div>
              {errors.email && <p className="error-text">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-text mb-1.5">Phone <span className="text-gray-400">(optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="input-field pl-9"
                  {...register("phone")}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-text mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPwd ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  className={`input-field pl-9 pr-10 ${errors.password ? "border-red-error" : ""}`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-text"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-text">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-sub mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-green-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
