'use client';

type GearItem = {
  id: string;
  category?: string;
  weight: number;
  price?: number;
  quantity?: number;
  is_packed: boolean;
  is_consumable: boolean;
};

type Props = {
  gears: GearItem[];
  onCategoryClick?: (category: string) => void;
};

const CATEGORIES = [
  'ベースギア',
  '調理ギア・燃料',
  '衣類・防寒着',
  '食料・飲料',
  'その他・日用品',
];

const CATEGORY_COLORS = {
  ベースギア: '#FF5500',       // 鮮烈ネオンオレンジ
  '調理ギア・燃料': '#FFB800', // ビビッドイエロー
  '衣類・防寒着': '#00E5FF',   // シアンブルー
  '食料・飲料': '#00E676',     // ネオングリーン
  'その他・日用品': '#E040FB', // ビビッドパープル
};

export default function WeightsSummary({ gears, onCategoryClick }: Props) {
  const packedGears = gears.filter((g) => g.is_packed);

  // 1. 行き総重量
  const totalOutgoingWeight = packedGears.reduce(
    (sum, g) => sum + (g.weight || 0) * (g.quantity || 1),
    0
  );

  // 2. 帰り総重量 (消費物以外)
  const totalReturnWeight = packedGears
    .filter((g) => !g.is_consumable)
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 3. 💰 パッキング全体の合計金額
  const totalPrice = packedGears.reduce(
    (sum, g) => sum + (g.price || 0) * (g.quantity || 1),
    0
  );

  // 4. カテゴリーごとの重量 ＆ 金額
  const categoryWeights: Record<string, number> = {};
  const categoryPrices: Record<string, number> = {};

  CATEGORIES.forEach((cat) => {
    const catGears = packedGears.filter((g) => (g.category || 'ベースギア') === cat);
    
    categoryWeights[cat] = catGears.reduce(
      (sum, g) => sum + (g.weight || 0) * (g.quantity || 1),
      0
    );

    categoryPrices[cat] = catGears.reduce(
      (sum, g) => sum + (g.price || 0) * (g.quantity || 1),
      0
    );
  });

  return (
    <div className="bg-[#18181B] p-5 md:p-6 rounded-2xl border border-zinc-800 space-y-5 text-white shadow-xl">
      <h2 className="text-base font-bold text-white flex items-center justify-between">
        <span>📊 パッキングサマリー</span>
        <span className="text-xs text-zinc-400 font-normal">全{packedGears.length}点パッキング中</span>
      </h2>

      {/* 👑 サマリーカード (重量比較 ＋ 総額カード) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 行き重量 */}
        <div className="bg-[#27272A] border border-[#FF5500]/50 p-3.5 rounded-xl text-center shadow-inner">
          <span className="text-[11px] font-extrabold text-[#FF5500] block tracking-wide">🚀 行き（全総重量）</span>
          <span className="text-xl md:text-2xl font-black text-white">
            {(totalOutgoingWeight / 1000).toFixed(2)} <span className="text-xs font-bold text-zinc-400">kg</span>
          </span>
          <span className="text-[10px] text-zinc-400 block font-mono">({totalOutgoingWeight.toLocaleString()} g)</span>
        </div>

        {/* 帰り重量 */}
        <div className="bg-[#27272A] border border-[#FFB800]/50 p-3.5 rounded-xl text-center shadow-inner">
          <span className="text-[11px] font-extrabold text-[#FFB800] block tracking-wide">🏠 帰り（消費後重量）</span>
          <span className="text-xl md:text-2xl font-black text-[#FFB800]">
            {(totalReturnWeight / 1000).toFixed(2)} <span className="text-xs font-bold text-zinc-400">kg</span>
          </span>
          <span className="text-[10px] text-zinc-400 block font-mono">({totalReturnWeight.toLocaleString()} g)</span>
        </div>

        {/* 💰 パッキング合計金額 (平均表記を削除してスッキリ化) */}
        <div className="bg-[#27272A] border border-[#00E676]/50 p-3.5 rounded-xl text-center shadow-inner flex flex-col justify-center">
          <span className="text-[11px] font-extrabold text-[#00E676] block tracking-wide">💰 パッキング合計金額</span>
          <span className="text-xl md:text-2xl font-black text-[#00E676] mt-0.5">
            ¥{totalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 積み上げ帯グラフ */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-zinc-300">
          <span>カテゴリー別積載バランス</span>
        </div>
        <div className="h-4 w-full bg-[#27272A] rounded-full overflow-hidden flex border border-zinc-700/60 p-0.5">
          {CATEGORIES.map((cat) => {
            const weight = categoryWeights[cat] || 0;
            const pct = totalOutgoingWeight > 0 ? (weight / totalOutgoingWeight) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={cat}
                style={{
                  width: `${pct}%`,
                  backgroundColor: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS],
                }}
                className="h-full rounded-xs transition-all duration-300"
                title={`${cat}: ${weight}g (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* 🏷️ カテゴリー別内訳 */}
      <div className="pt-1">
        <span className="text-[11px] font-bold text-zinc-400 block mb-2">
          👇 タップすると下の各カテゴリーへジャンプします:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => {
            const weight = categoryWeights[cat] || 0;
            const price = categoryPrices[cat] || 0;
            const color = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS];
            return (
              <button
                key={cat}
                onClick={() => onCategoryClick && onCategoryClick(cat)}
                style={{ borderColor: `${color}80`, backgroundColor: `${color}15` }}
                className="p-2.5 border rounded-xl text-left transition hover:brightness-125 active:scale-95 flex flex-col justify-between cursor-pointer shadow-sm space-y-1"
              >
                <span style={{ color: color }} className="font-extrabold text-[11px] truncate block">
                  {cat}
                </span>

                <div className="space-y-0.5">
                  <div className="text-xs font-black text-white block">
                    ⚖️ {weight >= 1000 ? `${(weight / 1000).toFixed(2)}kg` : `${weight}g`}
                  </div>
                  <div className="text-[11px] font-bold text-zinc-300 block">
                    💴 ¥{price.toLocaleString()}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}