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

  // ベース重量 (食料・消耗品以外)
  const baseWeight = selectedGears
    .filter((g) => !g.is_consumable && g.category !== '食料・消耗品')
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 消耗品重量 (食料・消耗品)
  const consumableWeight = selectedGears
    .filter((g) => g.is_consumable || g.category === '食料・消耗品')
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  // 総重量
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
        {/* ベース重量 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">⛺ ベース重量</span>
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

        {/* 総重量 */}
        <div className="bg-[#27272A]/60 p-3 rounded-xl border border-zinc-700/50">
          <span className="text-[11px] font-bold text-zinc-400 block">⚖️ パック総重量</span>
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
    </section>
  );
}