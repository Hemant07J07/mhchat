"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useChatStore } from "@/lib/store";
import { ArrowLeft, Save, Mail, User as UserIcon, Shield, LogOut } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const { user, setUser } = useChatStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
  });

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Initialize user from localStorage if not in store
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");
      if (storedUser && !user) {
        setUser(storedUser);
      }
    } catch {}

    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log("Fetching profile...");
      const response = await api.profile.get();
      console.log("Profile response:", response.data);
      setProfile(response.data);
      setFormData({
        username: response.data.user?.username || "",
        email: response.data.user?.email || "",
        first_name: response.data.user?.first_name || "",
        last_name: response.data.user?.last_name || "",
      });
      setError(null);
    } catch (err: any) {
      console.error("Profile fetch error:", err);
      setError(err.response?.data?.detail || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setUpdating(true);

    try {
      await api.profile.update({
        first_name: formData.first_name,
        last_name: formData.last_name,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!mounted) return null;

  if (loading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const currentUser = user || profile?.user;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            Profile updated successfully!
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="md:col-span-1">
              {/* Profile Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserIcon size={40} className="text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {formData.first_name && formData.last_name
                    ? `${formData.first_name} ${formData.last_name}`
                    : formData.username || "User"}
                </h2>
                <p className="text-sm text-gray-600 mb-4">{formData.email}</p>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3">Member since 2026</p>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>

              {/* Security Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Shield size={20} className="text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Security</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Keep your account secure by using a strong password and enabling two-factor authentication.
                </p>
                <button className="w-full px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition text-sm font-medium">
                  Change Password
                </button>
              </div>
            </div>

            {/* Main Form */}
            <div className="md:col-span-2">
              <form onSubmit={handleUpdate} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h3>

                  {/* Email (Read-only) */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail size={16} className="inline mr-2" />
                      Email Address (Read-only)
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed placeholder-gray-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Contact support to change your email address
                    </p>
                  </div>

                  {/* Username (Read-only) */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <UserIcon size={16} className="inline mr-2" />
                      Username (Read-only)
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed placeholder-gray-400"
                    />
                  </div>

                  {/* First Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      placeholder="John"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      placeholder="Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-900 placeholder-gray-400"
                    />
                  </div>

                  {/* Preferences */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Preferences</h4>
                    
                    <label className="flex items-center gap-3 mb-4">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-500 rounded" />
                      <span className="text-sm text-gray-700">Receive email notifications about messages</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-indigo-500 rounded" />
                      <span className="text-sm text-gray-700">Allow data processing for AI model improvement</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition disabled:opacity-50"
                  >
                    <Save size={18} />
                    {updating ? "Saving..." : "Save Changes"}
                  </button>
                  <Link href="/" className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition">
                    Cancel
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
