import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import TextInput from "../components/ui/TextInput";
import { updateMe } from "../api/auth";
import { getMySeller, updateMySeller } from "../api/sellers";
import type { Seller, SellerUpdate } from "../types";
import LocationPicker, { type LocationValue } from "../components/map/LocationPicker";

const roleBadge: Record<string, string> = {
  admin: "bg-blue-100 text-blue-700",
  seller: "bg-green-100 text-green-700",
  user: "bg-gray-100 text-gray-600",
};

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-0.5">{label}</p>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
    </div>
  );
}

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState(false);

  const [seller, setSeller] = useState<Seller | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerForm, setSellerForm] = useState<SellerUpdate>({});
  const [sellerSaving, setSellerSaving] = useState(false);
  const [sellerError, setSellerError] = useState("");
  const [sellerSuccess, setSellerSuccess] = useState(false);

  const isSeller = user?.role === "seller" || user?.role === "admin";

  useEffect(() => {
    if (!isSeller) return;
    setSellerLoading(true);
    getMySeller()
      .then((s) => {
        setSeller(s);
        setSellerForm({
          name: s.name,
          phone: s.phone ?? "",
          email: s.email ?? "",
          business_name: s.business_name ?? "",
          address: s.address ?? "",
          city: s.city ?? "",
          latitude: s.latitude,
          longitude: s.longitude,
          is_business: s.is_business,
        });
      })
      .catch(() => {})
      .finally(() => setSellerLoading(false));
  }, [isSeller]);

  async function saveProfile() {
    if (!user || !token) return;
    setUserSaving(true);
    setUserError("");
    setUserSuccess(false);
    try {
      const updated = await updateMe({ full_name: fullName });
      setAuth(token, updated);
      setUserSuccess(true);
    } catch {
      setUserError("Failed to save changes.");
    } finally {
      setUserSaving(false);
    }
  }

  async function saveShop() {
    setSellerSaving(true);
    setSellerError("");
    setSellerSuccess(false);
    try {
      const updated = await updateMySeller(sellerForm);
      setSeller(updated);
      setSellerSuccess(true);
    } catch {
      setSellerError("Failed to save shop details.");
    } finally {
      setSellerSaving(false);
    }
  }

  function setShopField(field: keyof SellerUpdate, value: string | boolean) {
    setSellerForm((prev) => ({ ...prev, [field]: value }));
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border border-gray-100 bg-white">
        <div className="px-6 py-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-xl font-bold text-zinc-500 uppercase select-none shrink-0">
            {user.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">{user.full_name}</h1>
              <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 ${roleBadge[user.role] ?? roleBadge.user}`}>
                {user.role}
              </span>
              {isSeller && seller?.is_verified && (
                <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 bg-green-100 text-green-700">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">@{user.username}</p>
            <p className="text-xs text-gray-400 mt-1">
              Member since{" "}
              {new Date(user.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {isSeller && (
          <div className="border-t border-gray-100 px-6 py-3 flex items-center gap-4">
            <Link
              to="/my-parts"
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors no-underline"
            >
              My Listings
            </Link>
            {seller && (
              <Link
                to={`/shop/${seller.id}`}
                className="text-sm font-semibold text-red-600 hover:text-red-500 transition-colors no-underline"
              >
                View My Shop →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Account settings ───────────────────────────────────────────────── */}
      <div className="border border-gray-100 bg-white px-6 py-6">
        <SectionHeader label="Account" title="Profile Settings" />
        <div className="space-y-4">
          <TextInput
            label="Full Name"
            required
            value={fullName}
            onChange={setFullName}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Email
            </label>
            <input
              type="text"
              readOnly
              value={user.email}
              className="border border-gray-200 bg-gray-50 px-3 py-2 text-sm w-full text-gray-400 cursor-default focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              Username
            </label>
            <input
              type="text"
              readOnly
              value={user.username}
              className="border border-gray-200 bg-gray-50 px-3 py-2 text-sm w-full text-gray-400 cursor-default focus:outline-none"
            />
          </div>

          {userError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{userError}</p>
          )}
          {userSuccess && (
            <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2">Profile updated.</p>
          )}

          <div className="pt-1">
            <button
              onClick={saveProfile}
              disabled={userSaving}
              className="bg-red-600 text-white px-5 py-2 text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {userSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Shop settings (seller only) ────────────────────────────────────── */}
      {isSeller && (
        <div className="border border-gray-100 bg-white px-6 py-6">
          <SectionHeader label="Seller" title="Shop Settings" />

          {sellerLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : seller ? (
            <div className="space-y-4">
              <TextInput
                label="Shop Name"
                required
                value={sellerForm.name ?? ""}
                onChange={(v) => setShopField("name", v)}
              />

              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Phone"
                  optional
                  value={sellerForm.phone ?? ""}
                  onChange={(v) => setShopField("phone", v)}
                />
                <TextInput
                  label="Contact Email"
                  optional
                  value={sellerForm.email ?? ""}
                  onChange={(v) => setShopField("email", v)}
                />
              </div>

              <TextInput
                label="Business Name"
                optional
                value={sellerForm.business_name ?? ""}
                onChange={(v) => setShopField("business_name", v)}
              />

              <LocationPicker
                value={{
                  latitude: sellerForm.latitude ?? null,
                  longitude: sellerForm.longitude ?? null,
                  address: sellerForm.address ?? "",
                  city: sellerForm.city ?? "",
                }}
                onChange={(loc: LocationValue) =>
                  setSellerForm((prev) => ({
                    ...prev,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    address: loc.address,
                    city: loc.city,
                  }))
                }
              />

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sellerForm.is_business ?? false}
                  onChange={(e) => setShopField("is_business", e.target.checked)}
                  className="w-4 h-4 accent-red-600"
                />
                <span className="text-sm text-gray-700">Registered business</span>
              </label>

              {sellerError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{sellerError}</p>
              )}
              {sellerSuccess && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2">Shop updated.</p>
              )}

              <div className="pt-1">
                <button
                  onClick={saveShop}
                  disabled={sellerSaving}
                  className="bg-red-600 text-white px-5 py-2 text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {sellerSaving ? "Saving…" : "Save Shop"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No shop profile found.</p>
          )}
        </div>
      )}
    </div>
  );
}
