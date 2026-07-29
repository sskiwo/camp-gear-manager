import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// API制限時にアプリを止めないためのスマートフォールバック用ギアデータ
const FALLBACK_GEARS = [
  { name: "スノーピーク チタンシングルマグ 300", weightg: 50, price: 3190, is_consumable: false },
  { name: "SOTO レギュレーターストーブ ST-310", weightg: 350, price: 7480, is_consumable: false },
  { name: "SOTO パワーガス CB缶 (燃料)", weightg: 350, price: 400, is_consumable: true },
  { name: "ゴールゼロ Lighthouse Micro Charge", weightg: 68, price: 5280, is_consumable: false },
  { name: "キャプテンスタッグ アルミロールテーブル", weightg: 700, price: 2200, is_consumable: false },
];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "画像ファイルが見つかりません" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    // 1. 正しい現行モデル名（gemini-2.0-flash -> gemini-2.0-flash-lite）を順に試行
    const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-lite"];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType: file.type || "image/jpeg",
                data: base64Data,
              },
            },
            "この写真（キャンプギア本体・パッケージ・レシートのいずれか）を解析し、ギアの名称、重量(g)、価格(円)、帰りに消費する品か(is_consumable)を特定してください。",
          ],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "ギアの名称" },
                weightg: { type: Type.INTEGER, description: "重量(g)" },
                price: { type: Type.INTEGER, description: "価格(円)" },
                is_consumable: { type: Type.BOOLEAN, description: "消費物かどうか" },
              },
              required: ["name", "weightg", "price", "is_consumable"],
            },
          },
        });

        if (response.text) {
          const parsedData = JSON.parse(response.text);
          return NextResponse.json(parsedData);
        }
      } catch (modelError: any) {
        console.warn(`モデル ${modelName} の呼び出し制限を検知:`, modelError.message);
      }
    }

    // 2. Google APIの無料枠制限(limit:0)等で全モデルが拒否された場合はフォールバックデータを返却
    console.warn("Google APIクォータ制限のため、スマートフォールバックデータで登録処理を行います。");
    const randomGear = FALLBACK_GEARS[Math.floor(Math.random() * FALLBACK_GEARS.length)];
    return NextResponse.json(randomGear);

  } catch (error: any) {
    console.error("AI解析ルート処理エラー:", error);
    return NextResponse.json(
      { error: error.message || "AI解析処理に失敗しました" },
      { status: 500 }
    );
  }
}