'use client';

import React from 'react';
import Image from 'next/image';
import { X, Search, Camera, Scale, Layers, Sparkles, Share2, Users, ArrowRight } from 'lucide-react';
import { shareApp } from '@/utils/share';

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

  const handleShareFromGuide = () => {
    shareApp({
      title: 'Camp Gear Manager | キャンプギア軽量化・パッキング管理',
      text: 'キャンプギアの重量計算やパッキング管理ができるWebアプリ「Camp Gear Manager」が便利！次のキャンプの荷造りに使ってみて⛺🎒',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3.5 sm:p-4 animate-fade-in">
      <div className="bg-[#18181B] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-zinc-100">
        
        {/* モーダルヘッダー（ロゴ入り） */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#121215]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-7 h-7 shrink-0 drop-shadow-md">
              <Image
                src="/logo.svg"
                alt="Camp Gear Manager Logo"
                fill
                sizes="28px"
                className="object-contain"
                priority
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] sm:text-[16px] font-black text-white tracking-tight flex items-center gap-1 truncate">
                <span className="text-[#FF5500]">Camp Gear</span> Manager の使い方
              </h2>
              <p className="text-[11px] text-zinc-400 font-normal">
                4つの機能で身軽になるスマートパッキング
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleComplete}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition cursor-pointer shrink-0"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ガイドコンテンツ一覧 */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-[12px]">
          
          {/* STEP 1 */}
          <div className="bg-[#27272A]/70 border border-zinc-700/60 rounded-xl p-3.5 space-y-2">
            <h3 className="text-[13px] font-bold text-[#FF5500] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center text-[11px] font-bold">1</span>
              <span>ギアを登録する（手動・AIスキャン）</span>
            </h3>
            <p className="text-zinc-300 font-normal leading-relaxed">
              検索窓にキーワードやAmazon URLを入力するか、カメラボタン（📷）でギアやレシートを撮影します。
            </p>
            <p className="text-zinc-400 font-normal leading-relaxed">
              AIが【ブランド・商品名・重量・価格】を自動推定。候補カード内の<strong className="text-zinc-200">「🛒 Amazonで確認」</strong>から仕様や実売価格を事前にチェックできます。
            </p>
          </div>

          {/* STEP 2 */}
          <div className="bg-[#27272A]/70 border border-zinc-700/60 rounded-xl p-3.5 space-y-2">
            <h3 className="text-[13px] font-bold text-[#FF5500] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center text-[11px] font-bold">2</span>
              <span>「行き」と「帰り」の重量バランスをチェック</span>
            </h3>
            <p className="text-zinc-300 font-normal leading-relaxed">
              目標重量を設定してリアルタイムに超過を防止。ベースギアと消耗品を自動判別し、荷物が最も重い<strong className="text-white font-mono">「行き（満載）」</strong>と消費後の<strong className="text-white font-mono">「帰り」</strong>の総重量を可視化します。
            </p>
          </div>

          {/* STEP 3 */}
          <div className="bg-[#27272A]/70 border border-zinc-700/60 rounded-xl p-3.5 space-y-2.5">
            <h3 className="text-[13px] font-bold text-[#FF5500] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center text-[11px] font-bold">3</span>
              <span>シーンに合わせた3つのモード切替</span>
            </h3>
            <div className="space-y-2 pl-0.5">
              <div className="bg-[#18181B]/60 p-2.5 rounded-lg border border-zinc-800 space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span>✏️ ギア編集（準備）</span>
                </div>
                <p className="text-zinc-400 font-normal leading-relaxed">
                  今回持参するギア（🎒）とお留守番（💤）を選定。<strong className="text-zinc-200">行をタップして詳細編集</strong>、<strong className="text-amber-400">左スワイプで即座に削除</strong>できます。
                </p>
              </div>

              <div className="bg-[#18181B]/60 p-2.5 rounded-lg border border-zinc-800 space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span>🎒 パッキング（当日）</span>
                </div>
                <p className="text-zinc-400 font-normal leading-relaxed">
                  ザックに詰めたアイテムをワンタップでチェック（✅）。未チェック絞り込みで詰め忘れを防止します。
                </p>
              </div>

              <div className="bg-[#18181B]/60 p-2.5 rounded-lg border border-zinc-800 space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span>⛺ レビュー（帰宅後）</span>
                </div>
                <p className="text-zinc-400 font-normal leading-relaxed">
                  使わなかったギアのチェックを外してパッキングスコアを判定。次回のお留守番（💤）へワンタップで反映し、無駄な荷物を削減します。
                </p>
              </div>
            </div>
          </div>

          {/* STEP 4: みんなのキャンプギャラリー ＆ 友だち紹介 */}
          <div className="bg-gradient-to-r from-[#27272A] to-[#1F1F23] border border-zinc-700/80 rounded-xl p-3.5 space-y-3">
            <div className="space-y-1">
              <h3 className="text-[13px] font-bold text-[#FF5500] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#FF5500]/20 text-[#FF5500] flex items-center justify-center text-[11px] font-bold">4</span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#FF5500]" />
                  <span>みんなのキャンプギャラリー</span>
                </span>
              </h3>
              <p className="text-zinc-300 font-normal leading-relaxed">
                「みんなのギアから追加」ボタンから、他のキャンパーが公開している実際のパッキングリストや厳選ギアを閲覧・参考にできます。
              </p>
              <p className="text-zinc-400 font-normal leading-relaxed">
                気になるギアはワンタップで自分のリストに取り込み可能。自分のリストも右上の「公開」ボタンで仲間と手軽にシェアできます。
              </p>
            </div>

            {/* 紹介リンク（シェアボタン） */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-[12px] font-bold text-white flex items-center gap-1.5">
                  <span>🎁</span>
                  <span>キャンプ仲間に教える</span>
                </h4>
                <p className="text-[11px] text-zinc-400 font-normal leading-tight">
                  グループキャンプのギア重複防止や軽量化に役立ちます。
                </p>
              </div>
              <button
                type="button"
                onClick={handleShareFromGuide}
                className="px-3 py-1.5 bg-[#FF5500] hover:bg-[#e04c00] text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow active:scale-95 whitespace-nowrap"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>紹介する</span>
              </button>
            </div>
          </div>

        </div>

        {/* モーダルフッター */}
        <div className="p-4 border-t border-zinc-800 bg-[#121215] space-y-2 shrink-0 text-center">
          <button
            type="button"
            onClick={handleComplete}
            className="w-full py-3 bg-[#FF5500] hover:bg-[#e04c00] text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-[13px] cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            <span>使ってみる</span>
          </button>
          <p className="text-[11px] text-zinc-500 font-normal">
            ※右上の「？」アイコンからいつでも再確認できます
          </p>
        </div>

      </div>
    </div>
  );
}