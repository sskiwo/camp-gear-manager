'use client';

import React from 'react';
import { X, Camera, Scale, Layers, Share2, Sparkles } from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const STORAGE_KEY_GUIDE_SEEN = 'cgm_has_seen_guide_v1';

export default function HelpGuideModal({ isOpen, onClose }: HelpGuideModalProps) {
  if (!isOpen) return null;

  const handleComplete = () => {
    try {
      localStorage.setItem(STORAGE_KEY_GUIDE_SEEN, 'true');
    } catch (err) {
      console.warn('Failed to save guide seen status:', err);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#18181B] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-100">
        
        {/* モーダルヘッダー */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#121215]">
          <div>
            <h2 className="text-[18px] font-bold text-white flex items-center gap-2">
              <span>🏕️</span>
              <span>Camp Gear Manager の使い方</span>
            </h2>
            <p className="text-[12px] text-zinc-400 font-normal mt-0.5">
              3ステップでわかるスマートパッキング
            </p>
          </div>
          <button
            onClick={handleComplete}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ガイドコンテンツ一覧 */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-[12px]">
          
          {/* ステップ 1 */}
          <div className="bg-[#27272A]/70 border border-zinc-700/60 rounded-xl p-4 space-y-2">
            <h3 className="text-[14px] font-semibold text-[#FF5500] flex items-center gap-2">
              <Camera className="w-4 h-4 shrink-0" />
              <span>1. ギアを登録する</span>
            </h3>
            <p className="text-zinc-300 font-normal leading-relaxed">
              検索窓に型番・商品名を入力するか、カメラボタン（<span className="text-white font-bold">📷</span>）を押してギアを撮影します。
            </p>
            <p className="text-zinc-400 font-normal leading-relaxed">
              AIが名前・重量・価格・カテゴリーを自動補完し、複数ギアもまとめて一括登録可能です。
            </p>
          </div>

          {/* ステップ 2 */}
          <div className="bg-[#27272A]/70 border border-zinc-700/60 rounded-xl p-4 space-y-2">
            <h3 className="text-[14px] font-semibold text-[#FF5500] flex items-center gap-2">
              <Scale className="w-4 h-4 shrink-0" />
              <span>2. 「行き」と「帰り」の重量バランスをチェック</span>
            </h3>
            <p className="text-zinc-300 font-normal leading-relaxed">
              目標重量を設定して超過をリアルタイムに確認できます。
            </p>
            <p className="text-zinc-400 font-normal leading-relaxed">
              ベースギアと消耗品を自動判別し、「行き（満載）」と「帰り（消費後）」の総重量を瞬時に可視化します。
            </p>
          </div>

          {/* ステップ 3 */}
          <div className="bg-[#27272A]/70 border border-zinc-700/60 rounded-xl p-4 space-y-2.5">
            <h3 className="text-[14px] font-semibold text-[#FF5500] flex items-center gap-2">
              <Layers className="w-4 h-4 shrink-0" />
              <span>3. シーンに合わせた3つのモード切替</span>
            </h3>
            <div className="space-y-2 pl-1">
              <div className="flex items-start gap-2">
                <span className="font-bold text-white whitespace-nowrap">✏️ ギア編集（準備）:</span>
                <span className="text-zinc-300 font-normal">今回持参するギア（🎒）とお留守番（💤）を選定・並び替え。</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-white whitespace-nowrap">🎒 パッキング（当日）:</span>
                <span className="text-zinc-300 font-normal">ザックに詰めたアイテムをワンタップでチェック（未チェック絞り込み対応）。</span>
              </div>
              {/* 🎯 「振り返り」を「レビュー」に統一 */}
              <div className="flex items-start gap-2">
                <span className="font-bold text-white whitespace-nowrap">⛺ レビュー（帰宅後）:</span>
                <span className="text-zinc-300 font-normal">使わなかったギア（⚠️）を記録し、稼働率実績を更新して次回の軽量化に活用。</span>
              </div>
            </div>
          </div>

          {/* 便利機能（Tipsカード） */}
          <div className="bg-amber-950/30 border border-amber-800/60 rounded-xl p-4 space-y-1.5">
            <h3 className="text-[14px] font-semibold text-amber-400 flex items-center gap-2">
              <Share2 className="w-4 h-4 shrink-0" />
              <span>グループキャンプ・リスト共有</span>
            </h3>
            <p className="text-zinc-300 font-normal leading-relaxed">
              右上の「公開」ボタンからURLを共有するだけで、仲間と同じパッキングリストを閲覧・共有できます。
            </p>
          </div>

        </div>

        {/* モーダルフッター */}
        <div className="p-4 border-t border-zinc-800 bg-[#121215] space-y-2.5 shrink-0 text-center">
          <p className="text-[12px] text-zinc-400 font-normal">
            ※いつでも右上の「使い方」ボタンから再確認できます
          </p>
          <button
            onClick={handleComplete}
            className="w-full py-3 bg-[#FF5500] hover:bg-[#e04c00] text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-[12px] cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>使ってみる</span>
          </button>
        </div>

      </div>
    </div>
  );
}