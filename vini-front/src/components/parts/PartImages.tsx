import { useState } from "react";
import type { PartImage } from "../../types";

interface Props {
  images: PartImage[];
}

const API_BASE = "http://localhost:8000";

export default function PartImages({ images }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
        No images
      </div>
    );
  }

  return (
    <div>
      <div className="w-full h-64 bg-gray-100 border border-gray-200">
        <img
          src={`${API_BASE}${images[selectedIndex].url}`}
          alt="Part"
          className="w-full h-full object-contain"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 mt-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setSelectedIndex(i)}
              className={`w-16 h-16 border ${i === selectedIndex ? "border-blue-600" : "border-gray-200"}`}
            >
              <img src={`${API_BASE}${img.url}`} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
