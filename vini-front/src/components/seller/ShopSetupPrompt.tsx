import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Store, X } from "lucide-react";
import { useAuthStore } from "../../stores/authStore";
import { getMySeller } from "../../api/sellers";
import type { Seller } from "../../types";

/** A freshly-promoted seller has no phone or map location yet. */
export function isShopIncomplete(s: Seller): boolean {
  return !s.phone || s.latitude == null || s.longitude == null;
}

/**
 * App-wide banner prompting a newly promoted seller to finish setting up
 * their shop profile. Hidden once the shop has the essentials, while on the
 * profile page itself, or after the user dismisses it for the session.
 */
export default function ShopSetupPrompt() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [seller, setSeller] = useState<Seller | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user?.role !== "seller") {
      setSeller(null);
      return;
    }
    let active = true;
    getMySeller()
      .then((s) => active && setSeller(s))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.role, user?.id]);

  if (user?.role !== "seller" || !seller) return null;
  if (!isShopIncomplete(seller) || dismissed) return null;
  if (location.pathname === "/profile") return null;

  return (
    <div className="bg-red-600 text-white">
      <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center gap-3 text-sm">
        <Store size={16} className="shrink-0" />
        <span className="flex-1 min-w-0">
          Mirë se erdhe si shitës! Plotëso profilin e dyqanit tënd që blerësit të të gjejnë.
        </span>
        <Link
          to="/profile?tab=shop"
          className="bg-white text-red-600 font-semibold px-3 py-1 rounded no-underline hover:bg-red-50 transition-colors shrink-0"
        >
          Plotëso Dyqanin
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Mbyll"
          className="shrink-0 hover:opacity-80 transition-opacity"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
