import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { login, register } from "../../api/auth";
import { useAuthStore } from "../../stores/authStore";
import FormField from "../ui/FormField";

type Mode = "login" | "register";

interface Props {
  initialMode?: Mode;
  onClose: () => void;
}

// Same style as TextInput's inputCls
const inputCls =
  "border border-gray-200 bg-white px-3 py-2 text-sm w-full focus:outline-none focus:border-gray-400 transition-colors";

export default function AuthModal({ initialMode = "login", onClose }: Props) {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({
    email: "",
    username: "",
    full_name: "",
    password: "",
    confirm: "",
  });

  useEffect(() => {
    setMode(initialMode);
    setError(null);
  }, [initialMode]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(loginForm);
      setAuth(res.access_token, res.user);
      onClose();
      if (res.user.role === "admin") navigate("/admin");
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (regForm.password !== regForm.confirm) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await register({
        email: regForm.email,
        username: regForm.username,
        full_name: regForm.full_name,
        password: regForm.password,
      });
      setAuth(res.access_token, res.user);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        className="relative z-10 bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tab header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 border-b border-gray-100">
          <div className="flex gap-6">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`text-xs font-bold uppercase tracking-widest pb-4 border-b-2 transition-colors ${
                  mode === m
                    ? "text-gray-900 border-red-500"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form body */}
        <div className="px-6 py-6 space-y-4">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <FormField label="Username or Email" required>
                <input
                  type="text"
                  autoComplete="username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                  placeholder="your_username"
                  className={inputCls}
                />
              </FormField>

              <FormField label="Password" required>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  placeholder="••••••••"
                  className={inputCls}
                />
              </FormField>

              {error && (
                <p className="text-red-600 text-xs bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <FormField label="Full Name" required>
                <input
                  type="text"
                  value={regForm.full_name}
                  onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value })}
                  required
                  placeholder="John Doe"
                  className={inputCls}
                />
              </FormField>

              <FormField label="Email" required>
                <input
                  type="email"
                  autoComplete="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  required
                  placeholder="you@example.com"
                  className={inputCls}
                />
              </FormField>

              <FormField label="Username" required>
                <input
                  type="text"
                  autoComplete="username"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                  required
                  placeholder="your_username"
                  className={inputCls}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Password" required>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    required
                    minLength={8}
                    placeholder="Min 8 chars"
                    className={inputCls}
                  />
                </FormField>

                <FormField label="Confirm" required>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={regForm.confirm}
                    onChange={(e) => setRegForm({ ...regForm, confirm: e.target.value })}
                    required
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </FormField>
              </div>

              {error && (
                <p className="text-red-600 text-xs bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-widest py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
