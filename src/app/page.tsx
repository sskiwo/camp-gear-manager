'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import WeightsSummary from '@/components/WeightsSummary';
import GearSearch from '@/components/GearSearch';
import GearList from '@/components/GearList';
import CsvManager from '@/components/CsvManager';
import { GearItem } from '@/components/GearItemCard';

type Camp = {
  id: string;
  title: string;
  event_date: string;
  memo?: string;
  is_public: boolean;
};

export default function Home() {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [selectedCampId, setSelectedCampId] = useState<string>('');
  const [gears, setGears] = useState<GearItem[]>([]);
  const [allGearsInAccount, setAllGearsInAccount] = useState<GearItem[]>([]);

  const [screenMode, setScreenMode] = useState<'packing' | 'edit' | 'review'>('packing');
  const [unusedGearIds, setUnusedGearIds] = useState<Set<string>>(new Set());

  const [isAddCampOpen, setIsAddCampOpen] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [copyOption, setCopyOption] = useState<'latest' | 'select' | 'none'>('latest');
  const [selectedSourceCampId, setSelectedSourceCampId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditCampOpen, setIsEditCampOpen] = useState(false);
  const [editCampTitle, setEditCampTitle] = useState('');

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    ベース: false,
    調理: false,
    衣類: false,
    その他: false,
    消耗品: false,
  });

  const fetchCamps = async () => {
    const { data, error } = await supabase
      .from('camps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch Camps Error:', error);
      return;
    }

    if (data && data.length > 0) {
      setCamps(data);
      if (!selectedCampId || !data.some((c) => c.id === selectedCampId)) {
        setSelectedCampId(data[0].id);
      }
    } else {
      const { data: newCamp, error: createErr } = await supabase
        .from('camps')
        .insert([{ title: 'マイ・ファーストキャンプ', is_public: false }])
        .select()
        .single();

      if (createErr) {
        console.error('Create Initial Camp Error:', createErr);
        return;
      }

      if (newCamp) {
        setCamps([newCamp]);
        setSelectedCampId(newCamp.id);
      }
    }
  };

  const fetchGears = async () => {
    if (!selectedCampId) return;

    const { data: currentGears, error } = await supabase
      .from('gears')
      .select('*')
      .eq('camp_id', selectedCampId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch Gears Error:', error);
      return;
    }
    if (currentGears) setGears(currentGears as GearItem[]);

    const { data: allGears } = await supabase.from('gears').select('*');
    if (allGears) setAllGearsInAccount(allGears as GearItem[]);
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  useEffect(() => {
    if (selectedCampId) {
      setUnusedGearIds(new Set());
      fetchGears();
    }
  }, [selectedCampId]);

  const handleOpenAddCampModal = () => {
    setNewCampTitle('');
    setCopyOption(camps.length > 0 ? 'latest' : 'none');
    if (camps.length > 0) {
      setSelectedSourceCampId(camps[0].id);
    }
    setIsEditCampOpen(false);
    setIsAddCampOpen(true);
  };

  const getCampGearCount = (campId: string) => {
    return allGearsInAccount.filter((g) => g.camp_id === campId).length;
  };

  const handleCreateCamp = async () => {
    if (!newCampTitle.trim()) {
      alert('キャンプ名を入力してください！');
      return;
    }

    setIsSubmitting(true);

    const { data: newCamp, error: createErr } = await supabase
      .from('camps')
      .insert([{ title: newCampTitle.trim(), is_public: false }])
      .select()
      .single();

    if (createErr || !newCamp) {
      alert(`保存に失敗しました:\n${createErr?.message}`);
      setIsSubmitting(false);
      return;
    }

    let targetSourceId = '';
    if (copyOption === 'latest' && camps.length > 0) {
      targetSourceId = camps[0].id;
    } else if (copyOption === 'select' && selectedSourceCampId) {
      targetSourceId = selectedSourceCampId;
    }

    if (targetSourceId) {
      const { data: sourceGears } = await supabase
        .from('gears')
        .select('*')
        .eq('camp_id', targetSourceId);

      if (sourceGears && sourceGears.length > 0) {
        const clonedGears = sourceGears.map((g) => ({
          camp_id: newCamp.id,
          name: g.name,
          brand: g.brand || '',
          model_number: g.model_number || '',
          product_name: g.product_name || g.name,
          category: g.category || 'ベース',
          weight: Number(g.weight) || 0,
          price: Number(g.price) || 0,
          quantity: Number(g.quantity) || 1,
          is_packed: false,
          is_selected: g.is_selected !== false,
          is_consumable: g.is_consumable || false,
          product_url: g.product_url || '',
          purchase_date: g.purchase_date || '',
          fuel_type: g.fuel_type || '',
          memo: g.memo || '',
          total_brought_count: g.total_brought_count || 0,
          total_used_count: g.total_used_count || 0,
          is_emergency_gear: g.is_emergency_gear || false,
          is_weight_estimated: g.is_weight_estimated || false,
        }));

        const { error: cloneErr } = await supabase.from('gears').insert(clonedGears);
        if (cloneErr) {
          console.error('Clone Gears Error:', cloneErr);
        }
      }
    }

    setIsSubmitting(false);
    setCamps((prev) => [newCamp, ...prev]);
    setSelectedCampId(newCamp.id);
    setNewCampTitle('');
    setIsAddCampOpen(false);
    fetchGears();
  };

  const handleUpdateCampTitle = async () => {
    if (!editCampTitle.trim() || !selectedCampId) return;

    const { error } = await supabase
      .from('camps')
      .update({ title: editCampTitle.trim() })
      .eq('id', selectedCampId);

    if (error) {
      alert(`名前の変更に失敗しました:\n${error.message}`);
      return;
    }

    setCamps((prev) =>
      prev.map((c) => (c.id === selectedCampId ? { ...c, title: editCampTitle.trim() } : c))
    );
    setIsEditCampOpen(false);
  };

  const startEditCampTitle = () => {
    const current = camps.find((c) => c.id === selectedCampId);
    if (current) {
      setEditCampTitle(current.title);
      setIsEditCampOpen(true);
    }
  };

  const handleTogglePublic = async () => {
    const currentCamp = camps.find((c) => c.id === selectedCampId);
    if (!currentCamp) return;

    const newPublicStatus = !currentCamp.is_public;
    const { error } = await supabase
      .from('camps')
      .update({ is_public: newPublicStatus })
      .eq('id', selectedCampId);

    if (error) {
      alert(`公開設定の変更に失敗しました:\n${error.message}`);
      return;
    }

    setCamps((prev) =>
      prev.map((c) => (c.id === selectedCampId ? { ...c, is_public: newPublicStatus } : c))
    );

    alert(newPublicStatus ? '🌐 コミュニティに公開しました！' : '🔒 非公開に設定しました。');
  };

  const handleDeleteCamp = async () => {
    if (!selectedCampId) return;
    if (camps.length <= 1) {
      alert('最後の1つのキャンプは削除できません。');
      return;
    }

    const currentCamp = camps.find((c) => c.id === selectedCampId);
    const confirmed = window.confirm(`「${currentCamp?.title}」を削除してもよろしいですか？\n※登録されているギアもすべて削除されます。`);
    if (!confirmed) return;

    const { error } = await supabase.from('camps').delete().eq('id', selectedCampId);
    if (error) {
      alert(`削除に失敗しました:\n${error.message}`);
      return;
    }

    const remaining = camps.filter((c) => c.id !== selectedCampId);
    setCamps(remaining);
    setSelectedCampId(remaining[0].id);
    setIsEditCampOpen(false);
  };

  const handleDeleteAllGears = async () => {
    if (!selectedCampId) return;
    const confirmed = window.confirm('このキャンプのギアをすべて削除してもよろしいですか？');
    if (!confirmed) return;

    await supabase.from('gears').delete().eq('camp_id', selectedCampId);
    fetchGears();
  };

  const handleResetAllPacked = async () => {
    if (!selectedCampId) return;
    const confirmed = window.confirm('当日のパッキング完了チェックをリセットして0%にしますか？');
    if (!confirmed) return;

    setGears((prev) => prev.map((g) => ({ ...g, is_packed: false })));
    await supabase.from('gears').update({ is_packed: false }).eq('camp_id', selectedCampId);
  };

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
    if (!selectedCampId) return;

    const fullName = `${item.brand || ''} ${item.product_name || ''} ${item.model_number || ''}`.trim();
    let cat = item.category || 'ベース';
    if (cat === 'ベースギア') cat = 'ベース';
    if (cat === '調理ギア') cat = '調理';
    if (cat === 'その他・日用品') cat = 'その他';
    if (cat === '食料・消耗品') cat = '消耗品';

    await supabase.from('gears').insert([{
      camp_id: selectedCampId,
      name: fullName || item.name,
      brand: item.brand || '',
      model_number: item.model_number || '',
      product_name: item.product_name || item.name,
      category: cat,
      weight: Number(item.weight) || 0,
      price: Number(item.price) || 0,
      quantity: 1,
      is_packed: false,
      is_selected: true,
      is_consumable: cat === '消耗品',
      product_url: item.productUrl || '',
      purchase_date: item.purchase_date || '',
      fuel_type: item.fuel_type === '不要/なし' ? '' : (item.fuel_type || ''),
      memo: (item.memo || '').trim(),
      total_brought_count: 0,
      total_used_count: 0,
      is_emergency_gear: false,
      is_weight_estimated: item.is_weight_estimated ?? false,
    }]);
    fetchGears();
  };

  const togglePacked = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setGears((prev) =>
      prev.map((g) => (g.id === id ? { ...g, is_packed: nextStatus } : g))
    );

    const { error } = await supabase.from('gears').update({ is_packed: nextStatus }).eq('id', id);
    if (error) {
      console.error('Update is_packed Error:', error);
      fetchGears();
    }
  };

  const toggleSelected = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    setGears((prev) =>
      prev.map((g) => (g.id === id ? { ...g, is_selected: nextStatus } : g))
    );
    setAllGearsInAccount((prev) =>
      prev.map((g) => (g.id === id ? { ...g, is_selected: nextStatus } : g))
    );

    const { error } = await supabase.from('gears').update({ is_selected: nextStatus }).eq('id', id);
    if (error) {
      console.error('Update is_selected Error:', error);
      fetchGears();
    }
  };

  const handleToggleUnusedGear = (gearId: string) => {
    setUnusedGearIds((prev) => {
      const next = new Set(prev);
      if (next.has(gearId)) {
        next.delete(gearId);
      } else {
        next.add(gearId);
      }
      return next;
    });
  };

  const updateQuantity = async (id: string, currentQty: number, delta: number) => {
    const newQty = Math.max(1, currentQty + delta);
    setGears((prev) =>
      prev.map((g) => (g.id === id ? { ...g, quantity: newQty } : g))
    );

    await supabase.from('gears').update({ quantity: newQty }).eq('id', id);
  };

  const updateGear = async (id: string, updateData: any) => {
    setGears((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updateData } : g))
    );

    const { error } = await supabase.from('gears').update(updateData).eq('id', id);
    if (error) {
      console.error('Update Gear Error:', error);
      alert(`保存に失敗しました:\n${error.message}`);
      fetchGears();
      return;
    }
    fetchGears();
  };

  const deleteGear = async (id: string) => {
    setGears((prev) => prev.filter((g) => g.id !== id));
    await supabase.from('gears').delete().eq('id', id);
    fetchGears();
  };

  const handleReorderGears = (reorderedGears: any[]) => {
    setGears(reorderedGears);
  };

  const currentSelectedCamp = camps.find((c) => c.id === selectedCampId);

  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-3 sm:p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-4">
        
        {/* ヘッダーエリア */}
        <header className="border-b border-zinc-800 pb-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            
            {/* 🎯 ヘッダーロゴ＆タイトル（タップでトップページへリンク） */}
            <Link
              href="/"
              className="flex items-center gap-2.5 whitespace-nowrap overflow-hidden truncate hover:opacity-85 transition-opacity cursor-pointer group"
              title="トップページを表示"
            >
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0 drop-shadow-md transition-transform group-hover:scale-105">
                <Image
                  src="/logo.svg"
                  alt="Camp Gear Manager Logo"
                  fill
                  sizes="40px"
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-[18px] sm:text-[22px] font-black text-white tracking-tight truncate">
                <span className="text-[#FF5500]">Camp Gear</span> Manager
              </h1>
            </Link>

            <button
              onClick={handleTogglePublic}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition border cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5 ${
                currentSelectedCamp?.is_public
                  ? 'bg-[#10B981] text-white border-transparent hover:bg-emerald-600'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <span>{currentSelectedCamp?.is_public ? '🌐 公開中' : '🔒 非公開'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 bg-[#18181B] px-3.5 py-2.5 rounded-xl border border-zinc-800 shadow-sm">
            <div className="flex-1 min-w-0">
              <select
                value={selectedCampId}
                onChange={(e) => setSelectedCampId(e.target.value)}
                className="w-full bg-transparent text-white text-[18px] font-bold focus:outline-none cursor-pointer truncate"
              >
                {camps.map((camp) => (
                  <option key={camp.id} value={camp.id} className="bg-[#18181B] text-white text-[18px] font-bold">
                    {camp.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center shrink-0">
              <button
                onClick={startEditCampTitle}
                className="w-8 h-8 flex items-center justify-center bg-[#27272A] hover:bg-zinc-700 text-zinc-200 hover:text-white rounded-lg text-sm transition border border-zinc-700 cursor-pointer shadow-sm active:scale-95"
                title="キャンプ設定"
              >
                ✏️
              </button>
            </div>
          </div>
        </header>

        {isEditCampOpen && (
          <div className="bg-[#18181B] border border-[#FF5500]/50 p-4 rounded-2xl space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h3 className="text-[14px] font-semibold text-white">キャンプ設定・管理</h3>
              <button
                onClick={() => setIsEditCampOpen(false)}
                className="text-zinc-400 hover:text-white text-[12px] font-normal p-1 cursor-pointer"
              >
                ✕ 閉じる
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-normal text-zinc-400 block">キャンプ名の変更</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editCampTitle}
                  onChange={(e) => setEditCampTitle(e.target.value)}
                  className="flex-1 bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-1.5 text-[12px] text-white focus:outline-none focus:border-[#FF5500]"
                />
                <button
                  onClick={handleUpdateCampTitle}
                  className="bg-[#FF5500] hover:bg-[#e04c00] text-white px-4 py-1.5 rounded-xl text-[12px] font-bold cursor-pointer transition shadow-sm"
                >
                  保存
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={handleOpenAddCampModal}
                className="px-3 py-1.5 bg-[#FF5500]/20 hover:bg-[#FF5500]/30 text-[#FF5500] border border-[#FF5500]/40 rounded-xl text-[12px] font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <span>＋</span>
                <span>新しいキャンプを追加</span>
              </button>

              <button
                onClick={handleDeleteCamp}
                disabled={camps.length <= 1}
                className="px-3 py-1.5 bg-red-950/30 hover:bg-red-900/60 text-[#EF4444] hover:text-white border border-[#EF4444]/40 rounded-xl text-[12px] font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                title={camps.length <= 1 ? '最後の1つは削除できません' : '現在のキャンプを削除'}
              >
                <span>🗑️</span>
                <span>このキャンプを削除</span>
              </button>
            </div>
          </div>
        )}

        {isAddCampOpen && (
          <div className="bg-[#18181B] border border-[#FF5500]/50 p-5 rounded-2xl space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-[14px] font-semibold text-white">新しいキャンプを追加</h3>

            <div className="space-y-1">
              <label className="text-[12px] font-normal text-zinc-400 block">キャンプ名（必須）</label>
              <input
                type="text"
                placeholder="例: 2026年8月 ふもとっぱらソロキャン"
                value={newCampTitle}
                onChange={(e) => setNewCampTitle(e.target.value)}
                className="w-full bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-2 text-[12px] text-white focus:border-[#FF5500] focus:outline-none"
              />
            </div>

            <div className="space-y-2.5 pt-1 border-t border-zinc-800">
              <label className="text-[12px] font-normal text-zinc-400 block">ギアリストの引き継ぎ</label>

              <div className="space-y-2 text-[12px]">
                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  copyOption === 'latest' ? 'bg-[#FF5500]/10 border-[#FF5500] text-white' : 'bg-[#27272A]/40 border-zinc-800 text-zinc-300 hover:bg-[#27272A]'
                }`}>
                  <input
                    type="radio"
                    name="copyOption"
                    value="latest"
                    checked={copyOption === 'latest'}
                    onChange={() => setCopyOption('latest')}
                    disabled={camps.length === 0}
                    className="mt-0.5 accent-[#FF5500]"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold block">直近のキャンプから引き継ぐ</span>
                    {camps.length > 0 ? (
                      <span className="text-[12px] text-zinc-400 block truncate font-mono mt-0.5">
                        直近: {camps[0].title} ({getCampGearCount(camps[0].id)}点)
                      </span>
                    ) : (
                      <span className="text-[12px] text-zinc-500 block mt-0.5">※過去のキャンプが存在しません</span>
                    )}
                  </div>
                </label>

                <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  copyOption === 'select' ? 'bg-[#FF5500]/10 border-[#FF5500] text-white' : 'bg-[#27272A]/40 border-zinc-800 text-zinc-300 hover:bg-[#27272A]'
                }`}>
                  <input
                    type="radio"
                    name="copyOption"
                    value="select"
                    checked={copyOption === 'select'}
                    onChange={() => setCopyOption('select')}
                    disabled={camps.length === 0}
                    className="mt-0.5 accent-[#FF5500]"
                  />
                  <div className="flex-1 min-w-0 space-y-2">
                    <span className="font-semibold block">過去のリストから選択</span>
                    {copyOption === 'select' && (
                      <select
                        value={selectedSourceCampId}
                        onChange={(e) => setSelectedSourceCampId(e.target.value)}
                        className="w-full bg-[#18181B] border border-zinc-700 text-white text-[12px] px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#FF5500]"
                      >
                        {camps.map((camp) => (
                          <option key={camp.id} value={camp.id}>
                            {camp.title} ({getCampGearCount(camp.id)}点)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>

                <label className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                  copyOption === 'none' ? 'bg-[#FF5500]/10 border-[#FF5500] text-white' : 'bg-[#27272A]/40 border-zinc-800 text-zinc-300 hover:bg-[#27272A]'
                }`}>
                  <input
                    type="radio"
                    name="copyOption"
                    value="none"
                    checked={copyOption === 'none'}
                    onChange={() => setCopyOption('none')}
                    className="accent-[#FF5500]"
                  />
                  <span className="font-semibold">空のリストで作成する (ギア0件)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                onClick={handleCreateCamp}
                disabled={isSubmitting}
                className="bg-[#FF5500] hover:bg-[#E04B00] text-white px-5 py-2 rounded-xl text-[12px] font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? '作成中...' : '作成'}
              </button>
              <button
                onClick={() => setIsAddCampOpen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-[12px] font-normal cursor-pointer transition"
              >
                中止
              </button>
            </div>
          </div>
        )}

        <WeightsSummary
          gears={gears}
          screenMode={screenMode}
          unusedGearIds={unusedGearIds}
          onCategoryClick={scrollToCategory}
        />
        
        <GearSearch onAddGear={handleAddGear} />

        <GearList
          gears={gears}
          allCampsCount={camps.length}
          allGearsInUserAccount={allGearsInAccount}
          screenMode={screenMode}
          onScreenModeChange={setScreenMode}
          unusedGearIds={unusedGearIds}
          onToggleUnusedGear={handleToggleUnusedGear}
          openCategories={openCategories}
          onToggleCategoryOpen={toggleCategoryOpen}
          onTogglePacked={togglePacked}
          onToggleSelected={toggleSelected}
          onUpdateQuantity={updateQuantity}
          onUpdateGear={updateGear}
          onDeleteGear={deleteGear}
          onDeleteAllGears={handleDeleteAllGears}
          onResetAllPacked={handleResetAllPacked}
          onReorderGears={handleReorderGears}
        />

        <CsvManager gears={gears} selectedCampId={selectedCampId} onGearsUpdated={fetchGears} />

        <footer className="pt-6 pb-8 text-center border-t border-zinc-800">
          <p className="text-[12px] text-zinc-500 font-normal">🏕️ Camp Gear Manager & Packing Tool</p>
        </footer>
      </div>
    </main>
  );
}