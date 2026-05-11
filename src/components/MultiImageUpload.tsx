import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { XCircleIcon, CloudArrowUpIcon, ArrowPathIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { resizeImage } from '../utils/imageResizer';

interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  bucket: 'products' | 'banners';
}

export default function MultiImageUpload({ values, onChange, bucket }: MultiImageUploadProps) {
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingCount(files.length);
    const newUrls: string[] = [...values];

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image`);
          continue;
        }

        // 1. Resize Image (to 800x800 max)
        const resizedBlob = await resizeImage(file, 800, 800);
        
        const fileExt = 'jpg'; // We convert to jpeg in resizer
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = fileName;

        // 2. Upload to Supabase
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, resizedBlob, {
            contentType: 'image/jpeg'
          });

        if (uploadError) throw uploadError;

        // 3. Get Public URL
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        newUrls.push(data.publicUrl);
        setUploadingCount(prev => prev - 1);
      }
      
      onChange(newUrls);
      toast.success('Images uploaded and resized successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload one or more images');
    } finally {
      setUploadingCount(0);
    }
  };

  const removeImage = (index: number) => {
    const updated = values.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {values.map((url, index) => (
          <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
            <img src={url} alt="Product" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="p-1.5 bg-white text-red-500 rounded-lg hover:bg-red-50 transition-colors shadow-lg"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 shadow-sm">
              #{index + 1}
            </div>
          </div>
        ))}
        
        {uploadingCount > 0 ? (
          <div className="aspect-square rounded-2xl border-2 border-brand-primary border-dashed bg-brand-primary-light/5 flex flex-col items-center justify-center text-center p-4">
            <ArrowPathIcon className="w-8 h-8 text-brand-primary animate-spin mb-2" />
            <p className="text-[10px] font-bold text-brand-primary uppercase">Uploading {uploadingCount} items...</p>
          </div>
        ) : (
          <label className="aspect-square rounded-2xl border-2 border-slate-200 border-dashed bg-slate-50 hover:bg-white hover:border-brand-primary transition-all cursor-pointer flex flex-col items-center justify-center text-center p-4 group">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <CloudArrowUpIcon className="w-6 h-6 text-brand-primary" />
            </div>
            <p className="text-[10px] font-bold text-slate-900">Add Images</p>
            <p className="text-[8px] text-slate-500 font-bold mt-1 uppercase">Bulk Upload</p>
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              multiple 
              onChange={handleFilesChange}
            />
          </label>
        )}
      </div>
      
      {values.length === 0 && !uploadingCount && (
        <div className="py-10 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center">
          <PhotoIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-400">No images uploaded yet</p>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">Upload at least one image</p>
        </div>
      )}
    </div>
  );
}
