import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

interface Props {
  latitude: number;
  longitude: number;
  label?: string;
}

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

export default function LocationMap({ latitude, longitude, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [longitude, latitude],
      zoom: 13,
      scrollZoom: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const el = document.createElement("div");
    el.style.cssText = `
      width:14px;height:14px;background:#dc2626;border-radius:50%;
      border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);cursor:pointer;
    `;

    const popupHtml = label
      ? `<div style="font-family:system-ui,sans-serif;padding:2px 0">
           <div style="font-size:13px;font-weight:700;color:#111;line-height:1.3">${label}</div>
         </div>`
      : undefined;

    const popup = popupHtml
      ? new maplibregl.Popup({ offset: 12, closeButton: false }).setHTML(popupHtml)
      : undefined;

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([longitude, latitude]);

    if (popup) marker.setPopup(popup);

    marker.addTo(map);

    if (popup) marker.togglePopup();

    return () => map.remove();
  }, [latitude, longitude, label]);

  return <div ref={containerRef} className="w-full h-64" />;
}
