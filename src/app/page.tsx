'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import WeightsSummary from '@/components/WeightsSummary';
import GearSearch from '@/components/GearSearch';
import GearList from '@/components/GearList';

export default function Home() {
  const [gears, setGears] = useState<any[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    ベースギア: true, '調理ギア・燃料': true, '衣類・防寒着': true, '食料・飲料': true, 'その他・日用品': true,
  });

  const fetchGears = async () => {
    const { data } = await supabase.from('gears').select('*').order('created_at', { ascending: false });
    if (data) setGears(data);
  };

  useEffect(() => { fetchGears(); }, []);

  const toggleCategoryOpen = (catName: string) => {
    setOpenCategories((prev) => ({ ...prev, [catName]: !prev[catName] }));
  };

  const scrollToCategory = (catName: string) => {
    setOpenCategories((prev) => ({ ...prev, [catName]: true }));
    setTimeout(() => {
      document.getElementById(`category-${catName}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleAddGear = async (item: any) => {
    const fullName = `${item.brand || ''} ${item.product_name || ''} ${item.model_number || ''}`.trim();
    await supabase.from('gears').insert([{
      name: fullName || item.name, brand: item.brand || '', model_number: item.model_number || '',
      product_name: item.product_name || item.name, category: item.category || 'ベースギア',
      weight: Number(item.weight) || 0, price: Number(item.price) || 0, quantity: 1,
      is_packed: true, is_consumable: item.isConsumable, product_url: item.productUrl || '',
    }]);
    fetchGears();
  };

  const togglePacked = async (id: string, currentStatus: boolean) => {
    await supabase.from('gears').update({ is_packed: !currentStatus }).eq('id', id);
    fetchGears();
  };

  const updateQuantity = async (id: string, currentQty: number, delta: number) => {
    await supabase.from('gears').update({ quantity: Math.max(1, currentQty + delta) }).eq('id', id);
    fetchGears();
  };

  const updateGear = async (id: string, updateData: any) => {
    await supabase.from('gears').update(updateData).eq('id', id);
    fetchGears();
  };

  const deleteGear = async (id: string) => {
    await supabase.from('gears').delete().eq('id', id);
    fetchGears();
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="border-b border-zinc-800 pb-4">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            🏕️ <span className="text-[#FF5500]">Camp Gear</span> Manager
          </h1>
          <p className="text-xs text-zinc-400 mt-1">重量シミュレーション＆5カテゴリーパッキング</p>
        </header>

        <WeightsSummary gears={gears} onCategoryClick={scrollToCategory} />
        <GearSearch onAddGear={handleAddGear} />
        <GearList
          gears={gears} openCategories={openCategories} onToggleCategoryOpen={toggleCategoryOpen}
          onTogglePacked={togglePacked} onUpdateQuantity={updateQuantity} onUpdateGear={updateGear} onDeleteGear={deleteGear}
        />

        <footer className="pt-8 pb-10 text-center border-t border-zinc-800 space-y-3">
          <Link href="/split-bill" className="inline-flex items-center justify-center gap-2 bg-[#FF5500] hover:bg-[#E04B00] text-white px-6 py-3.5 rounded-2xl text-xs font-black transition shadow-lg active:scale-98">
            💰 スマート割り勘計算機ページへ進む →
          </Link>
          <p className="text-[11px] text-zinc-500 font-medium">🏕️ Camp Gear Manager & Packing Tool</p>
        </footer>
      </div>
    </main>
  );
}