'use client';

import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink } from 'lucide-react';

type Props = {
  campId?: string;
  isReadOnly?: boolean;
};

export default function ShareAppCard({ campId, isReadOnly = false }: Props) {
  const [copiedApp, setCopiedApp] = useState(false);
  const [copiedCamp, setCopiedCamp] = useState(false);

  // 1. このキャンプの閲覧共有リンクをコピー
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

  // 2. アプリ全体のトップURLをコピー
  const handleCopyAppUrl = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const appUrl = `${origin}/`;

    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedApp(true);
      setTimeout(() => setCopiedApp(false), 2500);
    } catch {
      prompt('以下のアプリURLをコピーしてください:', appUrl);
    }
  };

  // 3. X（旧Twitter）でアプリをシェア
  const handleShareX = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = encodeURIComponent(
      'キャンプの荷物重量・パッキング・ギア管理をスマートに！「Camp Gear Manager」を使っています⛺🎒\n#キャンプ #キャンプギア #ULキャンプ #パッキング'
    );
    const url = encodeURIComponent(`${origin}/`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xl">
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
        <Share2 className="w-4 h-4 text-[#FF5500]" />
        <h3 className="text-sm font-bold text-white tracking-wide">
          キャンプ仲間に教える・共有する
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* このキャンプの装備リスト共有（オーナー時のみ表示） */}
        {!isReadOnly && campId && (
          <div className="bg-[#27272A]/40 border border-[#FF5500]/30 rounded-xl p-3 flex flex-col justify-between gap-2.5">
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>⛺</span>
                <span>このキャンプの装備リストを共有</span>
              </p>
              <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                仲間には安全な「閲覧専用リンク」として送られます。勝手に編集・削除される心配はありません。
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyCampUrl}
              className="w-full py-2 px-3 rounded-lg bg-[#FF5500] hover:bg-[#e04c00] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              {copiedCamp ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                  <span>共有URLをコピーしました！</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>このキャンプの共有URLをコピー</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* アプリそのものを教える */}
        <div className="bg-[#27272A]/40 border border-zinc-700/60 rounded-xl p-3 flex flex-col justify-between gap-2.5">
          <div>
            <p className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>🎒</span>
              <span>アプリを紹介する</span>
            </p>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              登録不要で使えるパッキング＆重量管理ツールとして、仲間に紹介できます。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAppUrl}
              className="flex-1 py-2 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
            >
              {copiedApp ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-400">アプリURLコピー済</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span>アプリURLをコピー</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleShareX}
              className="py-2 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm active:scale-95 cursor-pointer shrink-0"
              title="Xでポスト"
            >
              <span>𝕏</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}