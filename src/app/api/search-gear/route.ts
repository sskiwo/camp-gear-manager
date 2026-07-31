import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: '検索キーワードを入力してください' },
        { status: 400 }
      );
    }

    const cleanQuery = query.replace(/ /g, ' ').trim();

    const { data: cachedData, error: cacheError } = await supabase
      .from('search_cache')
      .select('candidates')
      .eq('query', cleanQuery.toLowerCase())
      .single();

    if (!cacheError && cachedData && cachedData.candidates) {
      return NextResponse.json({ candidates: cachedData.candidates });
    }

    const prompt = `あなたはキャンプギアおよびアウトドア用品・食料品の専門APIです。
ユーザーの検索キーワード「${cleanQuery}」から該当する商品を推測し、関連する具体的な候補アイテムを最大3件抽出してください。

【出力仕様】
以下のJSONフォーマットのみを返してください。装飾文や解説は一切不要です。
{
  "candidates": [
    {
      "name": "正式な商品名",
      "brand": "メーカー・ブランド名（不明な場合は空文字）",
      "model_number": "型番・モデル名（不明な場合は空文字）",
      "weight": 容器や包装を含めた総重量g（数値のみ）,
      "price": 定価または平均実売価格円（数値のみ）,
      "category": "base" | "cook" | "wear" | "other" | "food",
      "is_consumable": 食料・飲料・燃料・使い捨て用品など現地で消費する場合はtrue、持ち帰る道具はfalse,
      "source_url": "https://www.google.com/search?q=" + encodeURIComponent(ブランド + 商品名 + " スペック 重量"),
      "amazon_url": "https://www.amazon.co.jp/s?k=" + encodeURIComponent(ブランド + 商品名)
    }
  ]
}

【カテゴリー分類基準】
- "base": テント、タープ、ペグ、シュラフ、マット、チェア、テーブル、ランタン等（設営・居住用ギア）
- "cook": バーナー、クッカー、メスティン、包丁、ナイフ、ケトル、クーラーボックス、CB缶/OD缶、薪、炭等（調理・燃料）
- "wear": ウェア、着替え、レインウェア、防寒具、帽子、手袋等（衣類・防寒着）
- "other": ウェットティッシュ、ゴミ袋、救急セット、ポータブル電源、洗面具等（日用品・その他）
- "food": お肉、野菜、カップ麺、水、お酒、調味料等（食料・飲料）`;

    const failedAIs: string[] = [];

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            if (parsed.candidates && parsed.candidates.length > 0) {
              await saveCache(cleanQuery.toLowerCase(), parsed.candidates);
              return NextResponse.json({ candidates: parsed.candidates });
            }
          }
        } else {
          failedAIs.push(`Gemini: ${res.status} ${res.statusText}`);
        }
      } catch (err: any) {
        failedAIs.push(`Gemini: ${err.message || 'Error'}`);
      }
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      const groqModels = [
        'llama-3.3-70b-versatile',
        'mixtral-8x7b-32768',
        'llama-3.1-8192',
        'gemma2-9b-it',
        'llama3-8b-8192',
      ];

      for (const model of groqModels) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: 'You are a helpful API that outputs only valid JSON.' },
                { role: 'user', content: prompt },
              ],
              response_format: { type: 'json_object' },
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) {
              const parsed = JSON.parse(text);
              if (parsed.candidates && parsed.candidates.length > 0) {
                await saveCache(cleanQuery.toLowerCase(), parsed.candidates);
                return NextResponse.json({ candidates: parsed.candidates });
              }
            }
          } else {
            failedAIs.push(`Groq(${model}): ${res.status}`);
          }
        } catch (err: any) {
          failedAIs.push(`Groq(${model}): ${err.message || 'Error'}`);
        }
      }
    }

    return NextResponse.json(
      {
        error: `AIの混雑制限により検索できませんでした。\n【詳細】\n${failedAIs.join('\n')}`,
      },
      { status: 429 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `サーバーエラーが発生しました: ${err.message}` },
      { status: 500 }
    );
  }
}

async function saveCache(query: string, candidates: any[]) {
  try {
    await supabase.from('search_cache').upsert([{ query, candidates }]);
  } catch (e) {
    console.error('Cache save error:', e);
  }
}