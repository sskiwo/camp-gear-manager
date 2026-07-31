'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import WeightsSummary from '@/components/WeightsSummary';
import GearSearch from '@/components/GearSearch';
import GearList from '@/components/GearList';
import CsvManager from '@/components/CsvManager';
import Link from 'next/link';

type GearItem = {
  id: string;
  name: string;
  brand?: string;
  model_number?: string;
  weight: number;
  price: number;
  quantity: number;
  category: string;
  amazon_url?: string;
  source_url?: string;
  is_packed: boolean;
  is_consumable: boolean;
};

export const CATEGORIES = [
  { id: 'base', name: 'ベースギア', icon: '⛺', color: '#FF5500' },
  { id: 'cook', name: '調理ギア・燃料', icon: '🍳', color: '#FFB800' },
  { id: 'wear', name: '衣類・防寒着', icon: '👕', color: '#00E5FF' },
  { id: 'other', name: 'その他・日用品', icon: '📦', color: '#E040FB' },
  { id: 'food', name: '食料・飲料', icon: '🍱', color: '#00E676' },
] as const;

export default function HomePage() {
  const [gears, setGears] = useState<GearItem[]>([]);
  const [targetWeightKg, setTargetWeightKg] = useState<number>(15.0);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchGears();
  }, []);

  const fetchGears = async () => {
    const { data, error } = await supabase
      .from('gears')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching gears:', error);
      return;
    }

    if (data) {
      setGears(data as GearItem[]);
    }
  };

  const handleAddGear = async (cand: any) => {
    const newGear = {
      name: cand.name,
      brand: cand.brand || '',
      model_number: cand.model_number || '',
      weight: cand.weight || 0,
      price: cand.price || 0,
      quantity: 1,
      category: cand.category || 'other',
      amazon_url: cand.amazon_url || '',
      source_url: cand.source_url || '',
      is_packed: true,
      is_consumable: cand.is_consumable ?? false,
    };

    const { data, error } = await supabase
      .from('gears')
      .insert([newGear])
      .select();

    if (error) {
      alert(`追加エラー: ${error.message}`);
      return;
    }

    if (data) {
      setGears((prev) => [...prev, data[0] as GearItem]);
    }
  };

  const handleTogglePacked = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('gears')
      .update({ is_packed: !current })
      .eq('id', id);

    if (error) return;

    setGears((prev) =>
      prev.map((g) => (g.id === id ? { ...g, is_packed: !current } : g))
    );
  };

  const handleQuantityChange = async (id: string, delta: number) => {
    const gear = gears.find((g) => g.id === id);
    if (!gear) return;

    const newQty = Math.max(1, gear.quantity + delta);
    const { error } = await supabase
      .from('gears')
      .update({ quantity: newQty })
      .eq('id', id);

    if (error) return;

    setGears((prev) =>
      prev.map((g) => (g.id === id ? { ...g, quantity: newQty } : g))
    );
  };

  const handleDeleteGear = async (id: string) => {
    if (!confirm('このギアを削除しますか？')) return;

    const { error } = await supabase.from('gears').delete().eq('id', id);
    if (error) return;

    setGears((prev) => prev.filter((g) => g.id !== id));
  };

  const handleUpdateGear = async (
    id: string,
    updatedData: Partial<GearItem>
  ) => {
    const { error } = await supabase
      .from('gears')
      .update(updatedData)
      .eq('id', id);

    if (error) {
      alert(`更新エラー: ${error.message}`);
      return;
    }

    setGears((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updatedData } : g))
    );
  };

  const handleCategoryClick = (categoryId: string) => {
    setOpenCategory(categoryId);
    const el = document.getElementById(`category-section-${categoryId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-white p-3 sm:p-6 max-w-4xl mx-auto">
      <header className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#FF5500] tracking-tight flex items-center gap-2">
            🏕️ Camp Gear Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            キャンプギア重量 ＆ お金管理アプリケーション
          </p>
        </div>
      </header>

      <WeightsSummary
        gears={gears}
        targetWeightKg={targetWeightKg}
        onTargetWeightChange={setTargetWeightKg}
        onCategoryClick={handleCategoryClick}
      />

      <GearSearch onAddGear={handleAddGear} />

      <GearList
        gears={gears}
        openCategory={openCategory}
        onToggleCategory={(id) =>
          setOpenCategory((prev) => (prev === id ? null : id))
        }
        onTogglePacked={handleTogglePacked}
        onQuantityChange={handleQuantityChange}
        onDelete={handleDeleteGear}
        onUpdate={handleUpdateGear}
      />

      <CsvManager gears={gears} onImportSuccess={fetchGears} />

      <footer className="mt-8 pt-6 border-t border-zinc-800 text-center">
        <Link
          href="/split-bill"
          className="inline-flex items-center justify-center gap-2 bg-[#FF5500] hover:bg-[#e04b00] text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-lg transition-all active:scale-95 w-full sm:w-auto"
        >
          💰 スマート割り勘計算機ページへ進む →
        </Link>
        <p className="text-[10px] text-zinc-500 mt-4">
          ※当サイトはAmazon.co.jpアソシエイトに参加しています。
        </p>
      </footer>
    </main>
  );
}