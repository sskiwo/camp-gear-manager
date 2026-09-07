'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShoppingBag, ExternalLink, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getOrCreateAnonymousUser } from '@/lib/auth';
import { buildAmazonUrl } from '@/utils/affiliate';
import Footer from '@/components/Footer';

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

const STORAGE_KEY_OWNED_CAMPS = 'camp_owned_tokens_map';

function CommunityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCampId = searchParams.get('from');

  const [activeTab, setActiveTab] = useState<'camps' | 'ranking'>('camps');
  const [selectedCategory, setSelectedCategory] = useState<string>('すべて');

  const [publicCamps, setPublicCamps] = useState<PublicCamp[]>([]);
  const [allGearsList, setAllGearsList] = useState<Gear[]>([]);
  const [myCamps, setMyCamps] = useState<CampOption[]>([]);
  const [selectedAddCampId, setSelectedAddCampId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [expandedCampId, setExpandedCampId] = useState<string | null>(null);

  const [addingGear, setAddingGear] = useState<PopularGear | Gear | null>(null);

  const handleGoBack = () => {
    if (fromCampId) {
      router.push(`/?camp=${fromCampId}`);
    } else {
      router.push('/');
    }
  };

  const fetchMyCamps = async () => {
    try {
      let savedOwnedIds: string[] = [];
      const savedOwned = localStorage.getItem(STORAGE_KEY_OWNED_CAMPS);
      if (savedOwned) {
        savedOwnedIds = Object.keys(JSON.parse(savedOwned));
      }

      if (savedOwnedIds.length === 0) {
        setMyCamps([]);
        return;
      }

      const { data } = await supabase
        .from('camps')
        .select('id, title')
        .in('id', savedOwnedIds)
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        const mapped = data.map((c) => {
          try {
            const cached = localStorage.getItem(`camp_meta_${c.id}`);
            if (cached) {
              const parsed = JSON.parse(cached);
              return { ...c, title: (parsed.title && parsed.title.trim()) || c.title };
            }
          } catch {}
          return c;
        });
        setMyCamps(mapped);
        if (fromCampId && mapped.some((c) => c.id === fromCampId)) {
          setSelectedAddCampId(fromCampId);
        } else {
          setSelectedAddCampId(mapped[0].id);
        }
      } else {
        setMyCamps([]);
      }
    } catch (e) {
      console.warn('Failed to load owned camps:', e);
    }
  };

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

  const handleCloneCamp = async (camp: PublicCamp) => {
    const confirmed = window.confirm(
      `「${camp.title}」のギア構成 (${camp.gears.length}点) を自分のパッキングリストへ複製して追加しますか？`
    );

    if (!confirmed) return;

    const userId = await getOrCreateAnonymousUser();

    const { data: newCamp, error: createCampErr } = await supabase
      .from('camps')
      .insert([{ title: `[コピー] ${camp.title}`, is_public: false, user_id: userId || undefined }])
      .select()
      .single();

    if (createCampErr || !newCamp) {
      alert(`複製に失敗しました:\n${createCampErr?.message}`);
      return;
    }

    try {
      const current = localStorage.getItem(STORAGE_KEY_OWNED_CAMPS);
      const parsed = current ? JSON.parse(current) : {};
      parsed[newCamp.id] = 'owned';
      localStorage.setItem(STORAGE_KEY_OWNED_CAMPS, JSON.stringify(parsed));
    } catch (e) {
      console.warn('Failed to register ownership:', e);
    }

    if (camp.gears.length > 0) {
      const clonedGears = camp.gears.map((g) => ({
        camp_id: newCamp.id,
        user_id: userId || undefined,
        name: g.name,
        brand: g.brand || '',
        product_name: g.name,
        category: g.category || 'ベースギア',
        weight: g.weight || 0,
        price: g.price || 0,
        quantity: g.quantity || 1,
        is_packed: false,
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
    window.location.href = `/?camp=${newCamp.id}`;
  };

  const handleAddSingleGear = async () => {
    if (!addingGear || !selectedAddCampId) return;

    const userId = await getOrCreateAnonymousUser();
    const cat = addingGear.category || 'ベースギア';
    const isConsumable = cat === '食料・消耗品';

    const { error } = await supabase.from('gears').insert([
      {
        camp_id: selectedAddCampId,
        user_id: userId || undefined,
        name: addingGear.name,
        brand: addingGear.brand || '',
        product_name: addingGear.name,
        category: cat,
        weight: Number(addingGear.weight) || 0,
        price: Number(addingGear.price) || 0,
        quantity: 1,
        is_packed: false,
        is_selected: true,
        is_consumable: isConsumable,
        product_url: addingGear.product_url || '',
      },
    ]);

    if (error) {
      alert(`ギアの追加に失敗しました:\n${error.message}`);
      return;
    }

    const targetCamp = myCamps.find((c) => c.id === selectedAddCampId);
    alert(`🎉 「${targetCamp?.title || '自分のキャンプ'}」に「${addingGear.name}」を追加しました！`);
    setAddingGear(null);
  };

  const getAmazonSearchUrl = (brand?: string, name?: string) => {
    return buildAmazonUrl(name || '', brand);
  };

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
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-3 sm:p-4 md:p-8 font-sans flex flex-col justify-between">
      <div className="max-w-5xl mx-auto space-y-3.5 sm:space-y-5 w-full flex-1">
        {/* ヘッダー */}
        <header className="border-b border-zinc-800 pb-3 flex items-center justify-between gap-2 w-full">
          <div className="min-w-0 flex-1">
            <h1 className="text-[17px] sm:text-xl md:text-2xl font-black text-white flex items-center gap-1.5 whitespace-nowrap">
              <span>🌐</span>
              <span className="text-[#00E5FF]">みんなのギア</span>
              <span>ギャラリー</span>
            </h1>
            <p className="text-[10.5px] sm:text-xs text-zinc-400 mt-0.5 leading-tight">
              全国のパッキング構成＆人気ランキング
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoBack}
            className="bg-[#27272A] hover:bg-zinc-700 text-zinc-200 hover:text-white px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition border border-zinc-700 shrink-0 flex items-center gap-1 active:scale-95 cursor-pointer shadow-sm"
            title="直前に開いていたキャンプへ戻る"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-zinc-400" />
            <span>戻る</span>
          </button>
        </header>

        {/* タブ切り替え */}
        <div className="grid grid-cols-2 gap-1.5 bg-[#18181B] p-1.5 rounded-2xl border border-zinc-800 w-full">
          <button
            onClick={() => setActiveTab('camps')}
            className={`py-2 px-1 rounded-xl text-[11.5px] sm:text-xs font-extrabold transition cursor-pointer text-center flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'camps'
                ? 'bg-[#FF5500] text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>⛺ パッキング</span>
            <span className="text-[10.5px] opacity-90 font-mono font-normal">
              ({publicCamps.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab('ranking')}
            className={`py-2 px-1 rounded-xl text-[11.5px] sm:text-xs font-extrabold transition cursor-pointer text-center flex items-center justify-center gap-1 whitespace-nowrap ${
              activeTab === 'ranking'
                ? 'bg-[#FFB800] text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🏆 ランキング TOP10</span>
          </button>
        </div>

        {/* カテゴリー絞り込み */}
        <div className="bg-[#18181B] p-2 rounded-2xl border border-zinc-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar -mx-0.5 px-0.5">
            <span className="text-[11px] font-bold text-zinc-400 pl-1 shrink-0 whitespace-nowrap">
              🏷️ カテゴリー:
            </span>
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
                  className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold border transition cursor-pointer shrink-0 whitespace-nowrap ${
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
        </div>

        {/* 単品ギア追加モーダル */}
        {addingGear && (
          <div className="bg-[#18181B] border border-[#FFB800] p-3.5 sm:p-4 rounded-2xl space-y-3 shadow-2xl animate-fade-in">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 truncate">
              ➕ 「{addingGear.name}」を自分のキャンプに追加
            </h3>
            {myCamps.length === 0 ? (
              <p className="text-xs text-zinc-400">
                追加先のマイキャンプが見つかりません。先にトップ画面でキャンプを作成してください。
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedAddCampId}
                  onChange={(e) => setSelectedAddCampId(e.target.value)}
                  className="flex-1 bg-[#27272A] text-white text-xs font-bold px-3 py-2 rounded-xl border border-zinc-700 focus:outline-none focus:border-[#FFB800] truncate"
                >
                  {myCamps.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.title}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleAddSingleGear}
                    className="flex-1 sm:flex-none bg-[#FFB800] hover:bg-amber-600 text-black px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
                  >
                    追加する
                  </button>
                  <button
                    onClick={() => setAddingGear(null)}
                    className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border border-zinc-700 whitespace-nowrap"
                  >
                    中止
                  </button>
                </div>
              </div>
            )}
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
            <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center space-y-2">
              <p className="text-zinc-400 text-xs font-bold">まだ公開されているパッキングリストがありません。</p>
              <p className="text-zinc-500 text-[11px]">
                メイン画面でご自身のキャンプを「🌐 公開中」に設定すると、ここに掲載されます！
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {publicCamps.map((camp) => {
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
                    className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 rounded-2xl p-3.5 sm:p-5 space-y-3 shadow-xl transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-1.5 truncate">
                          <span>⛺</span>
                          <span className="truncate">{camp.title}</span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] sm:text-xs text-zinc-400 mt-1 font-bold">
                          <span>📦 {displayGears.length}点</span>
                          <span>⚖️ {(totalWeight / 1000).toFixed(2)}kg</span>
                          {totalPrice > 0 && <span>💰 ¥{totalPrice.toLocaleString()}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          onClick={() => setExpandedCampId(isExpanded ? null : camp.id)}
                          className="bg-[#27272A] hover:bg-zinc-700 text-zinc-200 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition border border-zinc-700 cursor-pointer whitespace-nowrap"
                        >
                          {isExpanded ? '▲ 閉じる' : '▼ 中身を見る'}
                        </button>

                        <button
                          onClick={() => handleCloneCamp(camp)}
                          className="bg-[#FF5500] hover:bg-[#E04B00] text-white px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition shadow-md cursor-pointer active:scale-95 whitespace-nowrap"
                        >
                          📋 1タップで複製
                        </button>
                      </div>
                    </div>

                    {/* パッキングギア詳細 */}
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

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                                {catGears.map((g) => (
                                  <div
                                    key={g.id}
                                    className="bg-[#27272A] p-2 sm:p-2.5 rounded-xl border border-zinc-700/60 flex items-center justify-between text-xs gap-2"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <span className="font-bold text-white truncate block text-[11px] sm:text-xs">
                                        {g.name}
                                      </span>
                                      {g.brand && (
                                        <span className="text-[10px] text-zinc-400 truncate block">
                                          {g.brand}
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-zinc-400 text-[10px] sm:text-[11px] font-mono">
                                        {g.weight * (g.quantity || 1)}g
                                      </span>

                                      <a
                                        href={getAmazonSearchUrl(g.brand, g.name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold transition flex items-center gap-0.5"
                                        title="Amazonで探す"
                                      >
                                        <ShoppingBag className="w-2.5 h-2.5 text-amber-400" />
                                        <span>Amazon</span>
                                      </a>

                                      <button
                                        onClick={() => setAddingGear(g)}
                                        className="text-[10px] bg-zinc-800 hover:bg-[#FFB800] hover:text-black border border-zinc-600 px-1.5 py-0.5 rounded font-bold transition cursor-pointer whitespace-nowrap"
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
            <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center space-y-2">
              <p className="text-zinc-400 text-xs font-bold">
                {selectedCategory === 'すべて'
                  ? 'ランキングを集計するギアデータがまだありません。'
                  : `「${selectedCategory}」のランキングデータがまだありません。`}
              </p>
              <p className="text-zinc-500 text-[11px]">公開中のパッキングリストが増えると、自動的に集計されます！</p>
            </div>
          ) : (
            <div className="space-y-2.5 sm:space-y-3">
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
                    className="bg-[#18181B] border border-zinc-800 hover:border-zinc-700 p-3 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 shadow-lg transition"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <span className="text-xs sm:text-sm font-black text-amber-400 shrink-0 w-11 sm:w-12 text-center bg-[#27272A] py-1 px-1.5 rounded-xl border border-zinc-700 font-mono">
                        {rankBadge}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            style={{ color: catColor, borderColor: `${catColor}60`, backgroundColor: `${catColor}20` }}
                            className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-bold border shrink-0"
                          >
                            {gear.category}
                          </span>
                          {gear.brand && (
                            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shrink-0 truncate max-w-[100px]">
                              {gear.brand}
                            </span>
                          )}
                          <h4 className="text-xs sm:text-sm font-black text-white truncate max-w-[200px] sm:max-w-md">
                            {gear.name}
                          </h4>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] sm:text-xs text-zinc-400 mt-1 font-mono">
                          <span>🔥 採用: <strong className="text-white">{gear.count}人</strong></span>
                          <span>⚖️ {gear.weight}g</span>
                          {gear.price > 0 && <span>💰 ¥{gear.price.toLocaleString()}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto pt-1 sm:pt-0">
                      <a
                        href={getAmazonSearchUrl(gear.brand, gear.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-2.5 rounded-xl bg-amber-950/30 hover:bg-amber-900/50 border border-amber-500/50 text-amber-300 hover:text-amber-200 text-[11px] font-bold transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer whitespace-nowrap"
                        title="Amazonで商品を探す"
                      >
                        <ShoppingBag className="w-3 h-3 text-amber-400" />
                        <span>Amazon</span>
                        <ExternalLink className="w-2.5 h-2.5 text-amber-400/80" />
                      </a>

                      <button
                        onClick={() => setAddingGear(gear)}
                        className="h-8 bg-[#FFB800] hover:bg-amber-600 text-black px-3 rounded-xl text-[11px] font-extrabold transition shrink-0 cursor-pointer flex items-center gap-1 shadow-sm active:scale-95 whitespace-nowrap"
                      >
                        <span>＋</span>
                        <span>追加</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* 🎯 みんなのギャラリー最下部にもフッターを設置 */}
      <div className="max-w-5xl mx-auto w-full">
        <Footer />
      </div>
    </main>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090B] text-zinc-400 p-8 text-center text-xs">ギャラリーを読み込み中...</div>}>
      <CommunityContent />
    </Suspense>
  );
}