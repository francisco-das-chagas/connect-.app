'use client';

import { useRef, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';

interface ImageUploaderProps {
  sponsorId: string;
  type: 'logo' | 'banner';
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}

const CONFIG = {
  logo: {
    maxSize: 2 * 1024 * 1024, // 2MB
    label: 'Logo',
    placeholder: 'Upload do logo (max 2MB)',
    previewClass: 'w-24 h-24 rounded-2xl',
    aspectHint: 'Recomendado: quadrado (1:1)',
  },
  banner: {
    maxSize: 5 * 1024 * 1024, // 5MB
    label: 'Banner',
    placeholder: 'Upload do banner (max 5MB)',
    previewClass: 'w-full h-28 rounded-2xl',
    aspectHint: 'Recomendado: 3:1 (ex: 900x300px)',
  },
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Map MIME types to valid extensions for cross-validation
const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

export function ImageUploader({ sponsorId, type, currentUrl, onUploaded }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = CONFIG[type];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate MIME type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato invalido. Use JPEG, PNG ou WebP.');
      return;
    }

    // Cross-validate extension vs MIME type
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExtensions = MIME_TO_EXTENSIONS[file.type] || [];
    if (!validExtensions.includes(ext)) {
      setError(`Extensao do arquivo (.${ext}) nao corresponde ao tipo (${file.type}). Renomeie ou use outro arquivo.`);
      return;
    }

    // Validate size
    if (file.size > config.maxSize) {
      const maxMB = config.maxSize / (1024 * 1024);
      setError(`Arquivo muito grande. Maximo: ${maxMB}MB.`);
      return;
    }

    setUploading(true);

    try {
      const supabase = createSupabaseBrowser();
      const fileName = `${sponsorId}/${type}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('sponsor-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        setError('Erro no upload. Tente novamente.');
        console.error('Upload error:', uploadError);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('sponsor-assets')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onUploaded(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Erro inesperado no upload.');
    } finally {
      setUploading(false);
      // Reset input so same file can be selected again
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-silver/60 mb-2">{config.label}</label>

      {/* Preview */}
      <div className="mb-3">
        {previewUrl ? (
          <div className={`${config.previewClass} overflow-hidden bg-white/5 border border-white/10`}>
            <img
              src={previewUrl}
              alt={config.label}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`${config.previewClass} bg-white/5 border border-dashed border-white/20 flex items-center justify-center`}>
            <span className="text-silver/30 text-xs">{config.aspectHint}</span>
          </div>
        )}
      </div>

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-silver/70 text-xs font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <>
            <div className="w-4 h-4 border-2 border-silver/30 border-t-silver rounded-full animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            {previewUrl ? 'Alterar imagem' : config.placeholder}
          </>
        )}
      </button>

      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
