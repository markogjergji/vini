import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./mapTheme.css";
import { getAllSellers } from "../../api/sellers";
import type { Seller } from "../../types";

const ALBANIA_CENTER: [number, number] = [20.17, 41.15];
const ALBANIA_ZOOM = 7;

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://carto.com">CARTO</a> © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    },
  },
  layers: [{ id: "carto-tiles", type: "raster", source: "carto" }],
};

const FONT = `"LexendDeca", system-ui, sans-serif`;

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );
}

function buildPopupHtml(seller: Seller): string {
  const name = escapeHtml(seller.name);

  const verified = seller.is_verified
    ? `<span style="display:inline-flex;align-items:center;gap:3px;background:#dcfce7;color:#166534;font-size:9px;font-weight:700;padding:2px 6px;text-transform:uppercase;letter-spacing:.06em;border:1px solid #bbf7d0">✓ I verifikuar</span>`
    : "";

  const rows: string[] = [];
  if (seller.business_name && seller.business_name !== seller.name)
    rows.push(
      `<div style="font-size:12px;color:#374151">${escapeHtml(seller.business_name)}</div>`,
    );
  if (seller.city)
    rows.push(
      `<div style="font-size:12px;color:#6b7280">${escapeHtml(seller.city)}</div>`,
    );
  if (seller.phone)
    rows.push(
      `<div style="font-size:12px;color:#6b7280">${escapeHtml(seller.phone)}</div>`,
    );

  const metaHtml = rows.length
    ? `<div style="display:flex;flex-direction:column;gap:2px;margin-top:6px">${rows.join("")}</div>`
    : "";

  return `
    <div style="min-width:190px;max-width:230px;font-family:${FONT}">
      <div style="padding:12px 14px 10px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div style="font-size:14px;font-weight:700;color:#111827;line-height:1.3">${name}</div>
        </div>
        ${verified ? `<div style="margin-top:6px">${verified}</div>` : ""}
        ${metaHtml}
      </div>
      <button
        data-shop-id="${seller.id}"
        style="display:flex;align-items:center;justify-content:center;gap:6px;width:100%;background:#dc2626;color:#fff;border:none;border-top:1px solid #b91c1c;padding:9px 12px;font-family:${FONT};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;cursor:pointer"
        onmouseover="this.style.background='#ef4444'"
        onmouseout="this.style.background='#dc2626'"
      >
        Shiko dyqanin →
      </button>
    </div>
  `;
}

export default function ShopsMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllSellers()
      .then((all) => setSellers(all.filter((s) => s.latitude !== null && s.longitude !== null)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: ALBANIA_CENTER,
      zoom: ALBANIA_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add markers when both map and sellers are ready
  useEffect(() => {
    const map = mapRef.current;
    if (!map || sellers.length === 0) return;

    const popups: maplibregl.Popup[] = [];

    sellers.forEach((seller) => {
      if (seller.latitude === null || seller.longitude === null) return;
      const lngLat: [number, number] = [seller.longitude, seller.latitude];

      const el = document.createElement("div");
      el.style.cssText = `
        width:14px;height:14px;background:#dc2626;border-radius:50%;
        border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:pointer;
      `;

      const popup = new maplibregl.Popup({ offset: 12, closeButton: false })
        .setHTML(buildPopupHtml(seller));

      new maplibregl.Marker({ element: el })
        .setLngLat(lngLat)
        .setPopup(popup)
        .addTo(map);

      popups.push(popup);
    });

    return () => {
      popups.forEach((p) => p.remove());
    };
  }, [sellers]);

  // Delegate clicks on "View Shop" buttons inside popups
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    function handleClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement).closest("[data-shop-id]") as HTMLElement | null;
      if (btn) {
        const id = btn.dataset.shopId;
        if (id) navigate(`/shop/${id}`);
      }
    }
    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [navigate]);

  const located = sellers.length;

  return (
    <div className="border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-0.5">
            Harta
          </p>
          <h2 className="text-lg font-bold text-gray-900">Dyqanet në Shqipëri</h2>
          {!loading && located > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {located} {located === 1 ? "dyqan" : "dyqane"} me vendndodhje të shënuar
            </p>
          )}
        </div>

        <div className="relative">
          <div ref={containerRef} className="vini-map w-full border border-gray-200" style={{ height: 420 }} />
          {loading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="text-sm text-gray-400">Duke ngarkuar…</span>
            </div>
          )}
          {!loading && located === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-sm text-gray-400 bg-white px-4 py-2 border border-gray-100 shadow-sm">
                Asnjë dyqan nuk ka caktuar vendndodhjen ende.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
