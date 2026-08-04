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

export default function WeightsSummary({ gears, onCategoryClick }: Props) {
  // 「持っていく (is_selected !== false)」ギアのみを集計対象にする
  const selectedGears = gears.filter((g) => g.is_selected !== false);

  // ベース重量 (食料・消耗品以外) = 帰りの重量
  const baseWeight = selectedGears
    .filter((g) => !g.is_consumable && g.category !== '食料・消耗品')
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 消耗品重量 (食料・消耗品)
  const consumableWeight = selectedGears
    .filter((g) => g.is_consumable || g.category === '食料・消耗品')
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 総重量 = 行きの重量
  const totalWeight = baseWeight + consumableWeight;

  // 総額
  const totalPrice = selectedGears.reduce(
    (sum, g) => sum + (g.price || 0) * (g.quantity || 1),
    0
  );

  const formatKg = (g: number) => (g / 1000).toFixed(2);

  return (
    <section className="bg-[#18181B] border border-zinc-800 p-5 rounded-2xl shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
          📊 持ち出し総重量・金額シミュレーション
        </h2>
        <span className="text-[11px] font-bold text-zinc-500">
          (持参対象: {selectedGears.length} / 全{gears.length}点)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* ベース重量 (帰り) */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">🏠 帰りの重量 (ベース)</span>
          <p className="text-lg font-black text-[#FF5500] font-mono mt-0.5">
            {formatKg(baseWeight)} <span className="text-xs font-normal text-zinc-400">kg</span>
          </p>
        </div>

        {/* 消耗品重量 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">🍱 消耗品・食料</span>
          <p className="text-lg font-black text-[#00E676] font-mono mt-0.5">
            {formatKg(consumableWeight)} <span className="text-xs font-normal text-zinc-400">kg</span>
          </p>
        </div>

        {/* 総重量 (行き) */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">🎒 行きの重量 (総重量)</span>
          <p className="text-lg font-black text-white font-mono mt-0.5">
            {formatKg(totalWeight)} <span className="text-xs font-normal text-zinc-400">kg</span>
          </p>
        </div>

        {/* 総額 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">💰 装備総額</span>
          <p className="text-lg font-black text-amber-400 font-mono mt-0.5">
            ¥{totalPrice.toLocaleString()}
          </p>
        </div>
      </div>

      {/* 📊 行き vs 帰りの重量ビジュアル比較グラフ */}
      {totalWeight > 0 && (
        <div className="bg-[#27272A]/40 p-3.5 rounded-xl border border-zinc-700/50 space-y-2.5">
          <div className="text-xs font-bold text-zinc-300 flex items-center justify-between">
            <span>⚖️ 行き vs 帰りの重量ビジュアル比較</span>
            <span className="text-[11px] text-[#00E676] font-mono font-bold">
              現地消費による軽量化: -{formatKg(consumableWeight)} kg ({Math.round((consumableWeight / totalWeight) * 100)}%)
            </span>
          </div>

          {/* 行きのバー (総重量) */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-zinc-300 flex items-center gap-1">🎒 行きの重量 (総重量)</span>
              <span className="text-white font-mono">{formatKg(totalWeight)} kg</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-700 flex">
              <div
                style={{ width: `${(baseWeight / totalWeight) * 100}%` }}
                className="bg-[#FF5500] h-2.5"
                title={`ベース重量: ${formatKg(baseWeight)}kg`}
              />
              <div
                style={{ width: `${(consumableWeight / totalWeight) * 100}%` }}
                className="bg-[#00E676] h-2.5"
                title={`食料・消耗品: ${formatKg(consumableWeight)}kg`}
              />
            </div>
          </div>

          {/* 帰りのバー (ベース重量のみ) */}
          <div className="space-y-1 pt-0.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-zinc-300 flex items-center gap-1">🏠 帰りの重量 (ベースのみ)</span>
              <span className="text-[#FF5500] font-mono">{formatKg(baseWeight)} kg</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden border border-zinc-700">
              <div
                style={{ width: `${(baseWeight / totalWeight) * 100}%` }}
                className="bg-[#FF5500] h-2.5 rounded-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 text-[10px] text-zinc-400 font-medium pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#FF5500] inline-block"/> ベース重量: {formatKg(baseWeight)}kg
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00E676] inline-block"/> 食料・消耗品: {formatKg(consumableWeight)}kg
            </span>
          </div>
        </div>
      )}
    </section>
  );
}