import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || 'campapp-22';

const GROQ_MODELS = [
  { displayName: 'Groq (llama-3.3-70b)', modelId: 'llama-3.3-70b-versatile' },
  { displayName: 'Groq (mixtral-8x7b)', modelId: 'mixtral-8x7b-32768' },
  { displayName: 'Groq (llama-3.1-8192)', modelId: 'llama-3.1-8192' },
  { displayName: 'Groq (gemma2-9b)', modelId: 'gemma2-9b-it' },
  { displayName: 'Groq (llama3-8b)', modelId: 'llama3-8b-8192' },
];

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'キーワードを入力してください' }, { status: 400 });
    }

    const cleanQuery = query.replace(/ /g, ' ').trim().toLowerCase();

    try {
      const { data: cacheData } = await supabase
        .from('search_cache')
        .select('candidates')
        .eq('query', cleanQuery)
        .single();

      if (cacheData && cacheData.candidates) {
        return NextResponse.json({ candidates: cacheData.candidates });
      }
    } catch (e) {}

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const errorLogs: string[] = [];
    let text = '';

    const prompt = `Item:"${cleanQuery}"
Output ONLY raw JSON object with max 3 candidates for camping/outdoor item. No markdown.
JSON format:
{"candidates":[{"brand":"string","model_number":"string","product_name":"string in Japanese","category":"ベースギア"|"調理ギア"|"衣類"|"その他・日用品"|"食料・消耗品","weight":number_in_grams,"price":number_in_yen}]}`;

    if (geminiKey) {
      try {
        const geminiRes = await fetch(
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

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          errorLogs.push(`❌ Google Gemini: ${geminiRes.status} エラー`);
        }
      } catch (err: any) {
        errorLogs.push(`❌ Google Gemini: ${err.message || '接続エラー'}`);
      }
    }

    if (!text && groqKey) {
      const groq = new Groq({ apiKey: groqKey });

      for (const target of GROQ_MODELS) {
        try {
          const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: target.modelId,
            temperature: 0.1,
            max_tokens: 300,
            response_format: { type: 'json_object' },
          });

          text = chatCompletion?.choices[0]?.message?.content || '';
          if (text) break;
        } catch (err: any) {
          const reason = err?.status === 429 || err?.message?.includes('429') 
            ? '429 (1分間の利用制限オーバー)' 
            : err?.message || '接続エラー';
          errorLogs.push(`❌ ${target.displayName}: ${reason}`);
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      }
    } else if (!text && !groqKey) {
      errorLogs.push('❌ Groq: GROQ_API_KEY 未設定');
    }

    if (!text) {
      const detailedErrorMessage = `【AIアクセス制限エラー】\n以下のすべてのAI試行で失敗しました:\n\n${errorLogs.join('\n')}\n\n10〜15秒ほど置いてから再度お試しください。`;
      return NextResponse.json({ error: detailedErrorMessage }, { status: 429 });
    }

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    const gearData = JSON.parse(text);
    const candidates = (gearData.candidates || []).map((item: any) => {
      const fullSearchTerm = `${item.brand || ''} ${item.product_name || ''} ${item.model_number || ''}`.trim();
      const cat = item.category || 'ベースギア';
      const isConsumable = cat === '食料・消耗品';

      const amazonAffiliateUrl = `https://www.amazon.co.jp/s?k=${encodeURIComponent(fullSearchTerm)}&tag=${AMAZON_TAG}`;

      return {
        brand: item.brand || '',
        model_number: item.model_number || '',
        product_name: item.product_name || item.name || '',
        name: fullSearchTerm,
        category: cat,
        weight: Number(item.weight) || 0,
        price: Number(item.price) || 0,
        isConsumable: isConsumable,
        productUrl: amazonAffiliateUrl,
      };
    });

    if (candidates.length > 0) {
      await supabase.from('search_cache').insert([{ query: cleanQuery, candidates: candidates }]);
    }

    return NextResponse.json({ candidates });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'AI処理中にエラーが発生しました。時間を置いて再度お試しください。' },
      { status: 500 }
    );
  }
}