New-Item -ItemType Directory -Path src\utils -Force; Set-Content -Path src\utils\affiliate.ts -Encoding UTF8 -Value @'
const DEFAULT_TRACKING_ID = process.env.NEXT_PUBLIC_AMAZON_TRACKING_ID || 'campgear0e-22';

/**
 * 商品名・ブランド・型番からAmazonアソシエイト検索URLを生成
 */
export function buildAmazonUrl(
  productName: string,
  brand?: string,
  modelNumber?: string
): string {
  const queryParts = [brand, productName, modelNumber]
    .filter((part): part is string => Boolean(part && part.trim()))
    .map((part) => part.trim());

  const query = queryParts.join(' ');
  const encodedQuery = encodeURIComponent(query);
  const tag = DEFAULT_TRACKING_ID;

  return `https://www.amazon.co.jp/s?k=${encodedQuery}${tag ? `&tag=${tag}` : ''}`;
}

/**
 * 既存のURLにAmazonアソシエイトタグ（tag）を付与・上書き
 */
export function attachAmazonTag(rawUrl: string): string {
  if (!rawUrl || !rawUrl.trim()) return '';

  const tag = DEFAULT_TRACKING_ID;
  if (!tag) return rawUrl;

  try {
    const urlObj = new URL(rawUrl);
    if (urlObj.hostname.includes('amazon.co.jp') || urlObj.hostname.includes('amazon.jp')) {
      urlObj.searchParams.set('tag', tag);
      return urlObj.toString();
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
}
'@