/**
 * Video Download Button Component
 * 
 * Provides sample videos for judge testing from Cloudflare R2 storage
 */

import { Download, Video } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { SAMPLE_VIDEOS, type SampleVideo } from '@/config/sampleVideos';

interface VideoDownloadButtonProps {
  onVideoSelect?: (videoUrl: string) => void;
}

export default function VideoDownloadButton({ onVideoSelect }: VideoDownloadButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleDownload = async (video: SampleVideo) => {
    setDownloading(video.name);
    try {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = video.url;
      link.download = `${video.name.toLowerCase().replace(/\s+/g, '_')}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Optionally notify parent component
      if (onVideoSelect) {
        onVideoSelect(video.url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-elevated border border-surface-border text-slate-400 hover:border-cyan hover:text-cyan transition-colors"
      >
        <Video className="w-3 h-3" />
        Sample Videos
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-surface-bg border border-surface-border rounded-lg shadow-xl z-50">
          <div className="p-3 border-b border-surface-border">
            <p className="text-xs font-semibold text-white">Sample Videos for Testing</p>
            <p className="text-[10px] text-slate-500 mt-1">Download sample crowd footage for judge testing</p>
          </div>
          <div className="p-2 space-y-1">
            {SAMPLE_VIDEOS.map((video) => (
              <button
                key={video.name}
                onClick={() => handleDownload(video)}
                disabled={downloading === video.name}
                className="w-full text-left p-2 rounded hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white">{video.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{video.description}</p>
                  </div>
                  {downloading === video.name ? (
                    <div className="w-4 h-4 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                  )}
                </div>
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-surface-border">
            <p className="text-[9px] text-slate-600 text-center">
              Videos hosted on Cloudflare R2
            </p>
          </div>
        </div>
      )}
    </div>
  );
}