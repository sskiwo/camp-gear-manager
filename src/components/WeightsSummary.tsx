'use client';

type GearItem = {
  id: string;
  name: string;
  weight: number;
  price: number;
  quantity?: number;
  is_packed: boolean;
  is_selected?: boolean;
  is_consumable: boolean;
  category?: string;
};

type Props = {
  gears: GearItem[];
  onCategoryClick?: (catName: string) => void;
};

const CATEGORIES = [
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

export default function WeightsSummary({ gears, onCategoryClick }: Props) {
  // 持参対象(is_selected !== false)のギアを集計対象に
  const selectedGears = gears.filter((g) => g.is_selected !== false);

  // 各カテゴリーごとの合計重量を算出
  const categoryWeights = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = selectedGears
      .filter((g) => (g.category || 'ベースギア') === cat)
      .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);
    return acc;
  }, {} as Record<string, number>);

  // ベース重量 (食料・消耗品以外) = 帰りの重量
  const baseWeight = selectedGears
    .filter((g) => !g.is_consumable && (g.category || 'ベースギア') !== '食料・消耗品')
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 消耗品重量 (食料・消耗品) ★ 安全な配列集計へ修正
  const consumableWeight = selectedGears
    .filter((g) => g.is_consumable || (g.category || '') === '食料・消耗品')
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 総重量 = 行きの重量
  const totalWeight = selectedGears.reduce(
    (sum, g) => sum + (g.weight || 0) * (g.quantity || 1),
    0
  );

  // 総額
  const totalPrice = selectedGears.reduce(
    (sum, g) => sum + (g.price || 0) * (g.quantity || 1),
    0
  );

  const formatKg = (g: number) => (g / 1000).toFixed(2);

  return (
    <section className="bg-[#18181B] border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
          📊 総重量シミュレーション
        </h2>
        <span className="text-[11px] font-bold text-zinc-500">
          (持参対象: {selectedGears.length} / 全{gears.length}点)
        </span>
      </div>

      {/* サマリーカードエリア（行きの重量を一番左へ） */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1 (一番左): 行きの重量 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">🎒 行きの重量</span>
          <p className="text-lg font-black text-white font-mono mt-0.5">
            {formatKg(totalWeight)} <span className="text-xs font-normal text-zinc-400">kg</span>
          </p>
        </div>

        {/* 2: 帰りの重量 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">🏠 帰りの重量</span>
          <p className="text-lg font-black text-[#FF5500] font-mono mt-0.5">
            {formatKg(baseWeight)} <span className="text-xs font-normal text-zinc-400">kg</span>
          </p>
        </div>

        {/* 3: 消耗品・食料 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">🍱 消耗品・食料</span>
          <p className="text-lg font-black text-[#00E676] font-mono mt-0.5">
            {formatKg(consumableWeight)} <span className="text-xs font-normal text-zinc-400">kg</span>
          </p>
        </div>

        {/* 4: 装備総額 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">💰 装備総額</span>
          <p className="text-lg font-black text-amber-400 font-mono mt-0.5">
            ¥{totalPrice.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 積み上げビジュアルバー（カテゴリー色分け） */}
      {totalWeight > 0 && (
        <div className="bg-[#27272A]/40 p-3 rounded-xl border border-zinc-700/50 space-y-2">
          {/* 行きの内訳 */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 block">🎒 行きの内訳</span>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700 flex">
              {CATEGORIES.map((cat) => {
                const weight = categoryWeights[cat] || 0;
                if (weight === 0) return null;
                const percent = (weight / totalWeight) * 100;
                const color = CATEGORY_COLORS[cat] || '#FF5500';

                return (
                  <div
                    key={cat}
                    style={{ width: `${percent}%`, backgroundColor: color }}
                    className="h-3 transition-all duration-300 cursor-pointer"
                    onClick={() => onCategoryClick && onCategoryClick(cat)}
                    title={cat}
                  />
                );
              })}
            </div>
          </div>

          {/* 帰りの内訳 (消耗品除外) */}
          <div className="space-y-1 pt-1">
            <span className="text-[11px] font-bold text-zinc-400 block">🏠 帰りの内訳</span>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700 flex">
              {CATEGORIES.filter((cat) => cat !== '食料・消耗品').map((cat) => {
                const weight = categoryWeights[cat] || 0;
                if (weight === 0) return null;
                const percent = (weight / totalWeight) * 100;
                const color = CATEGORY_COLORS[cat] || '#FF5500';

                return (
                  <div
                    key={cat}
                    style={{ width: `${percent}%`, backgroundColor: color }}
                    className="h-3 transition-all duration-300 cursor-pointer"
                    onClick={() => onCategoryClick && onCategoryClick(cat)}
                    title={cat}
                  />
                );
              })}
            </div>
          </div>

          {/* カテゴリー凡例 */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1 text-[10px] text-zinc-400 font-bold">
            {CATEGORIES.map((cat) => (
              <span
                key={cat}
                className="flex items-center gap-1 cursor-pointer hover:text-white"
                onClick={() => onCategoryClick && onCategoryClick(cat)}
              >
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                />
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}