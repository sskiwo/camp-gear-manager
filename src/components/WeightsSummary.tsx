'use client';

import { useState } from 'react';

type GearItem = {
  id: string;
  name: string;
  brand?: string;
  model_number?: string;
  product_name?: string;
  category?: string;
  weight: number;
  price: number;
  quantity?: number;
  is_packed: boolean;
  is_consumable: boolean;
  product_url?: string;
};

type Props = {
  gears: GearItem[];
};

export default function WeightsSummary({ gears }: Props) {
  const [targetWeightGrams, setTargetWeightGrams] = useState<number>(10000);

  // パッキングチェック対象のみ
  const packedGears = gears.filter((g) => g.is_packed);

  const isConsumableGear = (g: GearItem) =>
    g.is_consumable === true || String(g.is_consumable) === 'true';

  // 行きの総重量 (g)
  const outgoingWeight = packedGears.reduce(
    (sum, g) => sum + (g.weight || 0) * (g.quantity || 1),
    0
  );

  // 帰りの重量 (消費物以外) (g)
  const returnWeight = packedGears
    .filter((g) => !isConsumableGear(g))
    .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);

  const reducedWeight = outgoingWeight - returnWeight;
  const reductionRate =
    outgoingWeight > 0 ? Math.round((reducedWeight / outgoingWeight) * 100) : 0;

  const outgoingPercent =
    targetWeightGrams > 0 ? Math.round((outgoingWeight / targetWeightGrams) * 100) : 0;
  const returnPercent =
    targetWeightGrams > 0 ? Math.round((returnWeight / targetWeightGrams) * 100) : 0;

  const isOutgoingOver = outgoingWeight > targetWeightGrams;
  const isReturnOver = returnWeight > targetWeightGrams;

  // 📊 カテゴリー別重量計算 (g)
  const calcCategoryWeight = (catName: string, onlyNonConsumable = false) => {
    return packedGears
      .filter((g) => {
        const matchesCategory = (g.category || 'ベースギア') === catName;
        return onlyNonConsumable ? matchesCategory && !isConsumableGear(g) : matchesCategory;
      })
      .reduce((sum, g) => sum + (g.weight || 0) * (g.quantity || 1), 0);
  };

  const baseWeight = calcCategoryWeight('ベースギア');
  const cookingWeight = calcCategoryWeight('調理ギア・燃料');
  const clothesWeight = calcCategoryWeight('衣類・防寒着');
  const foodWeight = calcCategoryWeight('食料・飲料');
  const otherWeight = calcCategoryWeight('その他・日用品');

  const baseReturnWeight = calcCategoryWeight('ベースギア', true);
  const cookingReturnWeight = calcCategoryWeight('調理ギア・燃料', true);
  const clothesReturnWeight = calcCategoryWeight('衣類・防寒着', true);
  const foodReturnWeight = calcCategoryWeight('食料・飲料', true);
  const otherReturnWeight = calcCategoryWeight('その他・日用品', true);

  // バーの長さ計算（目標に対する%）
  const getPct = (w: number) => (targetWeightGrams > 0 ? (w / targetWeightGrams) * 100 : 0);

  return (
    <section className="bg-white p-8 rounded-3xl shadow-xl border border-[#E0DED3]/50 space-y-6 transition-all duration-300">
      {/* ヘッダー＆目標設定 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E0DED3]/50 pb-5">
        <h2 className="text-2xl font-bold text-[#384F41] flex items-center gap-3tracking-wide">
          ⚖️ パッキング重量サマリー
        </h2>

        <div className="flex items-center gap-3 text-sm text-[#666666] bg-[#F6F5EF] px-5 py-2.5 rounded-2xl border border-[#E0DED3]/50 shadow-inner">
          <span className="font-medium">🎯 目標上限:</span>
          <input
            type="number"
            step="0.5"
            min="0.5"
            value={targetWeightGrams / 1000}
            onChange={(e) => setTargetWeightGrams(Math.max(0, Number(e.target.value) * 1000))}
            className="w-24 px-3 py-1.5 border border-[#CCCCCC]/70 rounded-xl font-bold text-[#384F41] text-center focus:outline-none focus:ring-2 focus:ring-[#384F41] bg-white transition duration-300"
          />
          <span className="font-medium">kg</span>
        </div>
      </div>

      {/* 📊 5カテゴリー積み上げカラーメーター (モダンディープ＆くすみ版) */}
      <div className="bg-[#F6F5EF] p-6 rounded-2xl border border-[#E0DED3]/50 space-y-6 shadow-inner">
        {/* 1. 行きの積み上げメーター */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-end text-sm font-semibold">
            <span className="text-[#384F41] flex items-center gap-2">
              🚚 行きの総重量 (満載): <span className="text-xl font-extrabold">{outgoingPercent}%</span>
            </span>
            <span className={isOutgoingOver ? 'text-[#AF8074] font-extrabold text-base' : 'text-[#666666]'}>
              {(outgoingWeight / 1000).toFixed(2)} kg / {(targetWeightGrams / 1000).toFixed(1)} kg
            </span>
          </div>

          <div className={`w-full bg-[#E0DED3] h-5 rounded-full overflow-hidden p-0.5 flex gap-0.5 shadow-inner border transition duration-300 ${isOutgoingOver ? 'border-[#AF8074]' : 'border-transparent'}`}>
            <div style={{ width: `${getPct(baseWeight)}%` }} className="bg-[#6B8272] h-full transition-all duration-300 first:rounded-l-full" title={`ベースギア: ${(baseWeight/1000).toFixed(2)}kg`} />
            <div style={{ width: `${getPct(cookingWeight)}%` }} className="bg-[#A88869] h-full transition-all duration-300" title={`調理・燃料: ${(cookingWeight/1000).toFixed(2)}kg`} />
            <div style={{ width: `${getPct(clothesWeight)}%` }} className="bg-[#7B9BA2] h-full transition-all duration-300" title={`衣類・防寒: ${(clothesWeight/1000).toFixed(2)}kg`} />
            <div style={{ width: `${getPct(foodWeight)}%` }} className="bg-[#AF8074] h-full transition-all duration-300" title={`食料・飲料: ${(foodWeight/1000).toFixed(2)}kg`} />
            <div style={{ width: `${getPct(otherWeight)}%` }} className="bg-[#67738C] h-full transition-all duration-300 last:rounded-r-full" title={`その他: ${(otherWeight/1000).toFixed(2)}kg`} />
          </div>
        </div>

        {/* 2. 帰りの積み上げメーター */}
        <div className="space-y-2.5 pt-3 border-t border-[#E0DED3]/60">
          <div className="flex justify-between items-end text-sm font-semibold">
            <span className="text-[#BFA58A] flex items-center gap-2">
              🏕️ 帰りの重量 (消費後): <span className="text-xl font-extrabold">{returnPercent}%</span>
            </span>
            <span className={isReturnOver ? 'text-[#AF8074] font-extrabold text-base' : 'text-[#666666]'}>
              {(returnWeight / 1000).toFixed(2)} kg / {(targetWeightGrams / 1000).toFixed(1)} kg
            </span>
          </div>

          <div className="w-full bg-[#E0DED3] h-4 rounded-full overflow-hidden p-0.5 flex gap-0.5 shadow-inner">
            <div style={{ width: `${getPct(baseReturnWeight)}%` }} className="bg-[#6B8272] h-full transition-all duration-300 first:rounded-l-full" />
            <div style={{ width: `${getPct(cookingReturnWeight)}%` }} className="bg-[#A88869] h-full transition-all duration-300" />
            <div style={{ width: `${getPct(clothesReturnWeight)}%` }} className="bg-[#7B9BA2] h-full transition-all duration-300" />
            <div style={{ width: `${getPct(foodReturnWeight)}%` }} className="bg-[#AF8074] h-full transition-all duration-300" />
            <div style={{ width: `${getPct(otherReturnWeight)}%` }} className="bg-[#67738C] h-full transition-all duration-300 last:rounded-r-full" />
          </div>
        </div>

        {/* 状態メッセージ */}
        <div className="text-xs text-right pt-1.5 border-t border-[#E0DED3]/60">
          {isOutgoingOver ? (
            <span className="text-[#AF8074] font-bold">
              ⚠️ 行きが目標を {((outgoingWeight - targetWeightGrams) / 1000).toFixed(2)} kg オーバー！
              {reducedWeight > 0 && `（帰りは消費物により -${(reducedWeight / 1000).toFixed(2)} kg 軽くなります）`}
            </span>
          ) : (
            <span className="text-[#384F41] font-semibold">
              ✨ 目標範囲内です！行きで残り {((targetWeightGrams - outgoingWeight) / 1000).toFixed(2)} kg パッキング可能
              {reducedWeight > 0 && `（帰りはさらに -${(reducedWeight / 1000).toFixed(2)} kg 軽くなります）`}
            </span>
          )}
        </div>
      </div>

      {/* 🏷️ 5カテゴリー別重量カード (カラー連動) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#888888] uppercase tracking-wider pl-1">📦 カテゴリー別内訳 (行き)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-[#6B8272]/10 p-4 rounded-2xl border border-[#6B8272]/20 text-center shadow">
            <p className="text-xs text-[#6B8272] font-bold">⛺ ベースギア</p>
            <p className="text-2xl font-bold text-[#6B8272] mt-2 tracking-tight">{(baseWeight / 1000).toFixed(2)} <span className="text-sm font-normal">kg</span></p>
          </div>
          <div className="bg-[#A88869]/10 p-4 rounded-2xl border border-[#A88869]/20 text-center shadow">
            <p className="text-xs text-[#A88869] font-bold">🍳 調理・燃料</p>
            <p className="text-2xl font-bold text-[#A88869] mt-2 tracking-tight">{(cookingWeight / 1000).toFixed(2)} <span className="text-sm font-normal">kg</span></p>
          </div>
          <div className="bg-[#7B9BA2]/10 p-4 rounded-2xl border border-[#7B9BA2]/20 text-center shadow">
            <p className="text-xs text-[#7B9BA2] font-bold">👕 衣類・防寒</p>
            <p className="text-2xl font-bold text-[#7B9BA2] mt-2 tracking-tight">{(clothesWeight / 1000).toFixed(2)} <span className="text-sm font-normal">kg</span></p>
          </div>
          <div className="bg-[#AF8074]/10 p-4 rounded-2xl border border-[#AF8074]/20 text-center shadow">
            <p className="text-xs text-[#AF8074] font-bold">🍱 食料・飲料</p>
            <p className="text-2xl font-bold text-[#AF8074] mt-2 tracking-tight">{(foodWeight / 1000).toFixed(2)} <span className="text-sm font-normal">kg</span></p>
          </div>
          <div className="bg-[#67738C]/10 p-4 rounded-2xl border border-[#67738C]/20 text-center col-span-2 sm:col-span-1 shadow">
            <p className="text-xs text-[#67738C] font-bold">📦 その他日用品</p>
            <p className="text-2xl font-bold text-[#67738C] mt-2 tracking-tight">{(otherWeight / 1000).toFixed(2)} <span className="text-sm font-normal">kg</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}