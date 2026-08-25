'use client';

import React from 'react';
import { Loader2, Check, X } from 'lucide-react';

export interface ReviewResultData {
  totalWeightGrams: number;
  unusedWeightGrams: number;
  usedWeightGrams: number;
  totalCount: number;
  unusedCount: number;
  usedCount: number;
  score: number;
  rank: 'S' | 'A' | 'B' | 'C';
  rankTitle: string;
  rankIcon: string;
  targetWeightKg: number;
}

type Props = {
  result: ReviewResultData | null;
  isApplyingNext: boolean;
  onClose: () => void;
  onApplyNextPacking: () => void;
};

const formatWeightDisplay = (grams: number) => {
  if (grams === 0) return '0g';
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)}kg`;
  }
  return `${Math.round(grams)}g`;
};

const getWeightEquivalentMessage = (grams: number) => {
  if (grams <= 0) {
    return '無駄のない完璧なパッキングでした！素晴らしい装備選定です 🎉';
  }
  if (grams < 450) {
    const cans = (grams / 350).toFixed(1);
    return `次回は 350ml缶約${cans}本分（${formatWeightDisplay(grams)}）軽くなります！`;
  }
  if (grams < 1600) {
    const bottles = (grams / 500).toFixed(1);
    return `次回は 500mlペットボトル約${bottles}本分（${formatWeightDisplay(grams)}）軽くなります！`;
  }
  const largeBottles = (grams / 2000).toFixed(1);
  return `次回は 2Lペットボトル約${largeBottles}本分（${formatWeightDisplay(grams)}）軽くなります！`;
};

export default function ReviewResultModal({
  result,
  isApplyingNext,
  onClose,
  onApplyNextPacking,
}: Props) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#18181B] border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* ヘッダー */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-[#121215]">
          <div className="flex items-center gap-2">
            <span className="text-base">🏕️</span>
            <div>
              <h3 className="text-[14px] font-bold text-white tracking-wide">MISSION COMPLETE!</h3>
              <p className="text-[10px] text-zinc-400">キャンプ振り返り・パッキング精度判定</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 p-1 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* スコア・スタッツ本文エリア */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-center">
          {/* メインスコアカード */}
          <div className="bg-gradient-to-b from-[#27272A] to-[#18181B] p-4 rounded-2xl border border-zinc-700/80 shadow-lg space-y-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Packing Accuracy Score
            </span>
            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {result.score}
              </span>
              <span className="text-sm font-bold text-zinc-400">/ 100点</span>
              <span
                className={`ml-2 text-xs font-black px-2 py-0.5 rounded border ${
                  result.rank === 'S'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500'
                    : result.rank === 'A'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500'
                    : result.rank === 'B'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-600'
                }`}
              >
                Rank {result.rank}
              </span>
            </div>

            {/* 称号バッジ */}
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold bg-[#FF5500]/15 text-[#FF5500] border border-[#FF5500]/40 shadow-sm">
                <span>{result.rankIcon}</span>
                <span>称号: {result.rankTitle}</span>
              </span>
            </div>
          </div>

          {/* スタッツ内訳 */}
          <div className="bg-[#27272A]/70 p-3.5 rounded-xl border border-zinc-700/60 space-y-2 text-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-normal flex items-center gap-1">
                <span>🎒</span>
                <span>装備稼働率:</span>
              </span>
              <span className="font-mono tabular-nums text-right font-bold text-white">
                {result.usedCount} / {result.totalCount} 点
                <span className="text-zinc-400 text-[11px] ml-1.5 font-normal">
                  ({result.totalCount > 0 ? Math.round((result.usedCount / result.totalCount) * 100) : 0}%)
                </span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-normal flex items-center gap-1">
                <span>🪶</span>
                <span>未使用重量:</span>
              </span>
              <span
                className={`font-mono tabular-nums text-right font-bold ${
                  result.unusedWeightGrams > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}
              >
                {result.unusedWeightGrams > 0
                  ? `未使用: ${formatWeightDisplay(result.unusedWeightGrams)}`
                  : 'なし (0g)'}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-700/60">
              <span className="text-zinc-400 font-normal flex items-center gap-1">
                <span>🎯</span>
                <span>目標重量達成:</span>
              </span>
              <span className="font-mono tabular-nums text-right font-bold text-zinc-200">
                {formatWeightDisplay(result.totalWeightGrams)} / {result.targetWeightKg.toFixed(1)}kg
              </span>
            </div>
          </div>

          {/* 身近なモノ換算アドバイス */}
          <div className="bg-amber-950/25 border border-amber-800/60 p-3 rounded-xl text-left space-y-1">
            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
              <span>💡</span>
              <span>次回の軽量化アドバイス</span>
            </span>
            <p className="text-[12px] text-zinc-300 font-normal leading-relaxed">
              {getWeightEquivalentMessage(result.unusedWeightGrams)}
            </p>
          </div>
        </div>

        {/* フッターアクション */}
        <div className="p-4 border-t border-zinc-800 bg-[#18181B] space-y-2 shrink-0">
          {result.unusedCount > 0 && (
            <button
              type="button"
              onClick={onApplyNextPacking}
              disabled={isApplyingNext}
              className="w-full py-3 bg-[#FF5500] hover:bg-[#e04c00] text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-[12px] cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isApplyingNext ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>設定を反映中...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>次回のパッキングに反映（未使用{result.unusedCount}点をOFF）</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            disabled={isApplyingNext}
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-normal rounded-xl text-[12px] transition cursor-pointer text-center"
          >
            ギア一覧（編集モード）に戻る
          </button>
        </div>
      </div>
    </div>
  );
}