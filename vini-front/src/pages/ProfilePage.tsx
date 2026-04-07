import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import FormSection from "../components/ui/FormSection";
import TextInput from "../components/ui/TextInput";
import { updateMe } from "../api/auth";
import { getMySeller, updateMySeller } from "../api/sellers";
import type { Seller, SellerUpdate } from "../types";

const roleBadge: Record<string, string> = {
  admin: "bg-blue-100 text-blue-700",
  seller: "bg-green-100 text-green-700",
  user: "bg-gray-100 text-gray-600",
};

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();

  const [activeSection, setActiveSection] = useState<null | "profile" | "shop">(null);

  // ── User profile state ────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState(false);

  // ── Seller state ──────────────────────────────────────────────────────────
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

  function toggle(section: "profile" | "shop") {
    setActiveSection((prev) => (prev === section ? null : section));
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">

      {/* ── Overview card ─────────────────────────────────────────────────── */}
      <div className="border border-gray-100 bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-zinc-200 flex items-center justify-center text-lg font-bold text-zinc-600 uppercase select-none shrink-0">
            {user.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate">{user.full_name}</p>
            <p className="text-sm text-gray-400">@{user.username}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Member since{" "}
              {new Date(user.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <span
            className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 shrink-0 ${roleBadge[user.role] ?? roleBadge.user}`}
          >
            {user.role}
          </span>
        </div>

        {isSeller && seller?.is_verified && (
          <p className="mt-4 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2">
            Verified seller
          </p>
        )}

        {/* ── Quick actions ────────────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={() => toggle("profile")}
            className={`px-4 py-2.5 text-sm font-semibold border transition-colors ${
              activeSection === "profile"
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
            }`}
          >
            {activeSection === "profile" ? "Close" : "Edit Profile"}
          </button>

          {isSeller && (
            <button
              onClick={() => toggle("shop")}
              className={`px-4 py-2.5 text-sm font-semibold border transition-colors ${
                activeSection === "shop"
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
              }`}
            >
              {activeSection === "shop" ? "Close" : "Shop Settings"}
            </button>
          )}

          {isSeller && (
            <Link
              to="/my-parts"
              className="px-4 py-2.5 text-sm font-semibold border border-gray-200 text-gray-700 hover:border-gray-400 transition-colors text-center no-underline"
            >
              My Parts
            </Link>
          )}

          {isSeller && seller && (
            <Link
              to={`/shop/${seller.id}`}
              className="px-4 py-2.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors text-center no-underline"
            >
              View My Shop
            </Link>
          )}
        </div>
      </div>

      {/* ── Edit Profile (collapsible) ─────────────────────────────────────── */}
      {activeSection === "profile" && (
        <FormSection title="Edit Profile">
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

          <button
            onClick={saveProfile}
            disabled={userSaving}
            className="bg-red-600 text-white px-5 py-2 text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            {userSaving ? "Saving…" : "Save Profile"}
          </button>
        </FormSection>
      )}

      {/* ── Shop Settings (collapsible, seller only) ───────────────────────── */}
      {activeSection === "shop" && isSeller && (
        <FormSection title="Shop Settings">
          {sellerLoading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : seller ? (
            <>
              <TextInput
                label="Shop Name"
                required
                value={sellerForm.name ?? ""}
                onChange={(v) => setShopField("name", v)}
              />
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
              <TextInput
                label="Business Name"
                optional
                value={sellerForm.business_name ?? ""}
                onChange={(v) => setShopField("business_name", v)}
              />
              <TextInput
                label="Address"
                optional
                value={sellerForm.address ?? ""}
                onChange={(v) => setShopField("address", v)}
              />
              <TextInput
                label="City"
                optional
                value={sellerForm.city ?? ""}
                onChange={(v) => setShopField("city", v)}
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

              <button
                onClick={saveShop}
                disabled={sellerSaving}
                className="bg-red-600 text-white px-5 py-2 text-sm font-semibold hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {sellerSaving ? "Saving…" : "Save Shop"}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-400">No shop profile found.</p>
          )}
        </FormSection>
      )}
    </div>
  );
}
