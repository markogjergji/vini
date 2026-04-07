import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Header from "./Header";
import AuthModal from "../auth/AuthModal";

type AuthMode = "login" | "register";

export default function Layout() {
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header onOpenAuth={setAuthMode} />
      {!isHome && (
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-1">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-zinc-500 hover:text-zinc-900 text-sm transition-colors group"
          >
            <ChevronLeft
              size={16}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back
          </button>
        </div>
      )}
      <main>
        <Outlet />
      </main>
      {authMode && (
        <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />
      )}
    </div>
  );
}
