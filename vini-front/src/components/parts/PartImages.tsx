import { useState } from "react";
import type { PartImage } from "../../types";

interface Props {
  images: PartImage[];
}

const API_BASE = "http://localhost:8000";

export default function PartImages({ images }: Props) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-100 border border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-300">
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm">No images available</span>
      </div>
    );
  }

  const prev = () => setSelected((i) => (i - 1 + images.length) % images.length);
  const next = () => setSelected((i) => (i + 1) % images.length);

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-[4/3] bg-gray-100 border border-gray-200 overflow-hidden group">
        <img
          src={`${API_BASE}${images[selected].url}`}
          alt="Part"
          className="w-full h-full object-contain"
        />

        {/* Prev / Next arrows — only when multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center shadow transition-opacity opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white border border-gray-200 flex items-center justify-center shadow transition-opacity opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Counter */}
            <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5">
              {selected + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelected(i)}
              className={[
                "flex-shrink-0 w-16 h-16 border-2 overflow-hidden transition-colors",
                i === selected ? "border-blue-500" : "border-gray-200 hover:border-gray-400",
              ].join(" ")}
            >
              <img src={`${API_BASE}${img.url}`} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
