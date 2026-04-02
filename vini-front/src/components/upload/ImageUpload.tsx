import { useUploadStore } from "../../stores/uploadStore";

export default function ImageUpload() {
  const { imageFiles, addImage, removeImage } = useUploadStore();

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      addImage(files[i]);
    }
    e.target.value = "";
  };

  return (
    <section className="border border-gray-200 bg-white">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">Photos</h2>
      </div>
      <div className="px-5 py-4 space-y-4">
        {imageFiles.length < 5 && (
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 bg-gray-50 py-8 cursor-pointer hover:border-gray-400 hover:bg-white transition-colors group">
            <svg className="w-8 h-8 text-gray-300 group-hover:text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors">
              Click to add photos
            </span>
            <span className="text-xs text-gray-400">
              {imageFiles.length} / 5 added
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFiles}
              className="hidden"
            />
          </label>
        )}

        {imageFiles.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {imageFiles.map((file, i) => (
              <div key={i} className="relative w-24 h-24 border border-gray-200 bg-gray-50 group">
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-zinc-900 text-white text-xs w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
