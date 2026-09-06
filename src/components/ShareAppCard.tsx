'use client';

import React, { useState } from 'react';
import { Share2, Check, Gift } from 'lucide-react';
import { shareApp } from '@/utils/share';

export default function ShareAppCard() {
  const [isShared, setIsShared] = useState(false);

  const handleShare = async () => {
    const success = await shareApp({
      title: 'Camp Gear Manager | キャンプギア軽量化・パッキング管理',
      text: '愛用しているキャンプギアの重量計算やパッキング管理アプリ「Camp Gear Manager」が便利！次のキャンプの荷造りに使ってみて⛺🎒',
    });

    if (success) {
      setIsShared(true);
      setTimeout(() => {
        setIsShared(false);
      }, 3000);
    }
  };

  return (
    <section className="bg-gradient-to-r from-[#27272A] via-[#1F1F23] to-[#27272A] border border-zinc-700/80 rounded-2xl p-4 sm:p-5 shadow-xl transition-all duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#FF5500]/15 border border-[#FF5500]/40 flex items-center justify-center text-lg shrink-0 mt-0.5">
            <Gift className="w-5 h-5 text-[#FF5500]" />
          </div>
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-[14px] sm:text-[15px] font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>キャンプ仲間にこのアプリを教える</span>
            </h3>
            <p className="text-[11px] sm:text-[12px] text-zinc-400 font-normal leading-relaxed">
              グループキャンプのギア重複防止や荷物軽量化に役立ちます。
            </p>
          </div>
        </div>

        <div className="shrink-0 self-stretch sm:self-auto flex items-center">
          <button
            type="button"
            onClick={handleShare}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 whitespace-nowrap ${
              isShared
                ? 'bg-emerald-600 text-white border border-emerald-500'
                : 'bg-[#FF5500] hover:bg-[#E04B00] text-white border border-[#FF5500]'
            }`}
          >
            {isShared ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>リンクをコピーしました！</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>友だちに紹介する</span>
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}