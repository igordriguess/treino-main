import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ src, alt, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-90 flex flex-col items-center justify-center bg-black/95 p-4 cursor-zoom-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-neutral-900/80 p-2 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
        aria-label="Fechar imagem"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        className="max-h-[85vh] max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="mt-3 text-sm font-semibold text-neutral-200">{alt}</p>
    </div>
  );
};
