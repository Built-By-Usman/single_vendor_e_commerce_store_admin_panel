import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { XCircleIcon, CloudArrowUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { resizeImage } from '../utils/imageResizer';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  bucket: 'products' | 'banners';
  label?: string;
}

export default function ImageUpload({ value, onChange, bucket, label = "Upload Image" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (e.g., 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      // 1. Resize Image (to 1000x1000 max for banners/categories)
      const resizedBlob = await resizeImage(file, 1000, 1000);

      const fileExt = 'jpg';
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, resizedBlob, {
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      onChange(data.publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-slate-500 mb-1.5 block">{label}</label>
      
      {value ? (
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 group bg-slate-50">
          <img src={value} alt="Preview" className="w-full h-full object-contain" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              type="button"
              onClick={removeImage}
              className="p-2 bg-white text-red-500 rounded-xl hover:bg-red-50 transition-colors shadow-xl"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      ) : (
        <label className={`
          relative flex flex-col items-center justify-center w-full aspect-video 
          rounded-2xl border-2 border-dashed transition-all cursor-pointer
          ${isUploading ? 'bg-slate-50 border-brand-primary' : 'bg-slate-50 border-slate-200 hover:border-brand-primary hover:bg-brand-primary-light/5'}
        `}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
            {isUploading ? (
              <>
                <ArrowPathIcon className="w-10 h-10 text-brand-primary animate-spin mb-3" />
                <p className="text-sm font-bold text-brand-primary">Uploading your image...</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">Almost there</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <CloudArrowUpIcon className="w-6 h-6 text-brand-primary" />
                </div>
                <p className="text-sm font-bold text-slate-900">Click to upload or drag and drop</p>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-wider">PNG, JPG or WebP (MAX. 2MB)</p>
              </>
            )}
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
