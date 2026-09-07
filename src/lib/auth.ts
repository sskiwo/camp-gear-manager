import { supabase } from './supabase';

/**
 * ⛺ 自動バッジ受け取り機能（匿名認証）
 * 
 * キャンプ場（アプリ）に来たユーザーに、メール登録不要で
 * 自動的に「自分専用の仮バッジ（匿名ユーザーID）」を発行・取得します。
 */
export async function getOrCreateAnonymousUser(): Promise<string | null> {
  try {
    // 1. すでにバッジを持っているか確認
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('セッション確認エラー:', sessionError.message);
    }

    if (session?.user) {
      return session.user.id;
    }

    // 2. バッジを持っていなければ、受付で新しい匿名バッジを発行
    const { data: signInData, error: signInError } = await supabase.auth.signInAnonymously();

    if (signInError) {
      console.warn(
        '⚠️ 匿名認証に失敗しました。Supabaseの管理画面で「Anonymous Sign-ins」が有効になっているか確認してください:',
        signInError.message
      );
      return null;
    }

    return signInData.user?.id || null;
  } catch (err: any) {
    console.error('匿名認証初期化エラー:', err);
    return null;
  }
}

/**
 * 現在のログイン中・匿名ユーザーのIDを取得
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}
