import React, { useState, useRef } from 'react';
import { UserIcon } from '../icons'; // Assuming you have a default user icon

interface ImageUploaderProps {
  onImageUploaded: (file: File) => void;
  currentImageUrl?: string;
  label: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUploaded, currentImageUrl, label }) => {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageUploaded(file);
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <label className="block text-sm font-medium text-dark-text">{label}</label>
      <div className="mt-2 flex items-center space-x-4">
        <div className="flex-shrink-0 h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {preview ? (
            <img src={preview} alt="Profile preview" className="h-full w-full object-cover" />
          ) : (
            <UserIcon className="h-12 w-12 text-gray-400" />
          )}
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/gif"
        />
        <button
          type="button"
          onClick={handleSelectFile}
          className="px-4 py-2 text-sm font-semibold bg-white border border-gray-300 rounded-md shadow-sm text-dark-text hover:bg-gray-50"
        >
          Change
        </button>
      </div>
    </div>
  );
};

export default ImageUploader;
