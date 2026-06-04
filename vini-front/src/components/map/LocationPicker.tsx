import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface LocationValue {
  latitude: number | null;
  longitude: number | null;
  address: string;
  city: string;
}

interface Props {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}

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

export default function LocationPicker({ value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const lastClickedLoc = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  function placeMarker(map: maplibregl.Map, lngLat: [number, number]) {
    if (markerRef.current) {
      markerRef.current.setLngLat(lngLat);
    } else {
      markerRef.current = new maplibregl.Marker({ color: "#dc2626" })
        .setLngLat(lngLat)
        .addTo(map);
    }
  }

  // Init map once
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: ALBANIA_CENTER,
      zoom: ALBANIA_ZOOM,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      placeMarker(map, [lng, lat]);
      lastClickedLoc.current = { lat, lng };
      onChangeRef.current({
        ...valueRef.current,
        latitude: lat,
        longitude: lng,
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync marker when lat/lng change from outside (initial load or "Use Shop Location")
  useEffect(() => {
    if (value.latitude === null || value.longitude === null) return;
    const map = mapRef.current;
    if (!map) return;

    const lc = lastClickedLoc.current;
    if (
      lc &&
      Math.abs(lc.lat - value.latitude) < 0.00001 &&
      Math.abs(lc.lng - value.longitude) < 0.00001
    ) {
      return;
    }

    const lngLat: [number, number] = [value.longitude, value.latitude];
    const doPlace = () => {
      placeMarker(map, lngLat);
      map.flyTo({ center: lngLat, zoom: 14 });
    };
    if (map.loaded()) doPlace();
    else map.once("load", doPlace);
  }, [value.latitude, value.longitude]);

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
        Location{" "}
        <span className="font-normal normal-case text-gray-400">(optional)</span>
      </label>

      {/* Map */}
      <div ref={containerRef} className="w-full h-64 border border-gray-200" />

      <p className="text-xs text-gray-400 mt-1">
        Kliko mbi hartë për të caktuar vendndodhjen e dyqanit.
      </p>

      {/* City and address inputs — always visible */}
      <div className="grid grid-cols-2 gap-4 mt-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Qyteti
          </label>
          <input
            type="text"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            className="border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:border-gray-400"
            placeholder="p.sh. Tiranë"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Adresa
          </label>
          <input
            type="text"
            value={value.address}
            onChange={(e) => onChange({ ...value, address: e.target.value })}
            className="border border-gray-200 px-3 py-2 text-sm w-full focus:outline-none focus:border-gray-400"
            placeholder="p.sh. Rruga e Durrësit"
          />
        </div>
      </div>
    </div>
  );
}
