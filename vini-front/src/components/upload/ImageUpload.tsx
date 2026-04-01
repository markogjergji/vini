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
    <div>
      <label className="block text-sm mb-2 font-medium">Photos (max 5)</label>
      {imageFiles.length < 5 && (
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="text-sm"
        />
      )}
      {imageFiles.length > 0 && (
        <div className="flex gap-2 mt-2">
          {imageFiles.map((file, i) => (
            <div key={i} className="relative w-20 h-20 border border-gray-200">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 bg-red-600 text-white text-xs w-4 h-4 flex items-center justify-center"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
