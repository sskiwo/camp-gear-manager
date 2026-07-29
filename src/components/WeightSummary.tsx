"use client";

type Gear = {
  id: string;
  name: string;
  weightg: number;
  price: number;
  is_consumable: boolean;
};

type Props = {
  gears: Gear[];
};

export default function WeightSummary({ gears }: Props) {
  // 1. 行きの総重量 (全ギアの合計)
  const totalWeight = gears.reduce((sum, g) => sum + (g.weightg || 0), 0);

  // 2. 帰りの重量 (消費されないギアのみの合計)
  const returnWeight = gears
    .filter((g) => !g.is_consumable)
    .reduce((sum, g) => sum + (g.weightg || 0), 0);

  // 3. 消費物（帰り道で減る重さ）
  const consumedWeight = totalWeight - returnWeight;

  // 4. 軽量化率 (%)
  const reductionRate =
    totalWeight > 0 ? Math.round((consumedWeight / totalWeight) * 100) : 0;

  // グラム(g)をキログラム(kg)表記に変換するヘルパー関数
  const formatWeight = (g: number) => {
    if (g >= 1000) {
      return `${(g / 1000).toFixed(2)} kg`;
    }
    return `${g.toLocaleString()} g`;
  };

  return (
    <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700 mb-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span>🎒</span> パッキング重量サマリー
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center mb-6">
        {/* 行きの重量 */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-400 font-medium mb-1">行きの総重量 (行き)</p>
          <p className="text-2xl font-extrabold text-amber-400">
            {formatWeight(totalWeight)}
          </p>
        </div>

        {/* 帰りの重量 */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-400 font-medium mb-1">ベース重量 (帰り)</p>
          <p className="text-2xl font-extrabold text-emerald-400">
            {formatWeight(returnWeight)}
          </p>
        </div>

        {/* 削減できた重量 */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 col-span-2 md:col-span-1">
          <p className="text-xs text-slate-400 font-medium mb-1">消費物の重さ (軽量化)</p>
          <p className="text-2xl font-extrabold text-sky-400">
            -{formatWeight(consumedWeight)}
          </p>
        </div>
      </div>

      {/* 軽量化プログレスバー */}
      <div>
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-slate-300 font-medium">帰り道の軽量化率</span>
          <span className="text-sky-400 font-bold text-base">
            {reductionRate}% 軽くなります！ 🔥
          </span>
        </div>
        <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(reductionRate, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}