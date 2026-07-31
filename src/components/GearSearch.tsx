'use client';

import React, { useState } from 'react';

type Candidate = {
  name: string;
  brand: string;
  model_number: string;
  weight: number;
  price: number;
  category: string;
  is_consumable?: boolean;
  source_url: string;
  amazon_url: string;
};

type Props = {
  onAddGear: (gear: Candidate) => void;
};

export default function GearSearch({ onAddGear }: Props) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMsg('');
    setCandidates([]);

    try {
      const res = await fetch('/api/search-gear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '検索に失敗しました');
      }

      if (data.candidates && data.candidates.length > 0) {
        setCandidates(data.candidates);
      } else {
        setErrorMsg('該当する商品が見つかりませんでした');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl text-white">
      <h2 className="text-lg font-bold text-[#FF5500] mb-3 flex items-center gap-2">
        🔍 AI型番・キーワード自動検索
      </h2>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="例: SOTO ST-310 / ほりにし / 黒ラベル"
            className="w-full bg-[#27272A] text-white placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#FF5500] pr-10"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white bg-zinc-700 hover:bg-zinc-600 w-5 h-5 rounded-full text-xs flex items-center justify-center"
              title="一括クリア"
            >
              ✕
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-[#FF5500] hover:bg-[#e04b00] disabled:bg-zinc-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          {loading ? '検索中...' : '候補を表示'}
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-4">
          ⚠️ {errorMsg}
        </div>
      )}

      {candidates.length > 0 && (
        <div className="space-y-3 mt-4">
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
            AIが取得した候補アイテム (全{candidates.length}件):
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {candidates.map((cand, idx) => (
              <div
                key={idx}
                className="bg-[#27272A] p-3.5 rounded-xl border border-zinc-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                      {cand.brand || 'メーカー不明'}
                    </span>
                    {cand.model_number && (
                      <span className="text-[10px] font-mono text-[#FFB800] bg-[#FFB800]/10 px-1.5 py-0.5 rounded border border-[#FFB800]/20">
                        型番: {cand.model_number}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-white mb-2 line-clamp-2">
                    {cand.name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-zinc-300 font-mono mb-3">
                    <span>⚖️ {cand.weight}g</span>
                    <span>💰 ¥{cand.price.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-700/60">
                  <div className="flex items-center gap-2">
                    {cand.amazon_url && (
                      <a
                        href={cand.amazon_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#00E5FF] hover:underline flex items-center gap-1"
                      >
                        🛒 Amazon
                      </a>
                    )}
                    {cand.source_url && (
                      <a
                        href={cand.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-[#00E676] hover:underline flex items-center gap-1"
                      >
                        🔍 根拠
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => onAddGear(cand)}
                    className="bg-[#00E676] hover:bg-[#00c865] text-black font-bold text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95"
                  >
                    ＋ 追加
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}