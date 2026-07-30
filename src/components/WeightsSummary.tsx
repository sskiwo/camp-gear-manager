'use client';

type GearItem = {
  id: string;
  category?: string;
  weight: number;
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
  ベースギア: '#6B8272',
  '調理ギア・燃料': '#A88869',
  '衣類・防寒着': '#7B9BA2',
  '食料・飲料': '#AF8074',
  'その他・日用品': '#67738C',
};

export default function WeightsSummary({ gears, onCategoryClick }: Props) {
  const packedGears = gears.filter((g) => g.is_packed);

  // 行き総重量
  const totalOutgoingWeight = packedGears.reduce(
    (sum, g) => sum + (g.weight || 0) * (g.quantity || 1),
    0
  );

  // 帰り総重量 (消費物以外)
  const totalReturnWeight = packedGears
    .filter((g) => !g.is_consumable)
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // カテゴリー別重量
  const categoryWeights: Record<string, number> = {};
  CATEGORIES.forEach((cat) => {
    categoryWeights[cat] = packedGears
      .filter((g) => (g.category || 'ベースギア') === cat)
      .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);
  });

  return (
    <div className="bg-white p-5 md:p-6 rounded-2xl shadow-md border border-[#E0DED3]/50 space-y-5">
      <h2 className="text-base font-bold text-[#384F41]">📊 パッキング重量サマリー</h2>

      {/* 総重量比較カード */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#6B8272]/10 border border-[#6B8272]/20 p-3.5 rounded-xl text-center">
          <span className="text-[11px] font-bold text-[#6B8272] block">🚀 行き（全総重量）</span>
          <span className="text-xl md:text-2xl font-extrabold text-[#384F41]">
            {(totalOutgoingWeight / 1000).toFixed(2)} <span className="text-xs font-bold">kg</span>
          </span>
          <span className="text-[10px] text-[#666666] block font-mono">({totalOutgoingWeight.toLocaleString()} g)</span>
        </div>

        <div className="bg-[#A88869]/10 border border-[#A88869]/20 p-3.5 rounded-xl text-center">
          <span className="text-[11px] font-bold text-[#A88869] block">🏠 帰り（消費後重量）</span>
          <span className="text-xl md:text-2xl font-extrabold text-[#A88869]">
            {(totalReturnWeight / 1000).toFixed(2)} <span className="text-xs font-bold">kg</span>
          </span>
          <span className="text-[10px] text-[#666666] block font-mono">({totalReturnWeight.toLocaleString()} g)</span>
        </div>
      </div>

      {/* 積み上げ帯グラフ */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold text-[#555555]">
          <span>カテゴリー別積載バランス</span>
          <span>全{packedGears.length}点</span>
        </div>
        <div className="h-4 w-full bg-[#E0DED3]/40 rounded-full overflow-hidden flex shadow-inner">
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
                className="h-full transition-all duration-300"
                title={`${cat}: ${weight}g (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* 👇 カテゴリー別内訳（タップで下へジャンプ！） */}
      <div className="pt-1">
        <span className="text-[11px] font-bold text-[#888888] block mb-2">
          👇 タップすると下の各カテゴリーへジャンプします:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => {
            const weight = categoryWeights[cat] || 0;
            const color = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS];
            return (
              <button
                key={cat}
                onClick={() => onCategoryClick && onCategoryClick(cat)}
                style={{ borderColor: `${color}50`, backgroundColor: `${color}08` }}
                className="p-2 border rounded-xl text-left transition hover:scale-[1.02] active:scale-95 flex flex-col justify-between cursor-pointer"
              >
                <span style={{ color: color }} className="font-bold text-[11px] truncate block">
                  {cat}
                </span>
                <span className="text-xs font-extrabold text-[#333333] mt-1 block">
                  {weight >= 1000 ? `${(weight / 1000).toFixed(2)}kg` : `${weight}g`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}