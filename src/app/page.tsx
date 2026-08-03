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

  // 新規キャンプ作成モーダル用ステート
  const [isAddCampOpen, setIsAddCampOpen] = useState(false);
  const [newCampTitle, setNewCampTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // キャンプ名編集用ステート
  const [isEditCampOpen, setIsEditCampOpen] = useState(false);
  const [editCampTitle, setEditCampTitle] = useState('');

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    ベースギア: false,
    調理ギア: false,
    衣類: false,
    'その他・日用品': false,
    '食料・消耗品': false,
  });

  // 1. キャンプ一覧の取得
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

  // 2. 選択中キャンプに紐づくギア一覧の取得
  const fetchGears = async () => {
    if (!selectedCampId) return;

    const { data, error } = await supabase
      .from('gears')
      .select('*')
      .eq('camp_id', selectedCampId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch Gears Error:', error);
      return;
    }

    if (data) setGears(data);
  };

  useEffect(() => {
    fetchCamps();
  }, []);

  useEffect(() => {
    if (selectedCampId) {
      fetchGears();
    }
  }, [selectedCampId]);

  // 新しいキャンプの追加処理
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
      console.error('Camp Creation Error:', error);
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

  // キャンプ名の編集保存処理
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

  // 公開・非公開の切り替え処理
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

    alert(
      newPublicStatus
        ? '🌐 「みんなのギアギャラリー」に公開しました！'
        : '🔒 非公開に設定しました。'
    );
  };

  // キャンプ自体の削除処理
  const handleDeleteCamp = async () => {
    if (!selectedCampId) return;

    const currentCamp = camps.find((c) => c.id === selectedCampId);
    const campName = currentCamp ? `「${currentCamp.title}」` : 'このキャンプ';

    if (camps.length <= 1) {
      alert('最後の1つのキャンプは削除できません。\n※別のキャンプを作成してから削除してください。');
      return;
    }

    const confirmed = window.confirm(
      `${campName} を削除してもよろしいですか？\n※このキャンプに含まれるギアデータも削除されます。`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('camps')
      .delete()
      .eq('id', selectedCampId);

    if (error) {
      alert(`キャンプの削除に失敗しました:\n${error.message}`);
      return;
    }

    const remainingCamps = camps.filter((c) => c.id !== selectedCampId);
    setCamps(remainingCamps);
    if (remainingCamps.length > 0) {
      setSelectedCampId(remainingCamps[0].id);
    } else {
      setSelectedCampId('');
      fetchCamps();
    }
  };

  // ギアの一括削除処理
  const handleDeleteAllGears = async () => {
    if (!selectedCampId) return;
    const currentCamp = camps.find((c) => c.id === selectedCampId);
    const campName = currentCamp ? `「${currentCamp.title}」` : 'このキャンプ';

    const confirmed = window.confirm(
      `${campName} に登録されているギア (${gears.length}件) をすべて削除してもよろしいですか？\n※他のキャンプのギアは削除されません。`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('gears')
      .delete()
      .eq('camp_id', selectedCampId);

    if (error) {
      alert(`一括削除に失敗しました:\n${error.message}`);
      return;
    }

    fetchGears();
  };

  // 当日の朝用: 「持っていく」ギアのみパッキングチェックを外す（0%にする）
  const handleResetAllPacked = async () => {
    if (!selectedCampId) return;
    const confirmed = window.confirm('当日のパッキングチェック（「詰めた！」）のみをリセットして、0%から準備を開始しますか？\n※「持っていく/お休み」の選定は変更されません。');
    if (!confirmed) return;

    const { error } = await supabase
      .from('gears')
      .update({ is_packed: false })
      .eq('camp_id', selectedCampId);

    if (error) {
      alert(`一括解除に失敗しました:\n${error.message}`);
      return;
    }

    fetchGears();
  };

  // 全ギアを「詰めた！」状態にする
  const handleCheckAllPacked = async () => {
    if (!selectedCampId) return;

    const { error } = await supabase
      .from('gears')
      .update({ is_packed: true })
      .eq('camp_id', selectedCampId);

    if (error) {
      alert(`一括更新に失敗しました:\n${error.message}`);
      return;
    }

    fetchGears();
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
    if (!selectedCampId) {
      alert('キャンプが選択されていません。');
      return;
    }

    const fullName = `${item.brand || ''} ${item.product_name || ''} ${item.model_number || ''}`.trim();
    const cat = item.category || 'ベースギア';
    const isConsumable = cat === '食料・消耗品';

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
      is_selected: true, // デフォルト「持っていく」
      is_consumable: isConsumable,
      product_url: item.productUrl || '',
    }]);
    fetchGears();
  };

  // 当日パッキング状態の切り替え
  const togglePacked = async (id: string, currentStatus: boolean) => {
    await supabase.from('gears').update({ is_packed: !currentStatus }).eq('id', id);
    fetchGears();
  };

  // ★ 今回持っていくかどうかの選定切り替え
  const toggleSelected = async (id: string, currentStatus: boolean) => {
    await supabase.from('gears').update({ is_selected: !currentStatus }).eq('id', id);
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

  const handleReorderGears = (reorderedGears: any[]) => {
    setGears(reorderedGears);
  };

  const currentSelectedCamp = camps.find((c) => c.id === selectedCampId);

  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* アプリヘッダー */}
        <header className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              🏕️ <span className="text-[#FF5500]">Camp Gear</span> Manager
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">重量シミュレーション＆5カテゴリーパッキング</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/community"
              className="bg-[#27272A] hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              🌐 みんなのギアを見る →
            </Link>

            <div className="flex items-center gap-1 bg-[#18181B] p-1.5 rounded-xl border border-zinc-800">
              <span className="text-xs font-bold text-[#FF5500] pl-1">⛺</span>
              <select
                value={selectedCampId}
                onChange={(e) => setSelectedCampId(e.target.value)}
                className="bg-[#27272A] text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-[#FF5500] cursor-pointer max-w-[150px] truncate"
              >
                {camps.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.title}
                  </option>
                ))}
              </select>

              <button
                onClick={handleTogglePublic}
                className={`px-2 py-1.5 rounded-lg text-xs font-bold transition border cursor-pointer ${
                  currentSelectedCamp?.is_public
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                }`}
                title="このキャンプをコミュニティに公開/非公開設定"
              >
                {currentSelectedCamp?.is_public ? '🌐 公開中' : '🔒 非公開'}
              </button>

              <button
                onClick={startEditCampTitle}
                className="p-1.5 bg-[#27272A] hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs transition border border-zinc-700 cursor-pointer"
                title="選択中のキャンプ名を変更"
              >
                ✏️
              </button>

              <button
                onClick={handleDeleteCamp}
                className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white rounded-lg text-xs transition border border-red-800/60 cursor-pointer"
                title="選択中のキャンプ自体を削除"
              >
                🗑️
              </button>

              <button
                onClick={() => setIsAddCampOpen(true)}
                className="bg-[#FF5500] hover:bg-[#E04B00] text-white px-2 py-1.5 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                title="新しいキャンプを作成"
              >
                ＋新規
              </button>
            </div>
          </div>
        </header>

        {/* キャンプ名 編集モーダル */}
        {isEditCampOpen && (
          <div className="bg-[#18181B] border border-[#FFB800]/50 p-4 rounded-2xl space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              ✏️ キャンプ名を変更
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={editCampTitle}
                onChange={(e) => setEditCampTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateCampTitle()}
                className="flex-1 bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FFB800]"
              />
              <button
                onClick={handleUpdateCampTitle}
                className="bg-[#FFB800] hover:bg-amber-600 text-black px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                保存
              </button>
              <button
                onClick={() => setIsEditCampOpen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                中止
              </button>
            </div>
          </div>
        )}

        {/* 新規キャンプ作成ポップアップ */}
        {isAddCampOpen && (
          <div className="bg-[#18181B] border border-[#FF5500]/50 p-4 rounded-2xl space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              ⛺ 新しいキャンプ（パッキングリスト）を追加
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="例: 2026年8月 ふもとっぱらソロキャン"
                value={newCampTitle}
                onChange={(e) => setNewCampTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCamp()}
                className="flex-1 bg-[#27272A] border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5500]"
              />
              <button
                onClick={handleCreateCamp}
                disabled={isSubmitting}
                className="bg-[#FF5500] hover:bg-[#E04B00] disabled:bg-zinc-600 text-white px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                {isSubmitting ? '作成中...' : '作成'}
              </button>
              <button
                onClick={() => setIsAddCampOpen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                中止
              </button>
            </div>
          </div>
        )}

        <WeightsSummary gears={gears} onCategoryClick={scrollToCategory} />
        <GearSearch onAddGear={handleAddGear} />
        <GearList
          gears={gears} openCategories={openCategories} onToggleCategoryOpen={toggleCategoryOpen}
          onTogglePacked={togglePacked}
          onToggleSelected={toggleSelected}
          onUpdateQuantity={updateQuantity}
          onUpdateGear={updateGear}
          onDeleteGear={deleteGear}
          onDeleteAllGears={handleDeleteAllGears}
          onResetAllPacked={handleResetAllPacked}
          onCheckAllPacked={handleCheckAllPacked}
          onReorderGears={handleReorderGears}
        />
        <CsvManager gears={gears} selectedCampId={selectedCampId} onGearsUpdated={fetchGears} />

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