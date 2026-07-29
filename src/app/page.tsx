'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SplitBill from '@/components/SplitBill';
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

// カテゴリーごとのカラーマップ (モダンディープ＆くすみ)
const CATEGORY_COLORS = {
  ベースギア: '#6B8272',
  '調理ギア・燃料': '#A88869',
  '衣類・防寒着': '#7B9BA2',
  '食料・飲料': '#AF8074',
  'その他・日用品': '#67738C',
};

export default function Home() {
  const [gears, setGears] = useState<GearItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<CandidateItem[]>([]);

  // 編集用ステート
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBrand, setEditBrand] = useState('');
  const [editModelNumber, setEditModelNumber] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editCategory, setEditCategory] = useState('ベースギア');
  const [editWeight, setEditWeight] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editIsConsumable, setEditIsConsumable] = useState(false);

  // 1. Supabaseからデータ取得
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

  // 2. AIキーワード・型番検索
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
        alert('該当する候補が見つかりませんでした。キーワードを変えて試してください。');
      }
    } catch (err: any) {
      alert(err.message || '検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  };

  // 3. 候補の消費物チェック切り替え
  const toggleCandidateConsumable = (index: number) => {
    setCandidates((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, isConsumable: !item.isConsumable } : item))
    );
  };

  // 4. 候補のカテゴリー変更
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

  // 5. Supabaseに追加
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

  // 6. 数量更新
  const updateQuantity = async (id: string, currentQty: number, delta: number) => {
    const nextQty = Math.max(1, currentQty + delta);
    const { error } = await supabase.from('gears').update({ quantity: nextQty }).eq('id', id);
    if (!error) fetchGears();
  };

  // 7. 編集モード開始
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

  // 8. 編集保存
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

  // 9. パッキング切替 & 削除
  const togglePacked = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('gears').update({ is_packed: !currentStatus }).eq('id', id);
    if (!error) fetchGears();
  };

  const deleteGear = async (id: string) => {
    const { error } = await supabase.from('gears').delete().eq('id', id);
    if (!error) fetchGears();
  };

  return (
    <main className="min-h-screen bg-[#F6F5EF] text-[#333333] p-6 md:p-14 font-sans transition-all duration-300">
      <div className="max-w-7xl mx-auto space-y-14">
        
        {/* ヘッダー (セージグリーン) */}
        <header className="text-center space-y-4 border-b-2 border-[#E0DED3]/70 pb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#384F41] tracking-tighter">
            🏕️ Camp Gear & Money Manager
          </h1>
          <p className="text-lg text-[#666666] font-medium tracking-tight">パッキング重量・5カテゴリー管理・スマート割り勘</p>
        </header>

        {/* 重量サマリー */}
        <WeightsSummary gears={gears} />

        {/* 🔍 AI検索 */}
        <section className="bg-white p-8 rounded-3xl shadow-xl border border-[#E0DED3]/50 space-y-6">
          <h2 className="text-xl font-bold text-[#384F41] flex items-center gap-3">
            🔍 AI型番・キーワード自動検索
          </h2>
          <form onSubmit={handleAiSearch} className="flex gap-4">
            <input
              type="text"
              placeholder="例: ST-310 / ノースフェイス ジャケット / ほりにし / 黒ラベル / CB缶"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-6 py-4 border border-[#CCCCCC]/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#384F41] bg-white text-base transition duration-300 shadow-inner"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="bg-gradient-to-r from-[#384F41] to-[#6B8272] text-white px-10 py-4 rounded-2xl font-bold text-base hover:from-[#2D3E33] hover:to-[#5B6D60] transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {isSearching ? '検索中...' : '候補を表示'}
            </button>
          </form>

          {/* 🎯 検索候補リスト */}
          {candidates.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[#E0DED3]/50 space-y-5">
              <h3 className="text-sm font-bold text-[#888888] uppercase tracking-wider pl-1">📋 該当候補（カテゴリーを確認して追加）:</h3>
              <div className="space-y-4">
                {candidates.map((cand, idx) => {
                  const catColor = CATEGORY_COLORS[cand.category as keyof typeof CATEGORY_COLORS] || '#384F41';
                  
                  return (
                    <div
                      key={idx}
                      className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-[#F6F5EF] border border-[#E0DED3]/50 rounded-3xl gap-4 shadow-inner"
                    >
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          {cand.brand && (
                            <span className="text-xs bg-[#384F41]/08 text-[#384F41] px-3 py-1 rounded-full font-bold border border-[#384F41]/10">
                              {cand.brand}
                            </span>
                          )}
                          <span className="font-bold text-lg text-[#333333] tracking-tight">{cand.product_name || cand.name}</span>
                          
                          {/* 📌 型番バッジ */}
                          {cand.model_number && (
                            <span className="text-[11px] bg-[#E0DED3]/90 text-[#333333] px-2.5 py-1 rounded-md font-mono font-semibold border border-[#CCCCCC]/50 shadow-inner">
                              型番: {cand.model_number}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#666666] flex items-center gap-5 mt-2 flex-wrap font-medium">
                          <span>⚖️ 1個 {cand.weight}g</span>
                          <span>💴 1個 ¥{cand.price.toLocaleString()}</span>
                          {cand.productUrl && (
                            <a
                              href={cand.productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#BFA58A] hover:underline flex items-center gap-1.5 font-bold text-[11px]"
                            >
                              🛒 Amazonで確認
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-[#E0DED3]/50 flex-wrap">
                        {/* カテゴリー選択 */}
                        <select
                          value={cand.category}
                          onChange={(e) => changeCandidateCategory(idx, e.target.value)}
                          style={{ borderColor: `${catColor}60`, color: catColor }}
                          className="text-xs border rounded-lg px-3 py-2 bg-white font-bold transition duration-300 shadow focus:outline-none focus:ring-1"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>

                        {/* 消費物チェック */}
                        <label className="flex items-center gap-2 text-xs text-[#AF8074] font-bold cursor-pointer bg-[#AF8074]/08 px-4 py-2 rounded-lg border border-[#AF8074]/20 transition duration-300 shadow-inner hover:bg-[#AF8074]/15">
                          <input
                            type="checkbox"
                            checked={cand.isConsumable}
                            onChange={() => toggleCandidateConsumable(idx)}
                            className="w-4 h-4 accent-[#AF8074] cursor-pointer"
                          />
                          🔥 消費物
                        </label>

                        <button
                          onClick={() => addCandidateToGear(cand)}
                          className="bg-gradient-to-r from-[#BFA58A] to-[#D6A97A] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:from-[#A88869] hover:to-[#A88869] transition duration-300 cursor-pointer shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
        <section className="bg-white p-8 rounded-3xl shadow-xl border border-[#E0DED3]/50 space-y-8">
          <h2 className="text-2xl font-bold text-[#384F41] tracking-tight">🎒 積載パッキングリスト</h2>

          {gears.length === 0 ? (
            <p className="text-center text-[#999999] py-8 font-medium bg-[#F6F5EF] rounded-2xl border border-[#E0DED3]/50 shadow-inner">ギアや食料がまだ登録されていません。</p>
          ) : (
            CATEGORIES.map((catName) => {
              const categoryGears = gears.filter((g) => (g.category || 'ベースギア') === catName);
              if (categoryGears.length === 0) return null;

              const catColor = CATEGORY_COLORS[catName as keyof typeof CATEGORY_COLORS] || '#384F41';

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
                <div key={catName} className="space-y-5">
                  <div style={{ borderColor: `${catColor}40` }} className="flex items-center justify-between border-b-2 pb-2 pl-1">
                    <h3 style={{ color: catColor }} className="text-xl font-bold flex items-center gap-2.5 tracking-tight">
                      <span>{catIcon}</span>
                      <span>{catName}</span>
                      <span className="text-sm text-[#AAAAAA] font-normal">({categoryGears.length}件)</span>
                    </h3>
                  </div>

                  <div className="space-y-3.5">
                    {categoryGears.map((item) => {
                      const qty = item.quantity || 1;
                      const totalWeight = (item.weight || 0) * qty;
                      const totalPrice = (item.price || 0) * qty;

                      return (
                        <div
                          key={item.id}
                          className={`p-5 rounded-3xl border transition duration-300 ${
                            item.is_packed
                              ? 'bg-[#F6F5EF] border-[#E0DED3]/70 shadow-inner'
                              : 'bg-[#EDEDED] opacity-60 border-transparent shadow-none'
                          }`}
                        >
                          {editingId === item.id ? (
                            /* ✏️ 編集モード */
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <input type="text" value={editBrand} onChange={(e) => setEditBrand(e.target.value)} className="px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#384F41] outline-none transition" placeholder="メーカー名" />
                                <input type="text" value={editModelNumber} onChange={(e) => setEditModelNumber(e.target.value)} className="px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#384F41] outline-none transition" placeholder="型番" />
                                <input type="text" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} className="px-3 py-2 border rounded-lg text-xs bg-white sm:col-span-2 focus:ring-1 focus:ring-[#384F41] outline-none transition" placeholder="商品名" />
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="px-3 py-2 border rounded-lg text-xs bg-white font-bold focus:ring-1 focus:ring-[#384F41] outline-none transition">
                                  {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                                <input type="number" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} className="px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#384F41] outline-none transition" placeholder="単体重量(g)" />
                                <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#384F41] outline-none transition" placeholder="単価(円)" />
                                <input type="number" value={editQuantity} onChange={(e) => setEditQuantity(e.target.value)} className="px-3 py-2 border rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#384F41] outline-none transition" placeholder="数量" />
                              </div>
                              <div className="flex items-center justify-between pt-1.5">
                                <label className="flex items-center gap-2 text-xs text-[#666666] cursor-pointer font-medium hover:text-[#333333]">
                                  <input type="checkbox" checked={editIsConsumable} onChange={(e) => setEditIsConsumable(e.target.checked)} className="w-4 h-4 accent-[#384F41]" />
                                  🔥 消費物（帰りに軽くなる）
                                </label>
                                <div className="flex gap-3">
                                  <button onClick={() => handleUpdateGear(item.id)} className="bg-gradient-to-r from-[#384F41] to-[#6B8272] text-white px-5 py-2 rounded-lg text-xs font-bold hover:from-[#2D3E33] hover:to-[#5B6D60] transition shadow">保存</button>
                                  <button onClick={cancelEdit} className="bg-[#E0DED3] text-[#666666] px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#D4D2C5] transition">キャンセル</button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* 📋 通常表示 */
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                              <div className="flex items-center gap-4">
                                <input
                                  type="checkbox"
                                  checked={item.is_packed}
                                  onChange={() => togglePacked(item.id, item.is_packed)}
                                  className="w-5 h-5 accent-[#384F41] cursor-pointer shadow transition duration-300"
                                />
                                <div>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    {item.brand && (
                                      <span style={{ color: catColor, borderColor: `${catColor}30`, backgroundColor: `${catColor}10` }} className="text-xs px-3 py-1 rounded-full font-bold border">
                                        {item.brand}
                                      </span>
                                    )}
                                    <span className="font-bold text-base text-[#333333] tracking-tight">
                                      {item.product_name || item.name}
                                    </span>
                                    
                                    {/* 📌 型番バッジ */}
                                    {item.model_number && (
                                      <span className="text-[11px] bg-[#E0DED3]/90 text-[#333333] px-2.5 py-1 rounded-md font-mono font-semibold border border-[#CCCCCC]/50 shadow-inner">
                                        型番: {item.model_number}
                                      </span>
                                    )}

                                    {item.is_consumable && (
                                      <span className="text-[10px] bg-[#AF8074] text-white px-2 py-0.5 rounded-full font-extrabold border border-[#AF8074]">
                                        消費物
                                      </span>
                                    )}
                                  </div>

                                  <div className="text-xs text-[#666666] flex flex-wrap items-center gap-5 mt-2 font-medium">
                                    <span>⚖️ 1個 {item.weight}g</span>
                                    <span>💴 1個 ¥{item.price.toLocaleString()}</span>
                                    <span style={{ backgroundColor: `${catColor}08` }} className="font-semibold text-[#444444] border border-[#E0DED3]/70 px-2.5 py-0.5 rounded-md text-[11px] shadow-inner">
                                      📊 小計: {totalWeight.toLocaleString()}g / ¥{totalPrice.toLocaleString()}
                                    </span>
                                    {item.product_url && (
                                      <a
                                        href={item.product_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#BFA58A] hover:underline flex items-center gap-1.5 font-bold text-[11px]"
                                      >
                                        🛒 Amazonで見る
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-[#E0DED3]/50">
                                <div className="flex items-center bg-white border border-[#E0DED3]/50 rounded-xl shadow-inner">
                                  <button
                                    onClick={() => updateQuantity(item.id, qty, -1)}
                                    className="px-3 py-1.5 text-xs font-extrabold text-[#666666] hover:bg-[#F6F5EF] rounded-l-xl transition"
                                 >
                                    -
                                  </button>
                                  <span className="px-3 py-1.5 text-xs font-bold text-[#384F41] bg-[#F6F5EF] border-x border-[#E0DED3]/50">
                                    数量: {qty}
                                  </span>
                                  <button
                                    onClick={() => updateQuantity(item.id, qty, 1)}
                                    className="px-3 py-1.5 text-xs font-extrabold text-[#666666] hover:bg-[#F6F5EF] rounded-r-xl transition"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => startEdit(item)}
                                    className="text-[#888888] hover:text-[#384F41] p-2 transition font-bold text-xs"
                                    title="編集"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() => deleteGear(item.id)}
                                    className="text-[#888888] hover:text-[#AF8074] p-2 transition text-xs"
                                    title="削除"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* スマート割り勘コンポーネント */}
        <SplitBill />

      </div>
    </main>
  );
}