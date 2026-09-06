export interface ShareDataOptions {
  title?: string;
  text?: string;
  url?: string;
}

/**
 * アプリ紹介・結果シェア用の共通関数
 * Web Share API に対応している環境ではシステム共有シートを起動し、
 * 非対応の環境（PC等）ではクリップボードへのコピーを行います。
 */
export async function shareApp(customData?: ShareDataOptions): Promise<boolean> {
  const defaultUrl = typeof window !== 'undefined' ? window.location.origin : 'https://camp-gear-manager.vercel.app';
  
  const shareTitle = customData?.title || 'Camp Gear Manager | キャンプギア重量＆お金管理アプリ';
  const shareText = customData?.text || 'キャンプギアのパッキングや重量シミュレーション、振り返りが簡単にできるWebアプリ「Camp Gear Manager」！荷物の軽量化やグループキャンプの共有に便利です⛺✨';
  const shareUrl = customData?.url || defaultUrl;

  const fullShareText = `${shareText}\n${shareUrl}`;

  // 1. Web Share API が利用可能な場合（スマートフォンなど）
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return true;
    } catch (err: any) {
      // ユーザーが共有シートを手動キャンセルした場合はエラーにしない
      if (err?.name === 'AbortError') {
        return false;
      }
      console.warn('Web Share API error, falling back to clipboard:', err);
    }
  }

  // 2. クリップボードへのコピーにフォールバック（PCブラウザなど）
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(fullShareText);
      alert('📋 紹介リンクとメッセージをクリップボードにコピーしました！\nLINEやSNSに貼り付けて送ってください。');
      return true;
    } catch (clipErr) {
      console.error('Failed to copy to clipboard:', clipErr);
    }
  }

  // 3. どちらも失敗した最終フォールバック
  try {
    const textArea = document.createElement('textarea');
    textArea.value = fullShareText;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('📋 紹介リンクとメッセージをクリップボードにコピーしました！');
    return true;
  } catch (legacyErr) {
    alert(`以下のURLを友だちに共有してください:\n${shareUrl}`);
    return false;
  }
}