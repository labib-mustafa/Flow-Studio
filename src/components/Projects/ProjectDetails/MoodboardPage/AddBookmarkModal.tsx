import React, { useState, useEffect } from 'react';
import { Globe, Link, ExternalLink, X } from 'lucide-react';
import { UrlMeta } from './MoodboardItem';

export interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBookmark: (urlMeta: UrlMeta) => void;
  initialUrl?: string;
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
  onAddBookmark,
  initialUrl = ''
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
      parseUrl(initialUrl);
    }
  }, [initialUrl]);

  if (!isOpen) return null;

  const parseUrl = (rawUrl: string) => {
    try {
      let formattedUrl = rawUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      const parsed = new URL(formattedUrl);
      const domain = parsed.hostname.replace('www.', '');
      const defaultTitle = domain.split('.')[0].toUpperCase() + ' - Web Link';
      
      if (!title) setTitle(defaultTitle);
      if (!description) setDescription(`Resource bookmarked from ${domain}`);
    } catch {
      // invalid URL string, skip
    }
  };

  const getDomain = (rawUrl: string) => {
    try {
      let formattedUrl = rawUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      return new URL(formattedUrl).hostname.replace('www.', '');
    } catch {
      return 'example.com';
    }
  };

  const domain = getDomain(url);
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    const urlMeta: UrlMeta = {
      url: finalUrl,
      domain,
      title: title || domain,
      description: description || `Link to ${domain}`,
      favicon: faviconUrl,
      thumbnail: thumbnail || undefined
    };

    onAddBookmark(urlMeta);
    setUrl('');
    setTitle('');
    setDescription('');
    setThumbnail('');
    onClose();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        parseUrl(text);
      }
    } catch {
      // Clipboard access restriction
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col no-pan no-pan-ui"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Globe size={18} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Add Web Link Bookmark</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* URL Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Web URL</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="https://example.com/resource"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    parseUrl(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                type="button"
                onClick={handlePaste}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors shrink-0"
              >
                Paste
              </button>
            </div>
          </div>

          {/* Live Card Preview */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Card Preview</label>
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={faviconUrl}
                    alt=""
                    className="w-4 h-4 rounded shrink-0 bg-slate-200"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {domain}
                  </span>
                </div>
                <ExternalLink size={14} className="text-slate-400" />
              </div>

              {thumbnail && (
                <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-200">
                  <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <input
                type="text"
                placeholder="Bookmark Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full font-bold text-slate-800 text-sm bg-transparent border-b border-transparent focus:border-slate-300 outline-none"
              />
              <textarea
                rows={2}
                placeholder="Description snippet..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs text-slate-500 bg-transparent border-b border-transparent focus:border-slate-300 outline-none resize-none"
              />
            </div>
          </div>

          {/* Optional Thumbnail Input */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500">Thumbnail Image URL (Optional)</label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-..."
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-primary"
            />
          </div>

          {/* Action Footer */}
          <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors disabled:opacity-50 shadow-xs"
            >
              Add Bookmark Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
