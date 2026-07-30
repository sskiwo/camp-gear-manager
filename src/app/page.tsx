'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import WeightsSummary from '@/components/WeightsSummary';

type GearItem = {
  id: string;
  name: string;
  brand?: string;
  model_number?: string;
  product_name?: string;
  category?: string;
  weight: number;
  price: number;
  quantity?: number;
  is_packed: boolean;
  is_consumable: boolean;
  product_url?: string;
};

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

const CATEGORIES = [
  'ベースギア',
  '調理ギア・燃料',
  '衣類・防寒着',
  '食料・飲料',
  'その他・日用品',
];

const CATEGORY_COLORS = {
  ベースギア: '#FF5500',       // ネオンオレンジ
  '調理ギア・燃料': '#FFB800', // ビビッドイエロー
  '衣類・防寒着': '#00E5FF',   // シアンブルー
  '食料・飲料': '#00E676',     // ネオングリーン
  'その他・日用品': '#E040FB', // ビビッドパープル
};

export default function Home() {
  const [gears, setGears] = useState<GearItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    ベースギア: true,
    '調理ギア・燃料': true,
    '衣類・防寒着': true,
    '食料・飲料': true,
    'その他・日用品': true,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBrand, setEditBrand] = useState('');
  const [editModelNumber, setEditModelNumber] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editCategory, setEditCategory] = useState('ベースギア');
  const [editWeight, setEditWeight] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editIsConsumable, setEditIsConsumable] = useState(false);

  const fetchGears = async () => {
    const { data, error } = await supabase.from('gears').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Fetch Error:', error);
    } else if (data) {
      setGears(data);
    }
  };

  useEffect(() => {
    fetchGears();
  }, []);

  const toggleCategoryOpen = (catName: string) => {
    setOpenCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  const scrollToCategory = (catName: string) => {
    setOpenCategories((prev) => ({ ...prev, [catName]: true }));
    setTimeout(() => {
      const element = document.getElementById(`category-${catName}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

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

  const addCandidateToGear = async (item: CandidateItem) => {
    try {
      const fullName = `${item.brand || ''} ${item.product_name || ''} ${item.model_number || ''}`.trim();
      const insertData = {
        name: fullName || item.name,
        brand: item.brand || '',
        model_number: item.model_number || '',
        product_name: item.product_name || item.name,
        category: item.category || 'ベースギア',
        weight: Number(item.weight) || 0,
        price: Number(item.price) || 0,
        quantity: 1,
        is_packed: true,
        is_consumable: item.isConsumable,
        product_url: item.productUrl || '',
      };

      const { error } = await supabase.from('gears').insert([insertData]);

      if (error) {
        alert(`保存に失敗しました:\n${error.message}`);
      } else {
        setCandidates((prev) => prev.filter((c) => c.name !== item.name));
        await fetchGears();
      }
    } catch (err: any) {
      alert(`エラーが発生しました: ${err.message}`);
    }
  };

  const updateQuantity = async (id: string, currentQty: number, delta: number) => {
    const nextQty = Math.max(1, currentQty + delta);
    const { error } = await supabase.from('gears').update({ quantity: nextQty }).eq('id', id);
    if (!error) fetchGears();
  };

  const startEdit = (item: GearItem) => {
    setEditingId(item.id);
    setEditBrand(item.brand || '');
    setEditModelNumber(item.model_number || '');
    setEditProductName(item.product_name || item.name || '');
    setEditCategory(item.category || 'ベースギア');
    setEditWeight(String(item.weight || 0));
    setEditPrice(String(item.price || 0));
    setEditQuantity(String(item.quantity || 1));
    setEditIsConsumable(item.is_consumable);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateGear = async (id: string) => {
    const fullName = `${editBrand} ${editProductName} ${editModelNumber}`.trim();
    const updateData = {
      name: fullName || editProductName,
      brand: editBrand,
      model_number: editModelNumber,
      product_name: editProductName,
      category: editCategory,
      weight: Number(editWeight) || 0,
      price: Number(editPrice) || 0,
      quantity: Math.max(1, Number(editQuantity) || 1),
      is_consumable: editIsConsumable,
      product_url: `https://www.amazon.co.jp/s?k=${encodeURIComponent(fullName || editProductName)}`,
    };

    const { error } = await supabase.from('gears').update(updateData).eq('id', id);

    if (error) {
      alert(`更新に失敗しました: ${error.message}`);
    } else {
      cancelEdit();
      fetchGears();
    }
  };

  const togglePacked = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('gears').update({ is_packed: !currentStatus }).eq('id', id);
    if (!error) fetchGears();
  };

  const deleteGear = async (id: string) => {
    const { error } = await supabase.from('gears').delete().eq('id', id);
    if (!error) fetchGears();
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ヘッダー */}
        <header className="border-b border-zinc-800 pb-4">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            🏕️ <span className="text-[#FF5500]">Camp Gear</span> Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-1">重量シミュレーション＆5カテゴリーパッキング</p>
        </header>

        {/* 重量サマリー */}
        <WeightsSummary gears={gears} onCategoryClick={scrollToCategory} />

        {/* 🔍 AI検索 */}
        <section className="bg-[#18181B] p-5 md:p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            🔍 AI型番・キーワード自動検索
          </h2>
          <form onSubmit={handleAiSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="例: ST-310 / ノースフェイス / ほりにし / 黒ラベル"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 border border-zinc-700 rounded-xl focus:outline-none focus:border-[#FF5500] bg-[#27272A] text-white text-sm transition"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-[#FF5500] hover:bg-[#E04B00] text-white px-5 py-2.5 rounded-xl font-black text-xs transition disabled:opacity-50 shadow-md active:scale-95"
            >
              {isSearching ? '検索中...' : '検索'}
            </button>
          </form>

          {/* 🎯 検索候補リスト */}
          {candidates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider pl-1">📋 該当候補:</h3>
              <div className="space-y-2">
                {candidates.map((cand, idx) => {
                  const catColor = CATEGORY_COLORS[cand.category as keyof typeof CATEGORY_COLORS] || '#FF5500';
                  
                  return (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#27272A] border border-zinc-700/80 rounded-xl gap-2 text-xs"
                    >
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

                        <button
                          onClick={() => addCandidateToGear(cand)}
                          className="bg-[#FF5500] text-white px-3 py-1 rounded text-[11px] font-bold hover:bg-[#E04B00] transition"
                        >
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

        {/* 🎒 5カテゴリー別 積載ギアリスト */}
        <section className="bg-[#18181B] p-5 md:p-6 rounded-2xl border border-zinc-800 space-y-4 shadow-xl">
          <h2 className="text-lg font-extrabold text-white">🎒 積載パッキングリスト</h2>

          {gears.length === 0 ? (
            <p className="text-center text-zinc-500 py-6 font-medium bg-[#27272A]/50 rounded-xl border border-zinc-800 text-xs">
              ギアや食料がまだ登録されていません。
            </p>
          ) : (
            CATEGORIES.map((catName) => {
              const categoryGears = gears.filter((g) => (g.category || 'ベースギア') === catName);
              if (categoryGears.length === 0) return null;

              const catColor = CATEGORY_COLORS[catName as keyof typeof CATEGORY_COLORS] || '#FF5500';
              const isOpen = openCategories[catName] !== false;

              const catIcon =
                catName === 'ベースギア'
                  ? '⛺'
                  : catName === '調理ギア・燃料'
                  ? '🍳'
                  : catName === '衣類・防寒着'
                  ? '👕'
                  : catName === '食料・飲料'
                  ? '🍱'
                  : '📦';

              return (
                <div key={catName} id={`category-${catName}`} className="border rounded-xl overflow-hidden shadow-md scroll-mt-6" style={{ borderColor: `${catColor}50` }}>
                  {/* カテゴリーアコーディオンヘッダー */}
                  <button
                    onClick={() => toggleCategoryOpen(catName)}
                    style={{ backgroundColor: `${catColor}15`, borderColor: `${catColor}40` }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left transition hover:brightness-125 border-b cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{catIcon}</span>
                      <span style={{ color: catColor }} className="font-extrabold text-sm tracking-wide">
                        {catName}
                      </span>
                      <span className="text-xs text-zinc-400 font-normal">({categoryGears.length}件)</span>
                    </div>
                    <span style={{ color: catColor }} className="text-xs font-bold">
                      {isOpen ? '▲ 閉じる' : '▼ 開く'}
                    </span>
                  </button>

                  {/* タップで開閉する中身 */}
                  {isOpen && (
                    <div className="p-2 space-y-2 bg-[#121215]">
                      {categoryGears.map((item) => {
                        const qty = item.quantity || 1;
                        const totalWeight = (item.weight || 0) * qty;
                        const totalPrice = (item.price || 0) * qty;

                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-lg border text-xs transition ${
                              item.is_packed
                                ? 'bg-[#27272A] border-zinc-700/80'
                                : 'bg-zinc-900/50 opacity-40 border-transparent'
                            }`}
                          >
                            {editingId === item.id ? (
                              /* ✏️ 編集モード */
                              <div className="space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                  <input type="text" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="メーカー名" />
                                  <input type="text" value={editModelNumber} onChange={(e) => setEditModelNumber(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="型番" />
                                  <input type="text" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="商品名" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs font-bold">
                                    {CATEGORIES.map((c) => (
                                      <option key={c} value={c}>{c}</option>
                                    ))}
                                  </select>
                                  <input type="number" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="単体重量(g)" />
                                  <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="単価(円)" />
                                  <input type="number" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="px-2 py-1 border border-zinc-700 rounded bg-[#18181B] text-white text-xs" placeholder="数量" />
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <label className="flex items-center gap-1 text-[11px] text-zinc-300">
                                    <input type="checkbox" checked={editIsConsumable} onChange={(e) => setEditIsConsumable(e.target.checked)} className="w-3 h-3 accent-[#FF5500]" />
                                    🔥 消費物
                                  </label>
                                  <div className="flex gap-2">
                                    <button onClick={() => handleUpdateGear(item.id)} className="bg-[#FF5500] text-white px-3 py-1 rounded text-[11px] font-bold">保存</button>
                                    <button onClick={cancelEdit} className="bg-zinc-700 text-zinc-300 px-3 py-1 rounded text-[11px] font-bold">キャンセル</button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* 📋 スリム・スッキリコンパクト表示 */
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <div className="flex items-start sm:items-center gap-2 flex-1 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={item.is_packed}
                                    onChange={() => togglePacked(item.id, item.is_packed)}
                                    className="w-4 h-4 mt-0.5 sm:mt-0 accent-[#FF5500] cursor-pointer"
                                  />