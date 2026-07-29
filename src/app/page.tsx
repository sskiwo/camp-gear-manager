"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import WeightSummary from "@/components/WeightSummary";
import SplitBill from "@/components/SplitBill";

type Gear = {
  id: string;
  name: string;
  weightg: number;
  price: number;
  is_consumable: boolean;
  created_at?: string;
};

export default function Home() {
  const [gears, setGears] = useState<Gear[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // 手動入力用のフォーム状態
  const [name, setName] = useState("");
  const [weightg, setWeightg] = useState("");
  const [price, setPrice] = useState("");
  const [isConsumable, setIsConsumable] = useState(false);

  // ギア一覧をSupabaseから取得
  const fetchGears = async () => {
    try {
      const { data, error } = await supabase
        .from("gears")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("データ取得エラー:", error);
      } else {
        setGears(data || []);
      }
    } catch (err) {
      console.error("エラー:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGears();
  }, []);

  // 手動追加処理
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("ギア名を入力してください");
      return;
    }

    const { error } = await supabase.from("gears").insert([
      {
        name,
        weightg: Number(weightg) || 0,
        price: Number(price) || 0,
        is_consumable: isConsumable,
      },
    ]);

    if (error) {
      alert("追加に失敗しました: " + error.message);
    } else {
      // フォームリセット
      setName("");
      setWeightg("");
      setPrice("");
      setIsConsumable(false);
      fetchGears();
    }
  };

  // ギア削除機能
  const handleDelete = async (id: string) => {
    if (!confirm("このギアを削除しますか？")) return;

    const { error } = await supabase.from("gears").delete().eq("id", id);
    if (error) {
      alert("削除に失敗しました: " + error.message);
    } else {
      fetchGears();
    }
  };

  // 画像アップロード ＆ 解析処理
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "解析に失敗しました");
      }

      // Supabaseに自動挿入
      const { error: insertError } = await supabase.from("gears").insert([
        {
          name: data.name,
          weightg: data.weightg,
          price: data.price,
          is_consumable: data.is_consumable,
        },
      ]);

      if (insertError) {
        throw new Error("Supabaseへの保存に失敗しました: " + insertError.message);
      }

      alert(`🤖 ギア追加成功！\n\n【ギア名】${data.name}\n【重量】${data.weightg}g\n【価格】${data.price}円\n【種別】${data.is_consumable ? "消費物" : "ギア"}\n\n自動でリストに追加しました！`);
      fetchGears();
    } catch (err: any) {
      alert("エラー: " + err.message);
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              🏕️ Camp Gear Manager
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              AIでギアを簡単追加！軽量化 ＆ スマート割り勘
            </p>
          </div>

          {/* AIスキャンボタン */}
          <label className={`cursor-pointer bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-orange-500/20 transition duration-200 flex items-center gap-2 ${isScanning ? "opacity-50 pointer-events-none" : ""}`}>
            <span>{isScanning ? "⏳ 解析中..." : "📷 ギアをスキャン追加"}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isScanning}
            />
          </label>
        </header>

        {/* 🎒 重量 ＆ 軽量化サマリー */}
        <WeightSummary gears={gears} />

        {/* 💰 最少送金スマート割り勘コンポーネント */}
        <SplitBill />

        {/* ✏️ 手動追加フォーム */}
        <section className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 mb-8">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span>➕</span> ギアの手動登録
          </h2>
          <form onSubmit={handleManualAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="ギア名 (例: CB缶 3本セット)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                required
              />
              <input
                type="number"
                placeholder="重量 (g) (例: 1050)"
                value={weightg}
                onChange={(e) => setWeightg(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
              <input
                type="number"
                placeholder="価格 (円) (例: 600)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-300 hover:text-white transition">
                <input
                  type="checkbox"
                  checked={isConsumable}
                  onChange={(e) => setIsConsumable(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500"
                />
                <span>🔥 帰りに消費する品（ガス・薪・食料・水分など）</span>
              </label>

              <button
                type="submit"
                className="w-full sm:w-auto bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-2 rounded-xl text-sm transition"
              >
                追加する
              </button>
            </div>
          </form>
        </section>

        {/* ギア一覧セクション */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>📋</span> 登録済みギア一覧 ({gears.length}点)
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">
              ギアデータを読み込み中...
            </div>
          ) : gears.length === 0 ? (
            <div className="bg-slate-800/40 rounded-2xl p-12 text-center border border-dashed border-slate-700 text-slate-400">
              <p className="text-4xl mb-3">⛺</p>
              <p className="font-semibold text-lg mb-1">ギアがまだ登録されていません</p>
              <p className="text-sm text-slate-500">
                上の手動登録フォームまたは「📷 ギアをスキャン追加」から追加してみてください！
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gears.map((gear) => (
                <div
                  key={gear.id}
                  className="bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl p-5 shadow-sm transition flex justify-between items-start"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-100">
                        {gear.name}
                      </h3>
                      {gear.is_consumable ? (
                        <span className="bg-sky-500/20 text-sky-300 text-xs px-2.5 py-0.5 rounded-full font-medium border border-sky-500/30">
                          🔥 消費物
                        </span>
                      ) : (
                        <span className="bg-slate-700 text-slate-300 text-xs px-2.5 py-0.5 rounded-full font-medium">
                          🎒 ギア
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4 text-sm text-slate-400 pt-2">
                      <p>
                        重さ:{" "}
                        <span className="font-semibold text-slate-200">
                          {gear.weightg}g
                        </span>
                      </p>
                      <p>
                        価格:{" "}
                        <span className="font-semibold text-slate-200">
                          ¥{gear.price?.toLocaleString() ?? 0}
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(gear.id)}
                    className="text-slate-500 hover:text-red-400 transition text-sm p-1 rounded hover:bg-slate-700/50"
                    title="削除"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}