import { useEffect, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { User as UserIcon, Store, List, ExternalLink, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import TextInput from "../components/ui/TextInput";
import { updateMe } from "../api/auth";
import { getMySeller, updateMySeller } from "../api/sellers";
import type { Seller, SellerUpdate } from "../types";
import LocationPicker, { type LocationValue } from "../components/map/LocationPicker";
import { isShopIncomplete } from "../components/seller/ShopSetupPrompt";

const roleLabel: Record<string, string> = {
  admin: "Administrator",
  seller: "Shitës",
  user: "Përdorues",
};

const roleBadge: Record<string, string> = {
  admin: "bg-blue-100 text-blue-700",
  seller: "bg-green-100 text-green-700",
  user: "bg-gray-100 text-gray-600",
};

type Tab = "profile" | "shop";

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
  const [searchParams, setSearchParams] = useSearchParams();

  const isSeller = user?.role === "seller" || user?.role === "admin";

  const [tab, setTab] = useState<Tab>(
    searchParams.get("tab") === "shop" && isSeller ? "shop" : "profile"
  );

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
        // Steer freshly promoted sellers straight to the shop setup.
        if (isShopIncomplete(s) && searchParams.get("tab") !== "profile") {
          setTab("shop");
        }
      })
      .catch(() => {})
      .finally(() => setSellerLoading(false));
  }, [isSeller]); // eslint-disable-line react-hooks/exhaustive-deps

  function selectTab(next: Tab) {
    setTab(next);
    setSearchParams(next === "shop" ? { tab: "shop" } : {}, { replace: true });
  }

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
      setUserError("Ndodhi një gabim gjatë ruajtjes.");
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
      setSellerError("Ndodhi një gabim gjatë ruajtjes së dyqanit.");
    } finally {
      setSellerSaving(false);
    }
  }

  function setShopField(field: keyof SellerUpdate, value: string | boolean) {
    setSellerForm((prev) => ({ ...prev, [field]: value }));
  }

  if (!user) return null;

  const needsSetup = seller ? isShopIncomplete(seller) : false;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border border-gray-100 bg-white rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 py-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-2xl font-bold text-white uppercase select-none shrink-0">
            {user.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-gray-900">{user.full_name}</h1>
              <span className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${roleBadge[user.role] ?? roleBadge.user}`}>
                {roleLabel[user.role] ?? user.role}
              </span>
              {isSeller && seller?.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded bg-green-100 text-green-700">
                  <CheckCircle2 size={12} /> I verifikuar
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">@{user.username}</p>
            <p className="text-xs text-gray-400 mt-1">
              Anëtar që nga{" "}
              {new Date(user.created_at).toLocaleDateString("sq-AL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {isSeller && (
          <div className="border-t border-gray-100 px-6 py-3 flex items-center gap-5">
            <Link
              to="/my-parts"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors no-underline"
            >
              <List size={15} /> Pjesët e Mia
            </Link>
            {seller && (
              <Link
                to={`/shop/${seller.id}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-500 transition-colors no-underline"
              >
                <ExternalLink size={15} /> Shiko Dyqanin Tim
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      {isSeller && (
        <div className="flex items-center gap-1 border-b border-gray-200">
          <TabButton
            active={tab === "profile"}
            onClick={() => selectTab("profile")}
            icon={<UserIcon size={15} />}
            label="Profili Im"
          />
          <TabButton
            active={tab === "shop"}
            onClick={() => selectTab("shop")}
            icon={<Store size={15} />}
            label="Dyqani Im"
            dot={needsSetup}
          />
        </div>
      )}

      {/* ── Profile tab ────────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <div className="border border-gray-100 bg-white rounded-lg px-6 py-6 shadow-sm">
          <SectionHeader label="Llogaria" title="Të dhënat e profilit" />
          <div className="space-y-4">
            <TextInput label="Emri i plotë" required value={fullName} onChange={setFullName} />

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
                Emri i përdoruesit
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
              <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2">
                Profili u përditësua.
              </p>
            )}

            <div className="pt-1">
              <button
                onClick={saveProfile}
                disabled={userSaving}
                className="bg-red-600 text-white px-5 py-2 text-sm font-semibold rounded hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {userSaving ? "Duke ruajtur…" : "Ruaj ndryshimet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Shop tab (seller only) ─────────────────────────────────────────── */}
      {isSeller && tab === "shop" && (
        <div className="border border-gray-100 bg-white rounded-lg px-6 py-6 shadow-sm">
          <SectionHeader label="Shitës" title="Të dhënat e dyqanit" />

          {sellerLoading ? (
            <p className="text-sm text-gray-400">Duke ngarkuar…</p>
          ) : seller ? (
            <div className="space-y-4">
              {needsSetup && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
                  <Store size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Mirë se erdhe si shitës!</p>
                    <p className="text-xs text-red-600/90 mt-0.5">
                      Plotëso të dhënat e dyqanit tënd — telefonin dhe vendndodhjen — që blerësit të të
                      gjejnë dhe të nisësh shitjen e pjesëve.
                    </p>
                  </div>
                </div>
              )}

              <TextInput
                label="Emri i dyqanit"
                required
                value={sellerForm.name ?? ""}
                onChange={(v) => setShopField("name", v)}
              />

              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  label="Telefon"
                  value={sellerForm.phone ?? ""}
                  onChange={(v) => setShopField("phone", v)}
                />
                <TextInput
                  label="Email kontakti"
                  optional
                  value={sellerForm.email ?? ""}
                  onChange={(v) => setShopField("email", v)}
                />
              </div>

              <TextInput
                label="Emri i biznesit"
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
                <span className="text-sm text-gray-700">Biznes i regjistruar</span>
              </label>

              {sellerError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{sellerError}</p>
              )}
              {sellerSuccess && (
                <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2">
                  Dyqani u përditësua.
                </p>
              )}

              <div className="pt-1">
                <button
                  onClick={saveShop}
                  disabled={sellerSaving}
                  className="bg-red-600 text-white px-5 py-2 text-sm font-semibold rounded hover:bg-red-500 transition-colors disabled:opacity-50"
                >
                  {sellerSaving ? "Duke ruajtur…" : "Ruaj dyqanin"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Nuk u gjet asnjë profil dyqani.</p>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
  dot?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active
          ? "border-red-600 text-red-600"
          : "border-transparent text-gray-500 hover:text-gray-900"
      }`}
    >
      {icon}
      {label}
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-red-600" />}
    </button>
  );
}
