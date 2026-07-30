import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'キーワードを入力してください' }, { status: 400 });
    }

    // 環境変数からAPIキーを取得
    const apiKey = process.env.GROQ_API_KEY;

    // APIキーが存在しない場合の詳細エラーハンドリング
    if (!apiKey) {
      return NextResponse.json(
        { error: '【エラー】GROQ_API_KEY がVercelの環境変数に設定されていません。' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey });

    // AIへの指示プロンプト
    const prompt = `あなたはプロのキャンプパッキングアドバイザーです。
ユーザーが入力したキーワード「${query}」を解析し、該当する代表的な商品（キャンプギア、食料品、飲料、燃料、日用品など）の候補を最大3件推測・特定して、指定のJSON形式のみで出力してください。

【キーワード解釈のルール】
1. 曖昧な単語でも、メーカー名・ブランド名・正式商品名・規格（容量や型番）を自動補完してください。
2. 重量(weight)の推測ルール: 飲料や缶詰、食料品の場合、中身の内容量だけでなく「容器・パッケージ込みの総重量(g)」を推測してください。
3. カテゴリー(category)の判別ルール: 以下の5つのいずれかを厳密に選んで割り当ててください。
   - "ベースギア" : テント、タープ、ペグ、シュラフ、マット、チェア、テーブル、ランタンなどの基本道具
   - "調理ギア・燃料" : バーナー、クッカー、メスティン、焚き火台、ナイフ、クーラーボックス、CB缶/OD缶、薪、炭、着火剤など
   - "衣類・防寒着" : ウェア、着替え、レインウェア、防寒具、帽子、シューズなど
   - "食料・飲料" : 肉、野菜、カップ麺、缶詰、調味料、水、お茶、お酒など
   - "その他・日用品" : ウェットティッシュ、ゴミ袋、救急セット、ポータブル電源、洗面具、雑貨など
4. 型番(model_number)がない食品や日用品の場合は、空文字("")にしてください。
5. 解説や挨拶など、JSON以外の文章は絶対に含めないでください。

【出力フォーマット】:
{
  "candidates": [
    {
      "brand": "メーカー名またはブランド名",
      "model_number": "型番（無ければ空文字\"\"）",
      "product_name": "正確な商品名",
      "category": "ベースギア" | "調理ギア・燃料" | "衣類・防寒着" | "食料・飲料" | "その他・日用品",
      "weight": 容器を含む1個あたりの本体総重量(グラム数値のみ),
      "price": 標準的な実売価格または定価の日本円数値のみ
    }
  ]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const text = chatCompletion.choices[0]?.message?.content;
    if (!text) {
      throw new Error('Groq AIからの応答テキストが空でした');
    }

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
    // 詳細なエラー内容を画面に返す
    return NextResponse.json(
      { error: `【AI検索エラー詳細】: ${error.message || JSON.stringify(error)}` },
      { status: 500 }
    );
  }
}