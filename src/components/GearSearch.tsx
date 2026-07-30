'use client';

import { useState } from 'react';

type CandidateItem = {
  brand?: string;
  model_number?: string;
  product_name?: string;
  name: string;
  category: string;
  weight: number;
  price: number;
  productUrl: string;
  isConsumable: boolean;
};

type Props = {
  onAddGear: (item: CandidateItem) => Promise<void>;
};

const CATEGORIES = [
  'ベースギア',
  '調理ギア・燃料',
  '衣類・防寒着',
  '食料・飲料',
  'その他・日用品',
];

const CATEGORY_COLORS = {
  ベースギア: '#FF5500',
  '調理ギア・燃料': '#FFB800',
  '衣類・防寒着': '#00E5FF',
  '食料・飲料': '#00E676',
  'その他・日用品': '#E040FB',
};

export default function GearSearch({ onAddGear }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setCandidates([]);
    try {
      const res = await fetch('/api/search-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
      } else {
        alert('該当する候補が見つかりませんでした。');
      }
    } catch (err: any) {
      alert(err.message || '検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleCandidateConsumable = (index: number) => {
    setCandidates((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, isConsumable: !item.isConsumable } : item))
    );
  };

  const changeCandidateCategory = (index: number, newCat: string) => {
    setCandidates((prev) =>
      prev.map((item, idx) => {
        if (idx === index) {
          const isConsumable = newCat === '食料・飲料';
          return { ...item, category: newCat, isConsumable: isConsumable || item.isConsumable };
        }
        return item;
      })
    );
  };

  const handleAdd = async (item: CandidateItem) => {
    await onAddGear(item);
    setCandidates((prev) => prev.filter((c) => c.name !== item.name));
  };

  return (
    <section className="bg-[#18181B] p-5 md:p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
        🔍 AI型番・キーワード自動検索
      </h2>
      <form onSubmit={handleAiSearch} className="flex gap-2">
        {/* 文字入力欄＆一括クリアボタン（✕） */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="例: ST-310 / ノースフェイス / ほりにし / 黒ラベル"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:border-[#FF5500] bg-[#27272A] text-white text-sm transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-sm font-bold p-1 cursor-pointer transition"
              title="文字を消す"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isSearching}
          className="bg-[#FF5500] hover:bg-[#E04B00] text-white px-5 py-2.5 rounded-xl font-black text-xs transition disabled:opacity-50 shadow-md active:scale-95 cursor-pointer shrink-0"
        >
          {isSearching ? '検索中...' : '検索'}
        </button>
      </form>

      {candidates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">📋 該当候補:</h3>
          <div className="space-y-2">
            {candidates.map((cand, idx) => {
              const catColor = CATEGORY_COLORS[cand.category as keyof typeof CATEGORY_COLORS] || '#FF5500';
              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#27272A] border border-zinc-700/80 rounded-xl gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {cand.brand && (
                        <span className="text-[10px] bg-[#FF5500]/20 text-[#FF5500] border border-[#FF5500]/40 px-2 py-0.5 rounded font-bold">
                          {cand.brand}
                        </span>
                      )}
                      <span className="font-bold text-sm text-white">{cand.product_name || cand.name}</span>
                      {cand.model_number && (
                        <span className="text-[10px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.5 rounded font-mono">
                          [{cand.model_number}]
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center gap-3">
                      <span>⚖️ {cand.weight}g</span>
                      <span>💴 ¥{cand.price.toLocaleString()}</span>
                      {cand.productUrl && (
                        <a href={cand.productUrl} target="_blank" rel="noopener noreferrer" className="text-[#FFB800] hover:underline font-bold">
                          🛒 Amazon
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 sm:pt-0">
                    <select
                      value={cand.category}
                      onChange={(e) => changeCandidateCategory(idx, e.target.value)}
                      style={{ borderColor: `${catColor}80`, color: catColor }}
                      className="text-[11px] border rounded px-2 py-1 bg-[#18181B] font-bold"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1 text-[11px] text-[#00E676] font-bold cursor-pointer bg-[#00E676]/10 px-2 py-1 rounded border border-[#00E676]/30">
                      <input type="checkbox" checked={cand.isConsumable} onChange={() => toggleCandidateConsumable(idx)} className="w-3 h-3 accent-[#00E676]" />
                      消費物
                    </label>

                    <button onClick={() => handleAdd(cand)} className="bg-[#FF5500] text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-[#E04B00] transition">
                      ＋ 追加
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}