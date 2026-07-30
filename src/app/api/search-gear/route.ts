import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// レート制限が最もゆるく高速なモデル
const MODELS = [
  'llama-3.1-8192',
  'gemma2-9b-it',
  'mixtral-8x7b-32768',
];

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'キーワードを入力してください' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY が設定されていません。' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    // トークン消費数を従来の1/10に抑えた英語の極小プロンプト
    const prompt = `Item:"${query}"
Output ONLY a raw JSON object with max 3 candidates for camping/outdoor item. No markdown, no conversation.
JSON format:
{"candidates":[{"brand":"string","model_number":"string","product_name":"string in Japanese","category":"ベースギア"|"調理ギア・燃料"|"衣類・防寒着"|"食料・飲料"|"その他・日用品","weight":number_in_grams,"price":number_in_yen}]}`;

    let text = '';
    let lastError = null;

    for (const model of MODELS) {
      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: model,
          temperature: 0.1,
          max_tokens: 350, // 無駄な長文生成を防ぐ
          response_format: { type: 'json_object' },
        });

        text = chatCompletion?.choices[0]?.message?.content || '';
        if (text) break;
      } catch (err: any) {
        lastError = err;
        // 429エラーが発生した場合は2秒待機して次のモデルへ
        if (err?.status === 429 || err?.message?.includes('429')) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    if (!text) {
      return NextResponse.json(
        { error: 'AIの無料利用枠（1分あたりの制限）に達しました。10秒ほど置いてから再度お試しください。' },
        { status: 429 }
      );
    }

    // JSONクレンジング
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    const gearData = JSON.parse(text);
    const candidates = (gearData.candidates || []).map((item: any) => {
      const fullSearchTerm = `${item.brand || ''} ${item.product_name || ''} ${item.model_number || ''}`.trim();
      const cat = item.category || 'ベースギア';
      const isConsumable = cat === '食料・飲料' || item.product_name?.includes('缶') || item.product_name?.includes('薪');

      return {
        brand: item.brand || '',
        model_number: item.model_number || '',
        product_name: item.product_name || item.name || '',
        name: fullSearchTerm,
        category: cat,
        weight: Number(item.weight) || 0,
        price: Number(item.price) || 0,
        isConsumable: isConsumable,
        productUrl: `https://www.amazon.co.jp/s?k=${encodeURIComponent(fullSearchTerm)}`,
      };
    });

    return NextResponse.json({ candidates });
  } catch (error: any) {
    console.error('Gear search error:', error);
    return NextResponse.json(
      { error: 'AIアクセスが一時的に混み合っています。10秒ほど置いてから再度お試しください。' },
      { status: 500 }
    );
  }
}