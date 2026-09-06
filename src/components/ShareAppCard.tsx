'use client';

import { useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';

type Props = {
  campId?: string;
  isReadOnly?: boolean;
};

export default function ShareAppCard({ campId, isReadOnly = false }: Props) {
  const [copiedCamp, setCopiedCamp] = useState(false);

  // 閲覧専用のキャンプ共有URLをコピー
  const handleCopyCampUrl = async () => {
    if (!campId) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const campUrl = `${origin}/?camp=${campId}`;

    try {
      await navigator.clipboard.writeText(campUrl);
      setCopiedCamp(true);
      setTimeout(() => setCopiedCamp(false), 2500);
    } catch {
      prompt('以下のキャンプ共有URLをコピーしてください:', campUrl);
    }
  };

  // 閲覧モード時やcampIdがない場合は表示しない
  if (isReadOnly || !campId) return null;

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl">
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
        <Share2 className="w-4 h-4 text-[#FF5500]" />
        <h3 className="text-sm font-bold text-white tracking-wide">
          このキャンプの装備リストを共有
        </h3>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#27272A]/40 border border-zinc-800 p-3 sm:p-4 rounded-xl">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-200">
            キャンプ仲間に閲覧専用URLを送る
          </p>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            相手には安全な「閲覧専用リンク」として送られます。リストの勝手な編集や削除を防げます。
          </p>
        </div>

        {/* 外枠だけオレンジ（ボーダー）のボタン */}
        <button
          type="button"
          onClick={handleCopyCampUrl}
          className="w-full sm:w-auto shrink-0 py-2 px-4 rounded-xl border-2 border-[#FF5500] text-[#FF5500] hover:bg-[#FF5500]/10 text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer"
        >
          {copiedCamp ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span className="text-emerald-400">共有URLをコピーしました！</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-[#FF5500]" />
              <span>共有URLをコピー</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}