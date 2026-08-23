import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

// 🛡️ 簡易レートリミット管理（メモリキャッシュ用）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1分間
const MAX_REQUESTS_PER_WINDOW = 5;    // 1分間に最大5回まで

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count += 1;
  return true;
}

export async function POST(request: Request) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'リクエストが多すぎます。しばらく時間を置いてから再度お試しください。（連打防止制限）' },
        { status: 429 }
      );
    }

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

    if (queryHint.startsWith('data:')) {
      queryHint = '';
    }
    if (queryHint.length > 1000) {
      queryHint = queryHint.substring(0, 1000);
    }

    if (!file && !queryHint) {
      return NextResponse.json(
        { error: '検索キーワードを入力するか、画像を選択してください' },
        { status: 400 }
      );
    }

    // 🎯 複数ギアの個別一括検出プロンプト
    let promptText = `あなたはキャンプギアの専門データベースAIです。`;

    if (file && queryHint) {
      promptText += `\n【解析モード: 画像 ＋ 補助テキスト】`;
      promptText += `\n提供された画像と、入力キーワード「${queryHint}」から該当するすべてのキャンプギアを特定してください。画像内に複数のアイテムが写っている場合は、それらを**個別にすべて検出**してください。`;
    } else if (file) {
      promptText += `\n【解析モード: 画像一括検出】`;
      promptText += `\n提供された画像（キャンプギア現物・パッキング展開写真・パッケージ・レシートなど）を視覚的に解析し、写っている**すべてのキャンプギアを個別に検出・分解してリスト化**してください。複数アイテムを1つにまとめず、それぞれ独立したアイテムとして出力してください。`;
    } else {
      promptText += `\n【解析モード: テキスト検索】`;
      promptText += `\nユーザーが入力した「${queryHint}」（型番・商品名・メーカー・Amazon URL等）から該当するキャンプギアを特定してください。`;
    }

    promptText += `\n\n【必須要件】
1. 画像内のすべてのギア、またはテキストに合致するギアを配列(リスト)で出力してください（最大10点まで）。
2. カテゴリーは「ベース」「調理」「衣類」「その他」「消耗品」のいずれか1つに厳密に分類してください。
3. 重量(g)と価格(円:税込)は、公式データまたは一般的な定価・実売価格の推測値を正確な数値で出力してください。`;

    if (exclude) {
      promptText += `\n\n※以下の商品は除外して別の関連候補を提案してください: ${exclude}`;
    }

    // Structured Outputs (JSONレスポンス定義: 配列形式)
    const config = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            description: '検出されたキャンプギア候補リスト（複数ある場合はすべて個別に分割出力）',
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

    parts.push({ text: promptText });

    const contents = [{ role: 'user', parts }];

    // 💡 有効なFlashモデルを指定
    const candidateModels = [
      'gemini-3.6-flash',
      'gemini-flash-latest'
    ];

    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        console.warn(`モデル [${modelName}] での試行に失敗しました。次を試します...`, err.message);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('Geminiモデルでの応答取得に失敗しました');
    }

    const responseText = response.text;
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