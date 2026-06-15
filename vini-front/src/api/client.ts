import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8000",
});

client.interceptors.request.use((config) => {
  const raw = localStorage.getItem("vini-auth");
  if (raw) {
    try {
      const { state } = JSON.parse(raw);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch {
      // ignore
    }
  }
  return config;
});

// If an already-authenticated request is rejected (e.g. the account was
// deactivated mid-session), drop the stale session and send the user home.
// Login/register errors are handled by the AuthModal, so leave them alone.
client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";
    const isAuthEndpoint = url.includes("/api/auth/login") || url.includes("/api/auth/register");
    const hadToken = Boolean(error?.config?.headers?.Authorization);

    if (!isAuthEndpoint && hadToken && (status === 401 || status === 403)) {
      localStorage.removeItem("vini-auth");
      if (window.location.pathname !== "/") {
        window.location.assign("/");
      } else {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default client;
