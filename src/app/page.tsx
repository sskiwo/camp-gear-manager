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