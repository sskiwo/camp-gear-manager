'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

function PrivacyContent() {
  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 sm:p-8 font-sans flex flex-col justify-between">
      <div className="max-w-3xl mx-auto space-y-6 w-full flex-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>トップへ戻る</span>
        </Link>

        <header className="border-b border-zinc-800 pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            プライバシーポリシー
          </h1>
          <p className="text-xs text-zinc-500 mt-1">最終改定日: 2026年9月6日</p>
        </header>

        <div className="space-y-6 text-xs text-zinc-300 leading-relaxed pb-12">
          {/* 第1条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第1条（事業者情報）</h2>
            <p>
              Camp Gear Manager（以下「当サービス」といいます）の運営者情報は以下のとおりです。
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>運営者：Camp Gear Manager 運営事務局</li>
              <li>お問い合わせ窓口：本ポリシー第15条に記載の窓口</li>
            </ul>
          </section>

          {/* 第2条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第2条（取得する情報）</h2>
            <p>当サービスは、次の情報を取得・保存する場合があります。</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>ユーザーが入力または登録したギア情報、メーカー名、重量、価格、カテゴリー、数量、キャンプ設定、パッキングリストその他の登録情報。</li>
              <li>AI機能に入力されたテキスト、アップロードされた画像、商品URLおよびAIによる解析結果。</li>
              <li>共有機能の設定、共有リストの内容および編集履歴。</li>
              <li>お問い合わせ時に入力された氏名、メールアドレス、問い合わせ内容その他の情報。</li>
              <li>IPアドレス、Cookie、アクセス日時、閲覧ページ、リファラー、ブラウザ、OS、端末情報、操作ログその他の利用情報。</li>
              <li>不正アクセス、過度なリクエストその他の不正利用を検知・防止するために必要な情報。</li>
              <li>Amazonその他の外部サイトへのリンクの利用に関する情報。</li>
            </ul>
            <p className="text-zinc-500 text-[11px] pt-1">
              ※アップロードされた画像（レシート等）には、個人情報が含まれる場合があります。
            </p>
          </section>

          {/* 第3条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第3条（利用目的）</h2>
            <p>取得した情報は、次の目的で利用します。</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>ギア情報およびパッキングリストの登録、保存、共有、編集および重量計算機能を提供するため。</li>
              <li>AIによる画像・テキスト解析機能を提供するため。</li>
              <li>本サービスの本人認証、セキュリティ確保および不正利用防止のため。</li>
              <li>本サービスの保守、障害対応、利用状況の分析および改善のため。</li>
              <li>ユーザーからの問い合わせ、開示等の請求および苦情に対応するため。</li>
              <li>利用規約違反への対応および権利保護のため。</li>
              <li>法令上必要な対応を行うため。</li>
            </ul>
          </section>

          {/* 第4条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第4条（AI機能に関する情報の取扱い）</h2>
            <p>
              1. AI解析機能を利用した場合、ユーザーが入力した画像、テキスト、商品URLその他の情報は、Googleが提供するGemini APIに送信され、解析処理されます。
            </p>
            <p>
              2. ユーザーは、AI機能に入力する前に、氏名、住所、電話番号、メールアドレス、会員番号、クレジットカード情報、顔画像その他解析に不要な情報を削除またはマスキングしてください。他人の個人情報を含む情報を、その本人の承諾なく入力しないでください。
            </p>
            <p>
              3. Gemini APIにおけるデータの取り扱いおよび保護措置については、GoogleのプライバシーポリシーおよびAPI利用規約に従います。
            </p>
          </section>

          {/* 第5条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第5条（外部サービスおよび委託・外部送信）</h2>
            <p>
              当サービスは、サービスの提供および利便性向上のため、以下の外部サービスに情報の取り扱いを委託・外部送信しています。
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li><strong className="text-zinc-200">Supabase</strong>（データベース管理・データ永続化）</li>
              <li><strong className="text-zinc-200">Vercel</strong>（ホスティング・サーバー配信・ログ監視）</li>
              <li><strong className="text-zinc-200">Google LLC</strong>（Gemini APIによるAI解析機能の提供）</li>
            </ul>
            <p className="pt-1">
              当サービスは、委託先を適切に選定し、契約その他の方法により必要な監督を行います。
            </p>
          </section>

          {/* 第6条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第6条（第三者提供）</h2>
            <p>当サービスは、次の場合を除き、本人の同意なく個人データを第三者に提供しません。</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護に必要であり、本人の同意を得ることが困難な場合</li>
              <li>国または地方公共団体等が法令上の事務を遂行するために協力する必要がある場合</li>
              <li>利用目的の達成に必要な範囲で取扱いを委託する場合</li>
              <li>その他法令により認められる場合</li>
            </ul>
          </section>

          {/* 第7条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第7条（共有機能）</h2>
            <p>
              ユーザーが共有機能を有効にした場合、共有URLを知る第三者が、共有設定に応じてリストを閲覧または編集できます。ユーザーは、共有リストに公開を予定していない個人情報を入力しないでください。共有URLの送信先および公開範囲は、ユーザー自身で適切に管理してください。
            </p>
          </section>

          {/* 第8条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第8条（Cookieおよびアクセス解析）</h2>
            <p>
              1. 当サービスは、サービスの提供、セキュリティ確保、利用状況の把握その他の目的で、Cookieその他の類似技術を使用する場合があります。
            </p>
            <p>
              2. ユーザーはブラウザの設定によりCookieを無効にできますが、その場合、本サービスの一部の機能を利用できないことがあります。
            </p>
          </section>

          {/* 第9条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第9条（Amazonアソシエイト・プログラム）</h2>
            <p>
              当サービスは、Amazon.co.jpを宣伝しリンクすることによってサイトが紹介料を獲得できる手段を提供することを目的に設定されたアフィリエイトプログラムである、Amazonアソシエイト・プログラムの参加者です。第三者（Amazon等）がコンテンツおよび宣伝を提供し、訪問者から直接情報を収集し、訪問者のブラウザにCookieを設定または認識する場合があります。
            </p>
          </section>

          {/* 第10条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第10条（安全管理措置）</h2>
            <p>
              当サービスは、取り扱う情報への不正アクセス、漏えい、滅失または毀損を防止するため、通信の暗号化（SSL/TLS）、アクセス権限の制限、APIレートリミットの設置その他の適切かつ合理的な安全管理措置を講じます。
            </p>
          </section>

          {/* 第11条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第11条（保存期間）</h2>
            <p>
              当サービスは、取得した情報を利用目的の達成に必要な期間保存し、その後、法令上またはセキュリティ上保存が必要な場合を除き、適切な方法で削除または匿名化します。
            </p>
          </section>

          {/* 第12条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第12条（開示等の請求）</h2>
            <p>
              1. ユーザーは、法令に基づき、当サービスが保有する本人の保有個人データについて開示、訂正、削除等を請求できます。
            </p>
            <p>
              2. 当サービスは原則として会員登録不要で提供しており、個々のギアリストと特定の個人を照合・特定することが困難な場合、一部の開示・削除請求に応じられないことがあります。請求手続きの詳細は第15条のお問い合わせ窓口へご連絡ください。
            </p>
          </section>

          {/* 第13条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第13条（未成年者）</h2>
            <p>
              未成年者が本サービスを利用する場合は、必要に応じて親権者その他の法定代理人の同意を得た上で利用してください。
            </p>
          </section>

          {/* 第14条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第14条（プライバシーポリシーの変更）</h2>
            <p>
              当サービスは、法令の改正、サービス内容の変更その他必要に応じて、本ポリシーを変更することがあります。重要な変更を行う場合は、本サービス上で分かりやすい方法により告知します。
            </p>
          </section>

          {/* 第15条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第15条（お問い合わせ窓口）</h2>
            <p>
              本サービスにおける情報の取扱いに関するご質問、ご意見、または開示等の請求は、以下のお問い合わせ窓口よりご連絡ください。
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>運営者名：Camp Gear Manager 運営事務局</li>
              <li>
                お問い合わせ先：
                <Link href="/contact" className="text-[#FF5500] hover:underline ml-1">
                  お問い合わせフォーム
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <Footer />
      </div>
    </main>
  );
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090B] text-zinc-400 p-8 text-center text-xs">読み込み中...</div>}>
      <PrivacyContent />
    </Suspense>
  );
}