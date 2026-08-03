'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type Gear = {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  weight: number;
  price: number;
  quantity?: number;
  product_url?: string;
};

type PublicCamp = {
  id: string;
  title: string;
  created_at: string;
  gears: Gear[];
};

type PopularGear = {
  name: string;
  brand: string;
  category: string;
  weight: number;
  price: number;
  count: number;
  product_url?: string;
};

type CampOption = {
  id: string;
  title: string;
};

const CATEGORIES = [
  'すべて',
  'ベースギア',
  '調理ギア',
  '衣類',
  'その他・日用品',
  '食料・消耗品',
];

const CATEGORY_COLORS: Record<string, string> = {
  ベースギア: '#FF5500',
  調理ギア: '#FFB800',
  衣類: '#00E5FF',
  'その他・日用品': '#E040FB',
  '食料・消耗品': '#00E676',
};

export default function CommunityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'camps' | 'ranking'>('camps');
  const [selectedCategory, setSelectedCategory] = useState<string>('すべて');

  const [publicCamps, setPublicCamps] = useState<PublicCamp[]>([]);
  const [allGearsList, setAllGearsList] = useState<Gear[]>([]);
  const [myCamps, setMyCamps] = useState<CampOption[]>([]);
  const [selectedAddCampId, setSelectedAddCampId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedCampId, setExpandedCampId] = useState<string | null>(null);

  // 単品ギア追加モーダル用ステート
  const [addingGear, setAddingGear] = useState<PopularGear | Gear | null>(null);

  // 自分のキャンプ一覧を取得
  const fetchMyCamps = async () => {
    const { data } = await supabase
      .from('camps')
      .select('id, title')
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setMyCamps(data);
      setSelectedAddCampId(data[0].id);
    }
  };

  // 公開中のキャンプ＆ギア一覧を取得
  const fetchPublicData = async () => {
    setLoading(true);

    const { data: campsData, error: campErr } = await supabase
      .from('camps')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (campErr) {
      console.error('Fetch Public Camps Error:', campErr);
      setLoading(false);
      return;
    }

    if (campsData && campsData.length > 0) {
      const campIds = campsData.map((c) => c.id);

      const { data: gearsData, error: gearErr } = await supabase
        .from('gears')
        .select('*')
        .in('camp_id', campIds);

      if (gearErr) {
        console.error('Fetch Gears Error:', gearErr);
      }

      const allGears = gearsData || [];
      setAllGearsList(allGears);

      const gearsByCamp: Record<string, Gear[]> = {};
      allGears.forEach((g) => {
        if (!gearsByCamp[g.camp_id]) gearsByCamp[g.camp_id] = [];
        gearsByCamp[g.camp_id].push(g);
      });

      const formatted: PublicCamp[] = campsData.map((c) => ({
        id: c.id,
        title: c.title,
        created_at: c.created_at,
        gears: gearsByCamp[c.id] || [],
      }));

      setPublicCamps(formatted);
    } else {
      setPublicCamps([]);
      setAllGearsList([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMyCamps();
    fetchPublicData();
  }, []);

  // 他のキャンパーのパッキングリストを自分のリストへ複製（コピー）する機能
  const handleCloneCamp = async (camp: PublicCamp) => {
    const confirmed = window.confirm(
      `「${camp.title}」のギア構成 (${camp.gears.length}点) を自分のパッキングリストへ複製して追加しますか？`
    );

    if (!confirmed) return;

    const { data: newCamp, error: createCampErr } = await supabase
      .from('camps')
      .insert([{ title: `[コピー] ${camp.title}`, is_public: false }])
      .select()
      .single();

    if (createCampErr || !newCamp) {
      alert(`複製に失敗しました:\n${createCampErr?.message}`);
      return;
    }

    if (camp.gears.length > 0) {
      const clonedGears = camp.gears.map((g) => ({
        camp_id: newCamp.id,
        name: g.name,
        brand: g.brand || '',
        product_name: g.name,
        category: g.category || 'ベースギア',
        weight: g.weight || 0,
        price: g.price || 0,
        quantity: g.quantity || 1,
        is_packed: true,
        is_selected: true,
        is_consumable: (g.category || '') === '食料・消耗品',
        product_url: g.product_url || '',
      }));

      const { error: cloneGearErr } = await supabase.from('gears').insert(clonedGears);

      if (cloneGearErr) {
        alert(`ギアの複製に一部失敗しました:\n${cloneGearErr.message}`);
        return;
      }
    }

    alert('🎉 自分のパッキングリストに複製しました！');
    router.push('/');
  };

  // 単品ギアを自分のキャンプに追加する機能
  const handleAddSingleGear = async () => {
    if (!addingGear || !selectedAddCampId) return;

    const cat = addingGear.category || 'ベースギア';
    const isConsumable = cat === '食料・消耗品';

    const { error } = await supabase.from('gears').insert([
      {
        camp_id: selectedAddCampId,
        name: addingGear.name,
        brand: addingGear.brand || '',
        product_name: addingGear.name,
        category: cat,
        weight: Number(addingGear.weight) || 0,
        price: Number(addingGear.price) || 0,
        quantity: 1,
        is_packed: true,
        is_selected: true,
        is_consumable: isConsumable,
        product_url: addingGear.product_url || '',
      },
    ]);

    if (error) {
      alert(`ギアの追加に失敗しました:\n${error.message}`);
      return;
    }

    alert(`🎉 「${addingGear.name}」を自分のキャンプに追加しました！`);
    setAddingGear(null);
  };

  // 🏆 カテゴリー絞り込みに対応した人気ギアランキング集計
  const getFilteredRanking = (): PopularGear[] => {
    const targetGears =
      selectedCategory === 'すべて'
        ? allGearsList
        : allGearsList.filter((g) => (g.category || 'ベースギア') === selectedCategory);

    const gearCounts: Record<string, PopularGear> = {};

    targetGears.forEach((g) => {
      const cleanName = (g.name || '名称未設定').trim();
      if (!cleanName) return;

      if (!gearCounts[cleanName]) {
        gearCounts[cleanName] = {
          name: cleanName,
          brand: g.brand || '',
          category: g.category || 'ベースギア',
          weight: g.weight || 0,
          price: g.price || 0,
          count: 1,
          product_url: g.product_url || '',
        };
      } else {
        gearCounts[cleanName].count += 1;
      }
    });

    return Object.values(gearCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const popularGears = getFilteredRanking();

  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ヘッダー */}
        <header className="border-b border-zinc-800 pb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              🌐 <span className="text-[#00E5FF]">みんなのギア</span> ギャラリー
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              全国のキャンパーのパッキング構成＆人気ギアランキング！
            </p>
          </div>

          <Link
            href="/"
            className="bg-[#27272A] hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition border border-zinc-700 shrink-0 cursor-pointer"
          >
            ← マイリストに戻る
          </Link>
        </header>

        {/* タブ切り替えボタン */}
        <div className="flex items-center gap-2 bg-[#18181B] p-1.5 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setActiveTab('camps')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
              activeTab === 'camps'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            ⛺ パッキングリスト ({publicCamps.length}件)
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer text-center ${
              activeTab === 'ranking'
                ? 'bg-[#FFB800] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            🏆 人気ギアランキング TOP 10
          </button>
        </div>

        {/* 🏷️ カテゴリー絞り込みフィルターボタン */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#18181B] p-2 rounded-2xl border border-zinc-800">
          <span className="text-[11px] font-bold text-zinc-400 pl-1">🏷️ カテゴリー:</span>
          {CATEGORIES.map((cat) => {
            const catColor = CATEGORY_COLORS[cat] || '#00E5FF';
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  backgroundColor: isSelected ? (cat === 'すべて' ? '#3F3F46' : `${catColor}30`) : 'transparent',
                  borderColor: isSelected ? (cat === 'すべて' ? '#A1A1AA' : catColor) : '#27272A',
                  color: isSelected ? (cat === 'すべて' ? '#FFFFFF' : catColor) : '#A1A1AA',
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isSelected ? 'font-black shadow-sm' : 'hover:text-white hover:border-zinc-600'
                }`}
              >
                {cat === 'ベースギア'
                  ? '⛺ ベース'
                  : cat === '調理ギア'
                  ? '🍳 調理'
                  : cat === '衣類'
                  ? '👕 衣類'
                  : cat === 'その他・日用品'
                  ? '📦 その他'
                  : cat === '食料・消耗品'
                  ? '🍱 食料'
                  : '🌐 すべて'}
              </button>
            );
          })}
        </div>

        {/* 単品ギア追加モーダル */}
        {addingGear && (
          <div className="bg-[#18181B] border border-[#FFB800] p-4 rounded-2xl space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              ➕ 「{addingGear.name}」を自分のキャンプに追加
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedAddCampId}
                onChange={(e) => setSelectedAddCampId(e.target.value)}
                className="flex-1 bg-[#27272A] text-white text-xs font-bold px-3 py-2 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#FFB800]"
              >
                {myCamps.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.title}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddSingleGear}
                className="bg-[#FFB800] hover:bg-amber-600 text-black px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                追加する
              </button>
              <button
                onClick={() => setAddingGear(null)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
              >
                中止
              </button>
            </div>
          </div>
        )}

        {/* ロード中表示 */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-xs font-bold animate-pulse">
            全国のパッキングリストを集計中...⛺
          </div>
        ) : activeTab === 'camps' ? (
          /* タブ1: みんなのパッキングリスト */
          publicCamps.length === 0 ? (
            <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-8 text-center space-y-3">
              <p className="text-zinc-400 text-xs font-bold">まだ公開されているパッキングリストがありません。</p>
              <p className="text-zinc-500 text-[11px]">
                メイン画面でご自身のキャンプを「🌐 公開中」に設定すると、ここに一番乗りで掲載されます！
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {publicCamps.map((camp) => {
                // カテゴリー絞り込みの適用
                const displayGears =
                  selectedCategory === 'すべて'
                    ? camp.gears
                    : camp.gears.filter((g) => (g.category || 'ベースギア') === selectedCategory);

                if (selectedCategory !== 'すべて' && displayGears.length === 0) return null;

                const totalWeight = displayGears.reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);
                const totalPrice = displayGears.reduce((sum, g) => sum + (g.price || 0) * (g.quantity || 1), 0);
                const isExpanded = expandedCampId === camp.id;

                return (
                  <div
                    key={camp.id}
                    className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-white flex items-center gap-2">
                          ⛺ {camp.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-bold">
                          <span>📦 {displayGears.length} 点 {selectedCategory !== 'すべて' ? `(${selectedCategory})` : ''}</span>
                          <span>⚖️ {(totalWeight / 1000).toFixed(2)} kg</span>
                          <span>💰 ¥{totalPrice.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedCampId(isExpanded ? null : camp.id)}
                          className="bg-[#27272A] hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-xl text-xs font-bold transition border border-zinc-700 cursor-pointer"
                        >
                          {isExpanded ? '▲ 閉じる' : '▼ 中身を見る'}
                        </button>

                        <button
                          onClick={() => handleCloneCamp(camp)}
                          className="bg-[#FF5500] hover:bg-[#E04B00] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                        >
                          📋 1タップで複製
                        </button>
                      </div>
                    </div>

                    {/* パッキングギア詳細（5カテゴリーグループ分け表示） */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-zinc-800 space-y-3 animate-fade-in">
                        {['ベースギア', '調理ギア', '衣類', 'その他・日用品', '食料・消耗品'].map((catName) => {
                          if (selectedCategory !== 'すべて' && selectedCategory !== catName) return null;

                          const catGears = displayGears.filter((g) => (g.category || 'ベースギア') === catName);
                          if (catGears.length === 0) return null;

                          const catColor = CATEGORY_COLORS[catName] || '#FF5500';

                          return (
                            <div key={catName} className="space-y-1.5">
                              <span
                                style={{ color: catColor }}
                                className="text-[11px] font-black tracking-wide block"
                              >
                                {catName === 'ベースギア'
                                  ? '⛺ ベースギア'
                                  : catName === '調理ギア'
                                  ? '🍳 調理ギア'
                                  : catName === '衣類'
                                  ? '👕 衣類'
                                  : catName === 'その他・日用品'
                                  ? '📦 その他・日用品'
                                  : '🍱 食料・消耗品'}
                              </span>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {catGears.map((g) => (
                                  <div
                                    key={g.id}
                                    className="bg-[#27272A] p-2.5 rounded-xl border border-zinc-700/60 flex items-center justify-between text-xs"
                                  >
                                    <span className="font-bold text-white truncate">{g.name}</span>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      <span className="text-zinc-400 text-[11px] font-mono">
                                        {g.weight * (g.quantity || 1)}g
                                      </span>
                                      <button
                                        onClick={() => setAddingGear(g)}
                                        className="text-[10px] bg-zinc-800 hover:bg-[#FFB800] hover:text-black border border-zinc-600 px-1.5 py-0.5 rounded font-bold transition cursor-pointer"
                                        title="このギアのみ自分のリストに追加"
                                      >
                                        ＋追加
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* タブ2: 🏆 人気ギアランキング TOP 10 */
          popularGears.length === 0 ? (
            <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-8 text-center space-y-2">
              <p className="text-zinc-400 text-xs font-bold">
                {selectedCategory === 'すべて'
                  ? 'ランキングを集計するギアデータがまだありません。'
                  : `「${selectedCategory}」のランキングデータがまだありません。`}
              </p>
              <p className="text-zinc-500 text-[11px]">公開中のパッキングリストが増えると、自動的に集計されます！</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs font-bold text-zinc-400 flex items-center justify-between px-1">
                <span>🏆 {selectedCategory} 人気ランキング</span>
                <span>上位 10 件表示</span>
              </div>

              {popularGears.map((gear, index) => {
                const catColor = CATEGORY_COLORS[gear.category || 'ベースギア'] || '#FF5500';
                const rankBadge =
                  index === 0 ? '🥇 1位' : index === 1 ? '🥈 2位' : index === 2 ? '🥉 3位' : `${index + 1}位`;

                return (
                  <div
                    key={gear.name}
                    className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-black text-amber-400 shrink-0 w-12 text-center bg-[#27272A] py-1 px-2 rounded-xl border border-zinc-700">
                        {rankBadge}
                      </span>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            style={{ color: catColor, borderColor: `${catColor}60`, backgroundColor: `${catColor}20` }}
                            className="text-[10px] px-1.5 py-0.2 rounded font-bold border shrink-0"
                          >
                            {gear.category}
                          </span>
                          {gear.brand && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0">
                              {gear.brand}
                            </span>
                          )}
                          <h4 className="text-sm font-black text-white truncate">{gear.name}</h4>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
                          <span>🔥 採用キャンパー: <strong className="text-white">{gear.count} 人</strong></span>
                          <span>⚖️ {gear.weight}g</span>
                          {gear.price > 0 && <span>💰 ¥{gear.price.toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setAddingGear(gear)}
                      className="bg-[#FFB800] hover:bg-amber-600 text-black px-3.5 py-2 rounded-xl text-xs font-extrabold transition shrink-0 cursor-pointer text-center"
                    >
                      ➕ 自分のリストに追加
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </main>
  );
}