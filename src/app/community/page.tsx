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

const CATEGORY_COLORS: Record<string, string> = {
  ベースギア: '#FF5500',
  調理ギア: '#FFB800',
  衣類: '#00E5FF',
  'その他・日用品': '#E040FB',
  '食料・消耗品': '#00E676',
};

export default function CommunityPage() {
  const router = useRouter();
  const [publicCamps, setPublicCamps] = useState<PublicCamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCampId, setExpandedCampId] = useState<string | null>(null);

  // 公開中のキャンプ＆ギア一覧を取得
  const fetchPublicCamps = async () => {
    setLoading(true);
    // 1. 公開中のキャンプを取得
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

      // 2. それらのキャンプに紐づくギアを一括取得
      const { data: gearsData, error: gearErr } = await supabase
        .from('gears')
        .select('*')
        .in('camp_id', campIds);

      if (gearErr) {
        console.error('Fetch Gears Error:', gearErr);
      }

      const gearsByCamp: Record<string, Gear[]> = {};
      (gearsData || []).forEach((g) => {
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
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPublicCamps();
  }, []);

  // 他のキャンパーのパッキングリストを自分のリストへ複製（コピー）する機能
  const handleCloneCamp = async (camp: PublicCamp) => {
    const confirmed = window.confirm(
      `「${camp.title}」のギア構成 (${camp.gears.length}点) を自分のパッキングリストへ複製して追加しますか？`
    );

    if (!confirmed) return;

    // 1. 自分用に新しいキャンプを作成
    const { data: newCamp, error: createCampErr } = await supabase
      .from('camps')
      .insert([{ title: `[コピー] ${camp.title}`, is_public: false }])
      .select()
      .single();

    if (createCampErr || !newCamp) {
      alert(`複製に失敗しました:\n${createCampErr?.message}`);
      return;
    }

    // 2. ギア一覧を新しいキャンプIDで一括複製
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
    router.push('/'); // メイン画面へ移動
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ヘッダー */}
        <header className="border-b border-zinc-800 pb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              🌐 <span className="text-[#00E5FF]">みんなのギア</span> ギャラリー
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">他のキャンパーの装備構成・軽量化パッキングをチェック！</p>
          </div>

          <Link
            href="/"
            className="bg-[#27272A] hover:bg-zinc-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition border border-zinc-700 shrink-0"
          >
            ← マイリストに戻る
          </Link>
        </header>

        {/* リスト表示 */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500 text-xs font-bold animate-pulse">
            全国のパッキングリストを読み込み中...⛺
          </div>
        ) : publicCamps.length === 0 ? (
          <div className="bg-[#18181B] border border-zinc-800 rounded-2xl p-8 text-center space-y-3">
            <p className="text-zinc-400 text-xs font-bold">まだ公開されているパッキングリストがありません。</p>
            <p className="text-zinc-500 text-[11px]">
              メイン画面でご自身のキャンプを「🌐 公開中」に設定すると、ここに一番乗りで掲載されます！
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {publicCamps.map((camp) => {
              const totalWeight = camp.gears.reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);
              const totalPrice = camp.gears.reduce((sum, g) => sum + (g.price || 0) * (g.quantity || 1), 0);
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
                        <span>📦 {camp.gears.length} 点</span>
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

                  {/* 中身（ギアカード展開表示） */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-zinc-800 space-y-2 animate-fade-in">
                      <span className="text-[11px] font-bold text-zinc-400 block mb-1">
                        🎒 パッキングギア詳細:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {camp.gears.map((g) => {
                          const catColor = CATEGORY_COLORS[g.category || 'ベースギア'] || '#FF5500';
                          return (
                            <div
                              key={g.id}
                              className="bg-[#27272A] p-2.5 rounded-xl border border-zinc-700/60 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  style={{ color: catColor, borderColor: `${catColor}60`, backgroundColor: `${catColor}20` }}
                                  className="text-[10px] px-1.5 py-0.2 rounded font-bold border shrink-0"
                                >
                                  {g.category || 'ベースギア'}
                                </span>
                                <span className="font-bold text-white truncate">{g.name}</span>
                              </div>
                              <span className="text-zinc-400 text-[11px] shrink-0 font-mono ml-2">
                                {g.weight * (g.quantity || 1)}g
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}