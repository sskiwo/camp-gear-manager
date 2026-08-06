import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: '.env.local に GEMINI_API_KEY が設定されていません' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    let queryHint = (formData.get('queryHint') as string | null)?.trim() || '';
    const exclude = (formData.get('exclude') as string | null)?.trim() || '';

    // Data URLなどの入力事故を防ぐため1,000文字までに制限
    if (queryHint.startsWith('data:')) {
      queryHint = '';
    }
    if (queryHint.length > 1000) {
      queryHint = queryHint.substring(0, 1000);
    }

    // どちらも入力されていない場合はエラー
    if (!file && !queryHint) {
      return NextResponse.json(
        { error: '検索キーワードを入力するか、画像を選択してください' },
        { status: 400 }
      );
    }

    // --- プロンプト（AIへの指示文）の動的構築 ---
    let promptText = `あなたはキャンプギアの専門データベースAIです。`;

    if (file && queryHint) {
      // パターン③: テキスト + 画像
      promptText += `\n【解析モード: 画像 ＋ 補助テキスト】`;
      promptText += `\n提供された画像と、ユーザーからの入力キーワード「${queryHint}」（型番・メーカー名・Amazon URL等）の両方を組み合わせ、該当する商品およびそのバリエーション・定番同等品を特定してください。`;
    } else if (file) {
      // パターン②: 画像のみ
      promptText += `\n【解析モード: 画像のみ】`;
      promptText += `\n提供された画像（キャンプギア現物・パッケージ箱・購入レシートなど）を視覚的に解析し、商品を特定してください。`;
    } else {
      // パターン①: テキストのみ
      promptText += `\n【解析モード: テキスト検索】`;
      promptText += `\nユーザーが入力した「${queryHint}」（型番・商品名・メーカー・Amazon URL等）から該当するキャンプギアを特定してください。`;
    }

    promptText += `\n\n【必須要件】
1. 対象商品および近い仕様の定番モデルを含めて最大3つの候補を出力してください。
2. カテゴリーは「ベース」「調理」「衣類」「その他」「消耗品」のいずれか1つに厳密に分類してください。
3. 重量(g)と価格(円:税込)は、公式データまたは一般的な定価・実売価格の推測値を正確な数値で出力してください。`;

    if (exclude) {
      promptText += `\n\n※以下の商品は除外して別の関連候補を提案してください: ${exclude}`;
    }

    // Structured Outputs (JSONレスポンス定義)
    const config = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            description: '検出・検索されたギア候補リスト（最大3つ）',
            items: {
              type: Type.OBJECT,
              properties: {
                product_name: { type: Type.STRING, description: 'ギア名・商品名（型番含む）' },
                brand: { type: Type.STRING, description: 'メーカー・ブランド名' },
                weight: { type: Type.NUMBER, description: '重量(g単位)。' },
                price: { type: Type.NUMBER, description: '価格(円単位)。' },
                category: {
                  type: Type.STRING,
                  description: 'カテゴリー（ベース, 調理, 衣類, その他, 消耗品 のいずれか）',
                },
              },
              required: ['product_name', 'brand', 'weight', 'price', 'category'],
            },
          },
        },
        required: ['items'],
      },
    };

    const parts: any[] = [];

    // 画像が存在する場合はBase64に変換して添付
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: '画像サイズが大きすぎます(10MB以下にしてください)' },
          { status: 400 }
        );
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString('base64');

      // 💡 MIMEタイプの判定と補正（application/octet-stream などの判定漏れを完全防止）
      let mimeType = file.type;
      if (!mimeType || mimeType === 'application/octet-stream' || !mimeType.startsWith('image/')) {
        mimeType = 'image/jpeg';
      }

      parts.push({
        inlineData: {
          mimeType,
          data: base64Data,
        },
      });
    }

    // テキストプロンプトを追加
    parts.push({ text: promptText });

    const contents = [{ role: 'user', parts }];

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config,
    });

    const responseText = response.text;
    if (!responseText) {
      return NextResponse.json(
        { error: 'AIからの応答を取得できませんでした' },
        { status: 500 }
      );
    }

    const jsonResult = JSON.parse(responseText);

    return NextResponse.json({
      results: jsonResult.items || [],
    });
  } catch (error: any) {
    console.error('API /api/scan Error:', error);
    return NextResponse.json(
      { error: error.message || '検索処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}