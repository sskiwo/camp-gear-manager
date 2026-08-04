'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import WeightsSummary from '@/components/WeightsSummary';
import GearSearch from '@/components/GearSearch';
import GearList from '@/components/GearList';
import CsvManager from '@/components/CsvManager';

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
  const [gears, setGears] = useState<any[]>([]);
  const [allGearsInAccount, setAllGearsInAccount] = useState<any[]>([]);

  // モーダルステート
  const [isAddCampOpen, setIsAddCampOpen] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditCampOpen, setIsEditCampOpen] = useState(false);
  const [editCampTitle, setEditCampTitle] = useState('');

  // ★ 短縮カテゴリー名ステート
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    ベース: false,
    調理: false,
    衣類: false,
    その他: false,
    消耗品: false,
  });

  // 1. 全キャンプ一覧の取得
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

  // 2. 選択中キャンプのギア & 全ギアの取得
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
    if (currentGears) setGears(currentGears);

    const { data: allGears } = await supabase.from('gears').select('*');
    if (allGears) setAllGearsInAccount(allGears);
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  useEffect(() => {
    if (selectedCampId) {
      fetchGears();
    }
  }, [selectedCampId]);

  // キャンプ追加
  const handleCreateCamp = async () => {
    if (!newCampTitle.trim()) {
      alert('キャンプ名を入力してください！');
      return;
    }

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('camps')
      .insert([{ title: newCampTitle.trim(), is_public: false }])
      .select()
      .single();
    setIsSubmitting(false);

    if (error) {
      alert(`保存に失敗しました:\n${error.message}`);
      return;
    }

    if (data) {
      setCamps((prev) => [data, ...prev]);
      setSelectedCampId(data.id);
      setNewCampTitle('');
      setIsAddCampOpen(false);
    }
  };

  // キャンプ名変更
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

  // 公開・非公開
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

  // キャンプ削除
  const handleDeleteCamp = async () => {
    if (!selectedCampId) return;
    if (camps.length <= 1) {
      alert('最後の1つのキャンプは削除できません。');
      return;
    }

    const currentCamp = camps.find((c) => c.id === selectedCampId);
    const confirmed = window.confirm(`「${currentCamp?.title}」を削除してもよろしいですか？`);
    if (!confirmed) return;

    const { error } = await supabase.from('camps').delete().eq('id', selectedCampId);
    if (error) {
      alert(`削除に失敗しました:\n${error.message}`);
      return;
    }

    const remaining = camps.filter((c) => c.id !== selectedCampId);
    setCamps(remaining);
    setSelectedCampId(remaining[0].id);
  };

  // ギア全削除
  const handleDeleteAllGears = async () => {
    if (!selectedCampId) return;
    const confirmed = window.confirm('このキャンプのギアをすべて削除してもよろしいですか？');
    if (!confirmed) return;

    await supabase.from('gears').delete().eq('camp_id', selectedCampId);
    fetchGears();
  };

  // パッキング全解除
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
      is_packed: true,
      is_selected: true,
      is_consumable: cat === '消耗品',
      product_url: item.productUrl || '',
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

    await supabase.from('gears').update(updateData).eq('id', id);
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
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ヘッダーエリア */}
        <header className="border-b border-zinc-800 pb-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg md:text-2xl font-black text-white tracking-tight flex items-center gap-1.5">
              🏕️ <span className="text-[#FF5500]">Camp Gear</span> Manager
            </h1>

            <button
              onClick={handleTogglePublic}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition border cursor-pointer shrink-0 ${
                currentSelectedCamp?.is_public
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              {currentSelectedCamp?.is_public ? '🌐 公開中' : '🔒 非公開'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-1.5 bg-[#18181B] p-2 rounded-2xl border border-zinc-800">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <span className="text-sm font-bold text-[#FF5500] pl-1 shrink-0">⛺</span>
              <select
                value={selectedCampId}
                onChange={(e) => setSelectedCampId(e.target.value)}
                className="w-full bg-[#27272A] text-white text-xs font-bold px-2.5 py-2 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#FF5500] cursor-pointer truncate"
              >
                {camps.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsAddCampOpen(true)}
                className="w-9 h-9 flex items-center justify-center bg-[#FF5500] hover:bg-[#E04B00] text-white text-base font-black rounded-xl transition shrink-0 cursor-pointer shadow-sm"
                title="新しいキャンプを追加"
              >
                +
              </button>

              <button
                onClick={startEditCampTitle}
                className="w-9 h-9 flex items-center justify-center bg-[#27272A] hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs transition border border-zinc-700 cursor-pointer"
                title="キャンプ名を編集"
              >
                ✏️
              </button>

              <button
                onClick={handleDeleteCamp}
                className="ml-2 w-9 h-9 flex items-center justify-center bg-red-950/30 hover:bg-red-900/60 text-red-400 hover:text-white rounded-xl text-xs transition border border-red-900/50 cursor-pointer"
                title="このキャンプを削除"
              >
                🗑️
              </button>
            </div>
          </div>
        </header>

        {/* 編集・追加モーダル */}
        {isEditCampOpen && (
          <div className="bg-[#18181B] border border-[#FFB800]/50 p-4 rounded-2xl space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-white">✏️ キャンプ名を変更</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={editCampTitle}
                onChange={(e) => setEditCampTitle(e.target.value)}
                className="flex-1 bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button onClick={handleUpdateCampTitle} className="bg-[#FFB800] text-black px-4 py-2 rounded-xl text-xs font-bold">
                保存
              </button>
              <button onClick={() => setIsEditCampOpen(false)} className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-xl text-xs">
                中止
              </button>
            </div>
          </div>
        )}

        {isAddCampOpen && (
          <div className="bg-[#18181B] border border-[#FF5500]/50 p-4 rounded-2xl space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-white">⛺ 新しいキャンプを追加</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="例: 2026年8月 ふもとっぱらソロキャン"
                value={newCampTitle}
                onChange={(e) => setNewCampTitle(e.target.value)}
                className="flex-1 bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button onClick={handleCreateCamp} disabled={isSubmitting} className="bg-[#FF5500] text-white px-4 py-2 rounded-xl text-xs font-bold">
                作成
              </button>
              <button onClick={() => setIsAddCampOpen(false)} className="bg-zinc-800 text-zinc-300 px-3 py-2 rounded-xl text-xs">
                中止
              </button>
            </div>
          </div>
        )}

        <WeightsSummary gears={gears} onCategoryClick={scrollToCategory} />
        
        {/* AI検索エリア ＆ 直下の「みんなのギアから追加する →」ボタン */}
        <div className="space-y-2">
          <GearSearch onAddGear={handleAddGear} />
          
          <div className="flex justify-end">
            <Link
              href="/community"
              className="inline-flex items-center gap-1.5 bg-[#18181B] hover:bg-[#27272A] text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm"
            >
              🌐 みんなのギアから追加する →
            </Link>
          </div>
        </div>

        <GearList
          gears={gears}
          allCampsCount={camps.length}
          allGearsInUserAccount={allGearsInAccount}
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

        <footer className="pt-8 pb-10 text-center border-t border-zinc-800 space-y-3">
          <Link href="/split-bill" className="inline-flex items-center justify-center gap-2 bg-[#FF5500] text-white px-6 py-3.5 rounded-2xl text-xs font-black">
            💰 スマート割り勘計算ページへ進む →
          </Link>
          <p className="text-[11px] text-zinc-500 font-medium">🏕️ Camp Gear Manager & Packing Tool</p>
        </footer>
      </div>
    </main>
  );
}