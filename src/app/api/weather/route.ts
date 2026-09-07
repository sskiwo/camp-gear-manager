import { NextResponse } from 'next/server';

// WMO 天気コード変換マップ
function getWeatherInfo(code: number): { label: string; icon: string } {
  switch (code) {
    case 0:
      return { label: '快晴', icon: '☀️' };
    case 1:
      return { label: '晴れ', icon: '🌤️' };
    case 2:
      return { label: '晴れ時々曇り', icon: '⛅' };
    case 3:
      return { label: '曇り', icon: '☁️' };
    case 45:
    case 48:
      return { label: '霧', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { label: '霧雨', icon: '🌧️' };
    case 61:
    case 63:
    case 65:
      return { label: '雨', icon: '☔' };
    case 71:
    case 73:
    case 75:
      return { label: '雪', icon: '❄️' };
    case 80:
    case 81:
    case 82:
      return { label: 'にわか雨', icon: '🌦️' };
    case 95:
    case 96:
    case 99:
      return { label: '雷雨', icon: '⚡' };
    default:
      return { label: '晴れ/曇り', icon: '🌤️' };
  }
}

// 気温と天候に応じたキャンパー向けアドバイス生成（過去・未来両対応）
function generateCampAdvice(
  minTemp: number,
  maxTemp: number,
  rainChance: number,
  isPast: boolean = false,
  precipitationSum?: number
): string {
  if (isPast) {
    const reflections: string[] = [];

    if ((precipitationSum !== undefined && precipitationSum > 0) || rainChance >= 50) {
      reflections.push(
        precipitationSum !== undefined && precipitationSum > 0
          ? `☔ 当日は雨（降水量 ${precipitationSum}mm）でした。レインウェアやタープでの雨対策が重要だったキャンプでした。`
          : '☔ 当日は雨模様でした。レインウェアや防水スタッフサックが活躍したキャンプでした。'
      );
    }

    if (minTemp <= 0) {
      reflections.push('❄️ 夜間は氷点下の極寒でした！冬用シュラフや厚手ダウン、寒さに強いOD缶が必要な環境でした。');
    } else if (minTemp <= 5) {
      reflections.push('❄️ 朝晩は真冬並み（5℃以下）に冷え込みました。しっかりした防寒着が必要な気候でした。');
    } else if (minTemp <= 11) {
      reflections.push('🧥 朝晩は肌寒く、フリースや上着がちょうど良い気温でした。');
    } else if (maxTemp >= 30) {
      reflections.push('☀️ 日中は30℃を超える暑さでした！タープの日除けや水分補給が欠かせない1日でした。');
    }

    if (reflections.length === 0) {
      reflections.push('⛺ 穏やかで過ごしやすく、絶好のキャンプ日和でした✨');
    }

    return reflections.join(' ');
  }

  const advices: string[] = [];

  if (rainChance >= 50) {
    advices.push('☔ 雨の確率が高めです。レインウェアや防水スタッフサック、予備ペグをお忘れなく！');
  }

  if (minTemp <= 0) {
    advices.push('❄️ 夜間は氷点下の極寒です！冬用シュラフ、厚手ダウン、寒さに強いOD缶やカイロを必ず準備してください。');
  } else if (minTemp <= 5) {
    advices.push('❄️ 朝晩は真冬並み（5℃以下）に冷え込みます。ダウンジャケットや温かいインナーを持参しましょう。');
  } else if (minTemp <= 11) {
    advices.push('🧥 朝晩は肌寒くなります。フリースやウインドブレーカーの防寒着があると安心です。');
  } else if (maxTemp >= 30) {
    advices.push('☀️ 日中は30℃以上の暑さです！十分な水分、保冷剤、日除けタープをしっかり備えましょう。');
  }

  if (advices.length === 0) {
    advices.push('⛺ 過ごしやすい絶好のキャンプ日和です！軽量パッキングで快適にお過ごしください✨');
  }

  return advices.join(' ');
}

// 有名キャンプ場の直接座標辞書（Open-Meteo Geocodingで見つかりにくい人気スポットを網羅）
interface CampsiteSpot {
  displayName: string;
  latitude: number;
  longitude: number;
}

const FAMOUS_CAMPSITES: Record<string, CampsiteSpot> = {
  // 東京・多摩・奥多摩
  ワンダフルネイチャービレッジ: { displayName: 'わんダフルネイチャーヴィレッジ (東京都あきる野市)', latitude: 35.7168, longitude: 139.2626 },
  ワンダフルネイチャーヴィレッジ: { displayName: 'わんダフルネイチャーヴィレッジ (東京都あきる野市)', latitude: 35.7168, longitude: 139.2626 },
  わんダフルネイチャービレッジ: { displayName: 'わんダフルネイチャーヴィレッジ (東京都あきる野市)', latitude: 35.7168, longitude: 139.2626 },
  わんダフルネイチャーヴィレッジ: { displayName: 'わんダフルネイチャーヴィレッジ (東京都あきる野市)', latitude: 35.7168, longitude: 139.2626 },
  ワンダフルネイチャー: { displayName: 'わんダフルネイチャーヴィレッジ (東京都あきる野市)', latitude: 35.7168, longitude: 139.2626 },
  わんダフルネイチャー: { displayName: 'わんダフルネイチャーヴィレッジ (東京都あきる野市)', latitude: 35.7168, longitude: 139.2626 },
  サマーランド: { displayName: '東京サマーランド・わんダフルネイチャー (東京都あきる野市)', latitude: 35.7168, longitude: 139.2626 },
  東京サマーランド: { displayName: '東京サマーランド・わんダフルネイチャー (東京都あきる野市)', latitude: 35.7168, longitude: 139.2626 },
  十里木ランド: { displayName: '十里木ランド (東京都あきる野市)', latitude: 35.7289, longitude: 139.2081 },
  十里木: { displayName: '十里木ランド (東京都あきる野市)', latitude: 35.7289, longitude: 139.2081 },
  奥秋川ビレッジ: { displayName: '奥秋川ビレッジ (東京都あきる野市)', latitude: 35.7335, longitude: 139.183 },
  氷川: { displayName: '氷川キャンプ場 (東京都奥多摩町)', latitude: 35.8069, longitude: 139.0996 },
  氷川キャンプ場: { displayName: '氷川キャンプ場 (東京都奥多摩町)', latitude: 35.8069, longitude: 139.0996 },
  川井: { displayName: '川井キャンプ場 (東京都奥多摩町)', latitude: 35.8115, longitude: 139.1352 },
  川井キャンプ場: { displayName: '川井キャンプ場 (東京都奥多摩町)', latitude: 35.8115, longitude: 139.1352 },
  アメリカキャンプ村: { displayName: 'アメリカキャンプ村 (東京都奥多摩町)', latitude: 35.8152, longitude: 139.1171 },
  山のふるさと村: { displayName: '山のふるさと村 (東京都奥多摩町)', latitude: 35.7725, longitude: 139.0305 },
  若洲: { displayName: '若洲公園キャンプ場 (東京都江東区)', latitude: 35.6178, longitude: 139.8378 },
  若洲公園: { displayName: '若洲公園キャンプ場 (東京都江東区)', latitude: 35.6178, longitude: 139.8378 },
  若洲海浜公園: { displayName: '若洲公園キャンプ場 (東京都江東区)', latitude: 35.6178, longitude: 139.8378 },
  城南島: { displayName: '城南島海浜公園 (東京都大田区)', latitude: 35.5786, longitude: 139.7825 },
  城南島海浜公園: { displayName: '城南島海浜公園 (東京都大田区)', latitude: 35.5786, longitude: 139.7825 },
  昭和記念公園: { displayName: '国営昭和記念公園 (東京都立川市)', latitude: 35.7088, longitude: 139.3951 },

  // 静岡・富士・朝霧・伊豆
  ふもとっぱら: { displayName: 'ふもとっぱら (静岡県富士宮市)', latitude: 35.4011, longitude: 138.5638 },
  朝霧ジャンボリー: { displayName: '朝霧ジャンボリー (静岡県富士宮市)', latitude: 35.3855, longitude: 138.5727 },
  田貫湖: { displayName: '田貫湖キャンプ場 (静岡県富士宮市)', latitude: 35.3475, longitude: 138.5658 },
  田貫湖キャンプ場: { displayName: '田貫湖キャンプ場 (静岡県富士宮市)', latitude: 35.3475, longitude: 138.5658 },
  渚園: { displayName: '渚園キャンプ場 (静岡県浜松市・浜名湖)', latitude: 34.6976, longitude: 137.6048 },
  やまぼうし: { displayName: 'やまぼうしオートキャンプ場 (静岡県御殿場市)', latitude: 35.2952, longitude: 138.8682 },
  大野路: { displayName: '大野路ファミリーキャンプ場 (静岡県裾野市)', latitude: 35.2346, longitude: 138.8242 },
  モビリティパーク: { displayName: 'モビリティパーク (静岡県伊豆の国市)', latitude: 35.0215, longitude: 139.0025 },

  // 山梨・道志・富士五湖
  浩庵: { displayName: '浩庵キャンプ場 (山梨県身延町・本栖湖)', latitude: 35.4746, longitude: 138.5772 },
  洪庵: { displayName: '浩庵キャンプ場 (山梨県身延町・本栖湖)', latitude: 35.4746, longitude: 138.5772 },
  浩庵キャンプ場: { displayName: '浩庵キャンプ場 (山梨県身延町・本栖湖)', latitude: 35.4746, longitude: 138.5772 },
  ほったらかし: { displayName: 'ほったらかしキャンプ場 (山梨県山梨市)', latitude: 35.7138, longitude: 138.675 },
  ほったらかしキャンプ場: { displayName: 'ほったらかしキャンプ場 (山梨県山梨市)', latitude: 35.7138, longitude: 138.675 },
  道志の森: { displayName: '道志の森キャンプ場 (山梨県道志村)', latitude: 35.5034, longitude: 139.0068 },
  道志の森キャンプ場: { displayName: '道志の森キャンプ場 (山梨県道志村)', latitude: 35.5034, longitude: 139.0068 },
  道志村: { displayName: '道志村 (山梨県)', latitude: 35.5186, longitude: 139.0232 },
  パインウッド: { displayName: 'パインウッドキャンプ場 (山梨県山梨市)', latitude: 35.7042, longitude: 138.6655 },
  本栖湖: { displayName: '本栖湖キャンプ場 (山梨県富士河口湖町)', latitude: 35.4595, longitude: 138.5912 },
  精進湖: { displayName: '精進湖キャンピングコテージ (山梨県富士河口湖町)', latitude: 35.4902, longitude: 138.6085 },
  西湖自由: { displayName: '西湖自由キャンプ場 (山梨県富士河口湖町)', latitude: 35.5005, longitude: 138.6812 },
  四尾連湖: { displayName: '四尾連湖水明荘 (山梨県市川三郷町)', latitude: 35.5262, longitude: 138.5178 },
  水明荘: { displayName: '四尾連湖水明荘 (山梨県市川三郷町)', latitude: 35.5262, longitude: 138.5178 },
  pica富士吉田: { displayName: 'PICA富士吉田 (山梨県富士吉田市)', latitude: 35.4612, longitude: 138.7758 },
  pica富士西湖: { displayName: 'PICA富士西湖 (山梨県富士河口湖町)', latitude: 35.5032, longitude: 138.6755 },
  pica八ヶ岳明野: { displayName: 'PICA八ヶ岳明野 (山梨県北杜市)', latitude: 35.8078, longitude: 138.4552 },

  // 神奈川・丹沢・相模原
  青野原: { displayName: '青野原野呂ロッジキャンプ場 (神奈川県相模原市)', latitude: 35.5702, longitude: 139.2255 },
  野呂ロッジ: { displayName: '青野原野呂ロッジキャンプ場 (神奈川県相模原市)', latitude: 35.5702, longitude: 139.2255 },
  新戸: { displayName: '新戸キャンプ場 (神奈川県相模原市)', latitude: 35.5721, longitude: 139.2225 },
  新戸キャンプ場: { displayName: '新戸キャンプ場 (神奈川県相模原市)', latitude: 35.5721, longitude: 139.2225 },
  青根: { displayName: '緑の休暇村青根キャンプ場 (神奈川県相模原市)', latitude: 35.5795, longitude: 139.1822 },
  青根キャンプ場: { displayName: '緑の休暇村青根キャンプ場 (神奈川県相模原市)', latitude: 35.5795, longitude: 139.1822 },
  このまさわ: { displayName: 'このまさわキャンプ場 (神奈川県相模原市)', latitude: 35.5862, longitude: 139.1555 },
  このまさわキャンプ場: { displayName: 'このまさわキャンプ場 (神奈川県相模原市)', latitude: 35.5862, longitude: 139.1555 },
  ボスコ: { displayName: 'BOSCO Auto Camp Base (神奈川県秦野市)', latitude: 35.4385, longitude: 139.1762 },
  bosco: { displayName: 'BOSCO Auto Camp Base (神奈川県秦野市)', latitude: 35.4385, longitude: 139.1762 },
  ウェルキャンプ西丹沢: { displayName: 'ウェルキャンプ西丹沢 (神奈川県山北町)', latitude: 35.4418, longitude: 139.0345 },
  西丹沢: { displayName: 'ウェルキャンプ西丹沢 (神奈川県山北町)', latitude: 35.4418, longitude: 139.0345 },
  芦ノ湖キャンプ村: { displayName: '芦ノ湖キャンプ村 (神奈川県箱根町)', latitude: 35.2392, longitude: 139.0012 },
  清川リバーランド: { displayName: '清川リバーランド (神奈川県清川村)', latitude: 35.4985, longitude: 139.2785 },

  // 埼玉・秩父・長瀞
  長瀞: { displayName: '長瀞オートキャンプ場 (埼玉県長瀞町)', latitude: 36.1049, longitude: 139.1139 },
  長瀞オートキャンプ場: { displayName: '長瀞オートキャンプ場 (埼玉県長瀞町)', latitude: 36.1049, longitude: 139.1139 },
  巾着田: { displayName: '巾着田 (埼玉県日高市)', latitude: 35.8858, longitude: 139.3093 },
  かわせみ河原: { displayName: 'かわせみ河原 (埼玉県寄居町)', latitude: 36.1158, longitude: 139.1985 },
  pica秩父: { displayName: 'PICA秩父 (埼玉県秩父市)', latitude: 35.9865, longitude: 139.0682 },

  // 千葉・房総
  昭和の森: { displayName: '昭和の森フォレストビレッジ (千葉県千葉市)', latitude: 35.5262, longitude: 140.2642 },
  フォレストビレッジ: { displayName: '昭和の森フォレストビレッジ (千葉県千葉市)', latitude: 35.5262, longitude: 140.2642 },
  森のまきば: { displayName: '森のまきばオートキャンプ場 (千葉県袖ケ浦市)', latitude: 35.3888, longitude: 140.0617 },
  有野実苑: { displayName: '有野実苑オートキャンプ場 (千葉県山武市)', latitude: 35.6792, longitude: 140.3855 },
  イレブンオート: { displayName: 'イレブンオートキャンプパーク (千葉県君津市)', latitude: 35.2952, longitude: 140.0452 },
  成田ゆめ牧場: { displayName: '成田ゆめ牧場オートキャンプ場 (千葉県成田市)', latitude: 35.8452, longitude: 140.3885 },

  // 群馬・栃木・茨城
  北軽井沢スウィートグラス: { displayName: '北軽井沢スウィートグラス (群馬県長野原町)', latitude: 36.4384, longitude: 138.5996 },
  スウィートグラス: { displayName: '北軽井沢スウィートグラス (群馬県長野原町)', latitude: 36.4384, longitude: 138.5996 },
  くりの木: { displayName: 'くりの木キャンプ場 (群馬県渋川市)', latitude: 36.495, longitude: 139.015 },
  皇海山: { displayName: '皇海山キャンプフォレスト (群馬県沼田市)', latitude: 36.6542, longitude: 139.2452 },
  キャンプアンドキャビンズ: { displayName: 'キャンプ・アンド・キャビンズ那須高原 (栃木県那須町)', latitude: 37.0125, longitude: 140.0385 },
  大洗: { displayName: '大洗キャンプ場 (茨城県大洗町)', latitude: 36.3125, longitude: 140.5752 },
  涸沼: { displayName: '涸沼自然公園キャンプ場 (茨城県茨城町)', latitude: 36.2895, longitude: 140.4852 },

  // 甲信越・関西・その他
  白馬: { displayName: '白馬 (長野県白馬村)', latitude: 36.6982, longitude: 137.8619 },
  陣馬形山: { displayName: '陣馬形山キャンプ場 (長野県中川村)', latitude: 35.6475, longitude: 137.9868 },
  戸隠: { displayName: '戸隠キャンプ場 (長野県長野市)', latitude: 36.7725, longitude: 138.0772 },
  スノーピークhq: { displayName: 'Snow Peak HEADQUARTERS (新潟県三条市)', latitude: 37.5255, longitude: 139.0725 },
  snowpeak: { displayName: 'Snow Peak HEADQUARTERS (新潟県三条市)', latitude: 37.5255, longitude: 139.0725 },
  笠置: { displayName: '笠置キャンプ場 (京都府笠置町)', latitude: 34.7592, longitude: 135.9325 },
  海山: { displayName: 'キャンプinn海山 (三重県紀北町)', latitude: 34.1206, longitude: 136.2162 },
  マイアミ浜: { displayName: 'マイアミ浜オートキャンプ場 (滋賀県野洲市)', latitude: 35.1565, longitude: 135.9867 },
  マキノ高原: { displayName: 'マキノ高原キャンプ場 (滋賀県高島市)', latitude: 35.4853, longitude: 136.0375 },
};

// かな・表記ゆれ正規化関数
function normalizeKana(text: string): string {
  let s = text.toLowerCase().replace(/[ 　\-_]/g, '');
  s = s.replace(/^(東京都|北海道|(京都|大阪)府|.+?[県])/g, '');
  s = s.replace(/(オート|おーと|ソロ|そろ)?(キャンプ|きゃんぷ)(場|じょう|サイト|さいと)?$/g, '');
  s = s.replace(/camp(site)?$/gi, '');
  s = s.replace(/[\u30a1-\u30f6]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) - 0x60)
  );
  s = s.replace(/ゔぃ|ヴ|ヴィ/g, 'び');
  s = s.replace(/ゔぇ|ヴェ/g, 'べ');
  s = s.replace(/ゔぁ|ヴァ/g, 'ば');
  s = s.replace(/ゔぉ|ヴォ/g, 'ぼ');
  return s;
}

function lookupKnownCampsite(query: string): CampsiteSpot | null {
  const clean = query
    .toLowerCase()
    .replace(/[ 　\-_]/g, '')
    .replace(/(オート|ソロ)?キャンプ場?$/, '')
    .replace(/camp(site)?$/i, '');

  if (FAMOUS_CAMPSITES[clean]) {
    return FAMOUS_CAMPSITES[clean];
  }

  const normQuery = normalizeKana(query);
  if (!normQuery) return null;

  // 1. 正規化された完全一致
  for (const [key, spot] of Object.entries(FAMOUS_CAMPSITES)) {
    if (normQuery === normalizeKana(key)) {
      return spot;
    }
  }

  // 2. 部分一致（短すぎる文字列の誤爆防止: 2文字以上）
  if (normQuery.length >= 2) {
    for (const [key, spot] of Object.entries(FAMOUS_CAMPSITES)) {
      const normKey = normalizeKana(key);
      if (normKey.length >= 2 && (normQuery.includes(normKey) || normKey.includes(normQuery))) {
        return spot;
      }
    }
  }

  return null;
}

// 日本の地名検索候補を生成（Open-Meteoのデータベース登録ゆらぎ・市区町村サフィックス有無を自動補正）
function generateSearchCandidates(rawQuery: string): string[] {
  const candidates: string[] = [];
  const seen = new Set<string>();

  const add = (str: string) => {
    const trimmed = str.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      candidates.push(trimmed);
    }
  };

  // 1. キャンプ場などのサフィックスを除去
  const clean = rawQuery
    .replace(/(オート|ソロ)?キャンプ場?$/g, '')
    .replace(/camp(site)?$/gi, '')
    .trim();

  add(rawQuery);
  if (clean !== rawQuery) {
    add(clean);
  }

  // 2. 表記ゆれ（ワン/わん、ビレッジ/ヴィレッジ）
  if (clean.includes('ワン')) add(clean.replace(/ワン/g, 'わん'));
  if (clean.includes('わん')) add(clean.replace(/わん/g, 'ワン'));
  if (clean.includes('ビレッジ')) add(clean.replace(/ビレッジ/g, 'ヴィレッジ'));
  if (clean.includes('ヴィレッジ')) add(clean.replace(/ヴィレッジ/g, 'ビレッジ'));

  // 3. 都道府県のプレフィックスを除去（例: 東京都立川市 -> 立川市, 立川）
  const prefRegex = /^(東京都|北海道|(京都|大阪)府|.+?[県])/;
  if (prefRegex.test(clean)) {
    const withoutPref = clean.replace(prefRegex, '').trim();
    add(withoutPref);

    const withoutSuffixAndPref = withoutPref.replace(/[市区町村]$/, '').trim();
    add(withoutSuffixAndPref);
  }

  // 4. 末尾の市区町村を除去（例: 立川市 -> 立川, 府中市 -> 府中）
  const withoutSuffix = clean.replace(/[市区町村]$/, '').trim();
  add(withoutSuffix);

  return candidates;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const locationQuery = searchParams.get('location')?.trim() || '';
    const targetDate = searchParams.get('date')?.trim() || '';

    if (!locationQuery) {
      return NextResponse.json(
        { error: '場所名またはキャンプ場名を入力してください' },
        { status: 400 }
      );
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    let displayName: string = '';

    // 1. 有名キャンプ場辞書を照会（0msヒット ＆ 最高精度）
    const matchedSpot = lookupKnownCampsite(locationQuery);
    if (matchedSpot) {
      latitude = matchedSpot.latitude;
      longitude = matchedSpot.longitude;
      displayName = matchedSpot.displayName;
    } else {
      // 2. 辞書にない場合は候補キーワードを順に Open-Meteo Geocoding へ問い合わせ
      const candidates = generateSearchCandidates(locationQuery);
      let firstResult: any = null;

      for (const cand of candidates) {
        try {
          const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            cand
          )}&count=1&language=ja&format=json`;

          const geoRes = await fetch(geocodeUrl, { next: { revalidate: 86400 } });
          if (geoRes.ok) {
            const geoData = await geoRes.json();
            if (geoData.results && geoData.results.length > 0) {
              firstResult = geoData.results[0];
              break;
            }
          }
        } catch {
          // 次の候補を試行
        }
      }

      if (firstResult) {
        latitude = firstResult.latitude;
        longitude = firstResult.longitude;
        const cityName = firstResult.admin2 || firstResult.name;
        displayName = firstResult.admin1
          ? `${cityName} (${firstResult.admin1})`
          : cityName;
      } else {
        // 3. Open-Meteoで見つからない場合、OpenStreetMap Nominatim でPOI・施設名を検索（フォールバック）
        for (const cand of candidates.slice(0, 3)) {
          try {
            const osmUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              cand
            )}&format=json&countrycodes=jp&addressdetails=1&limit=1`;
            const osmRes = await fetch(osmUrl, {
              headers: { 'User-Agent': 'CampGearManager/1.0 (contact: admin@campgear.app)' },
              next: { revalidate: 86400 },
            });
            if (osmRes.ok) {
              const osmData = await osmRes.json();
              if (Array.isArray(osmData) && osmData.length > 0) {
                const item = osmData[0];
                const lat = parseFloat(item.lat);
                const lon = parseFloat(item.lon);
                if (!isNaN(lat) && !isNaN(lon)) {
                  latitude = lat;
                  longitude = lon;
                  const city =
                    item.address?.city ||
                    item.address?.town ||
                    item.address?.village ||
                    item.address?.quarter ||
                    item.address?.suburb ||
                    '';
                  const state = item.address?.state || item.address?.province || '';
                  const areaDesc = [state, city].filter(Boolean).join('');
                  displayName = areaDesc ? `${item.name || cand} (${areaDesc})` : item.name || cand;
                  break;
                }
              }
            }
          } catch {
            // 次の候補を試行
          }
        }

        // 4. まだ見つからない場合：市区町村名の自動抽出（例: 「あきる野市のキャンプ場」から「あきる野市」を救済）
        if (latitude === null || longitude === null) {
          const municipalityMatch = locationQuery.match(
            /(.+?[都道府県])?([^\s都道府県市区町村]+[市区町村])/
          );
          if (municipalityMatch && municipalityMatch[2]) {
            try {
              const muniCand = municipalityMatch[2];
              const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
                muniCand
              )}&count=1&language=ja&format=json`;
              const geoRes = await fetch(geocodeUrl, { next: { revalidate: 86400 } });
              if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData.results && geoData.results.length > 0) {
                  const mResult = geoData.results[0];
                  latitude = mResult.latitude;
                  longitude = mResult.longitude;
                  const cityName = mResult.admin2 || mResult.name;
                  displayName = `${cityName} (${mResult.admin1 || ''}) ※「${locationQuery}」周辺`;
                }
              }
            } catch {
              // 続行
            }
          }
        }

        // すべての検索手段で見つからなかった場合
        if (latitude === null || longitude === null) {
          return NextResponse.json(
            {
              error: `「${locationQuery}」の位置が見つかりませんでした。市町村名（例: あきる野市、富士宮市、白馬村など）または近隣の地名でお試しください。`,
            },
            { status: 404 }
          );
        }
      }
    }

    // 日付文字列を正規化（例: 2026/9/8 -> 2026-09-08）
    const normalizeDate = (d: string) => {
      if (!d) return '';
      const clean = d.trim().replace(/\//g, '-');
      const parts = clean.split('-');
      if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
      return clean;
    };

    const normalizedTarget = normalizeDate(targetDate);

    // 日本時間（JST）の今日の日付（YYYY-MM-DD）
    const todayStr = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(new Date())
      .replace(/\//g, '-');

    const isPast = Boolean(normalizedTarget && normalizedTarget < todayStr);

    // 3. 過去の日程の場合：Open-Meteo Historical Weather Archive API から実際の実績天気を取得
    if (isPast && normalizedTarget) {
      try {
        const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${normalizedTarget}&end_date=${normalizedTarget}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FTokyo`;

        const archiveRes = await fetch(archiveUrl, { next: { revalidate: 86400 * 30 } }); // 過去実績は確定データのため30日キャッシュ
        if (archiveRes.ok) {
          const archiveData = await archiveRes.json();
          const daily = archiveData.daily;

          if (daily && daily.time && daily.time.length > 0) {
            const weatherCode = daily.weather_code[0] ?? 1;
            const maxTemp = Math.round((daily.temperature_2m_max[0] ?? 20) * 10) / 10;
            const minTemp = Math.round((daily.temperature_2m_min[0] ?? 10) * 10) / 10;
            const precipSum =
              daily.precipitation_sum?.[0] != null
                ? Math.round(daily.precipitation_sum[0] * 10) / 10
                : 0;
            const rainChance =
              precipSum > 0 ? (precipSum >= 5 ? 100 : Math.round(precipSum * 20)) : 0;

            const weatherInfo = getWeatherInfo(weatherCode);
            const advice = generateCampAdvice(minTemp, maxTemp, rainChance, true, precipSum);

            return NextResponse.json({
              location: displayName,
              query: locationQuery,
              targetDate: normalizedTarget,
              date: normalizedTarget,
              isDateMatched: true,
              isHistorical: true,
              dateNote: null,
              weatherCode,
              weatherLabel: weatherInfo.label,
              weatherIcon: weatherInfo.icon,
              maxTemp,
              minTemp,
              rainChance,
              precipitationSum: precipSum,
              advice,
            });
          }
        }
      } catch (archiveErr) {
        console.warn('Archive API fetch failed, falling back to forecast API:', archiveErr);
      }
    }

    // 4. 当日および未来の日程（またはフォールバック）：Forecast API（最大16日間）から予報を取得
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTokyo&forecast_days=16`;

    const weatherRes = await fetch(weatherUrl, { next: { revalidate: 3600 } }); // 1時間キャッシュ
    if (!weatherRes.ok) {
      throw new Error('気象データの取得に失敗しました');
    }

    const weatherData = await weatherRes.json();
    const daily = weatherData.daily;

    if (!daily || !daily.time || daily.time.length === 0) {
      throw new Error('天気予報データが見つかりませんでした');
    }

    const matchedIndex = normalizedTarget ? daily.time.indexOf(normalizedTarget) : -1;
    const isDateMatched = matchedIndex !== -1;

    // 一致する日があればその日、なければ今日（index: 0）を採用
    const dateIndex = isDateMatched ? matchedIndex : 0;
    const chosenDate = daily.time[dateIndex];

    let dateNote: string | null = null;
    if (normalizedTarget && !isDateMatched) {
      const latestDate = daily.time[daily.time.length - 1];
      const earliestDate = daily.time[0];
      if (normalizedTarget > latestDate) {
        dateNote = `※指定日（${normalizedTarget}）は16日以上先のため、現地の直近（本日 ${chosenDate}）の天気を表示しています`;
      } else if (normalizedTarget < earliestDate) {
        dateNote = `※指定日（${normalizedTarget}）の過去データが取得できなかったため、直近（本日 ${chosenDate}）の天気を表示しています`;
      } else {
        dateNote = `※指定日（${normalizedTarget}）の個別予報が見つからなかったため、直近（本日 ${chosenDate}）の天気を表示しています`;
      }
    }

    const weatherCode = daily.weather_code[dateIndex] ?? 1;
    const maxTemp = Math.round((daily.temperature_2m_max[dateIndex] ?? 20) * 10) / 10;
    const minTemp = Math.round((daily.temperature_2m_min[dateIndex] ?? 10) * 10) / 10;
    const rainChance = Math.round(daily.precipitation_probability_max[dateIndex] ?? 0);

    const weatherInfo = getWeatherInfo(weatherCode);
    const advice = generateCampAdvice(minTemp, maxTemp, rainChance, false);

    return NextResponse.json({
      location: displayName,
      query: locationQuery,
      targetDate: normalizedTarget || null,
      date: chosenDate,
      isDateMatched,
      isHistorical: false,
      dateNote,
      weatherCode,
      weatherLabel: weatherInfo.label,
      weatherIcon: weatherInfo.icon,
      maxTemp,
      minTemp,
      rainChance,
      precipitationSum: null,
      advice,
    });
  } catch (error: any) {
    console.error('Weather API Error:', error);
    return NextResponse.json(
      { error: error.message || '気象情報の取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
