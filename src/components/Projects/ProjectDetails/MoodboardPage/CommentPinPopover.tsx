import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CommentPin } from './MoodboardItem';
import { CheckCircle2, Circle, Send, Trash2, X, MessageSquare } from 'lucide-react';

interface CommentPinPopoverProps {
  pin: CommentPin;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (pinId: string) => void;
  onReply: (pinId: string, text: string) => void;
  onDelete: (pinId: string) => void;
}

export const CommentPinPopover: React.FC<CommentPinPopoverProps> = ({
  pin,
  isOpen,
  onClose,
  onResolve,
  onReply,
  onDelete,
}) => {
  const [replyText, setReplyText] = useState('');

  if (!isOpen) return null;

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(pin.id, replyText.trim());
    setReplyText('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 5 }}
      className="absolute z-50 bg-white rounded-2xl shadow-2xl border border-slate-200 w-72 p-4 text-slate-800 no-pan no-pan-ui"
      style={{
        left: pin.x + 20,
        top: pin.y - 20,
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${pin.resolved ? 'bg-slate-400' : 'bg-blue-600'}`}>
            <MessageSquare size={12} />
          </div>
          <span className="text-xs font-bold text-slate-800">{pin.author || 'User'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onResolve(pin.id)}
            className={`p-1 rounded-md transition-colors ${pin.resolved ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
            title={pin.resolved ? 'Mark unresolved' : 'Mark resolved'}
          >
            {pin.resolved ? <CheckCircle2 size={16} /> : <Circle size={16} />}
          </button>
          <button
            onClick={() => onDelete(pin.id)}
            className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors"
            title="Delete comment"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-xs text-slate-700 leading-relaxed break-words">{pin.text}</p>
        <span className="text-[10px] text-slate-400 mt-1 block">
          {new Date(pin.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {pin.replies && pin.replies.length > 0 && (
        <div className="space-y-2 mb-3 max-h-32 overflow-y-auto pr-1">
          {pin.replies.map((reply) => (
            <div key={reply.id} className="bg-slate-50 p-2 rounded-xl text-xs">
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-semibold text-slate-700">{reply.author}</span>
                <span className="text-[9px] text-slate-400">
                  {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-slate-600 break-words">{reply.text}</p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSendReply} className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Reply..."
          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:border-blue-500 outline-none"
        />
        <button
          type="submit"
          disabled={!replyText.trim()}
          className="p-1.5 rounded-xl bg-blue-600 text-white disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
        >
          <Send size={12} />
        </button>
      </form>
    </motion.div>
  );
};
