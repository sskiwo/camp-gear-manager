'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

type Props = {
  campId?: string;
  isReadOnly?: boolean;
};

export default function ShareAppCard({ campId, isReadOnly = false }: Props) {
  const [copiedCamp, setCopiedCamp] = useState(false);

  const handleCopyCampUrl = async () => {
    if (!campId) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const campUrl = `${origin}/?camp=${campId}`;

    try {
      await navigator.clipboard.writeText(campUrl);
      setCopiedCamp(true);
      setTimeout(() => setCopiedCamp(false), 2500);
    } catch {
      prompt('以下の共有URLをコピーしてください:', campUrl);
    }
  };

  if (isReadOnly || !campId) return null;

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-2.5 shadow-md">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] sm:text-[13px] font-bold text-zinc-200 truncate">
          このキャンプを仲間に共有
        </p>
      </div>

      <button
        type="button"
        onClick={handleCopyCampUrl}
        className="shrink-0 h-8 px-2.5 sm:px-3 rounded-xl border border-[#FF5500] text-[#FF5500] hover:bg-[#FF5500]/10 text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
      >
        {copiedCamp ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
            <span className="text-emerald-400">コピー完了</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>閲覧専用URL</span>
          </>
        )}
      </button>
    </div>
  );
}