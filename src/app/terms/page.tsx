import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export const metadata = {
  title: '利用規約 | Camp Gear Manager',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 p-4 sm:p-8 font-sans flex flex-col justify-between">
      <div className="max-w-3xl mx-auto space-y-6 w-full flex-1">
        <Link className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition" href="/">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>トップへ戻る</span>
        </Link>

        <header className="border-b border-zinc-800 pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            利用規約
          </h1>
          <p className="text-xs text-zinc-500 mt-1">最終改定日: 2026年9月6日</p>
        </header>

        <div className="space-y-6 text-xs text-zinc-300 leading-relaxed pb-12">
          {/* 第1条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第1条（適用および運営者）</h2>
            <p>
              本規約は、Camp Gear Manager 運営事務局（以下「運営者」といいます）が提供するWebサービス「Camp Gear Manager」（以下「本サービス」といいます）の利用条件を定めるものです。
            </p>
            <p>
              ユーザーの皆さま（以下「ユーザー」といいます）は、本規約およびプライバシーポリシーの内容を確認し、これらに同意した上で本サービスを利用するものとします。ユーザーが本サービスの利用を開始した場合、本規約に同意したものとみなします。
            </p>
          </section>

          {/* 第2条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第2条（禁止事項）</h2>
            <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 pl-2">
              <li>法令または公序良俗に違反する行為、または犯罪行為に関連する行為</li>
              <li>運営者または第三者の著作権、商標権、肖像権、プライバシーその他の権利・利益を侵害する行為</li>
              <li>本人の同意その他適法な権限なく、第三者の個人情報、顔写真、購入レシート等を入力またはアップロードする行為</li>
              <li>虚偽、不正確または誤解を招く情報を故意に入力する行為</li>
              <li>本サービスのサーバーやネットワークの機能を破壊、妨害、または過度な負荷をかける行為</li>
              <li>不正アクセス、脆弱性の探索、認証・アクセス制御の回避等のセキュリティ侵害行為</li>
              <li>APIエンドポイントへの不正・過度なリクエスト、自動化手段による不正な情報取得（スクレイピング等）</li>
              <li>共有URLを不正に取得・拡散し、または利用権限のない共有リストを閲覧・改ざんする行為</li>
              <li>マルウェア等の有害なプログラムを送信・拡散する行為</li>
              <li>本サービスを無断で複製、改変、再販売、再配布または商用提供する行為</li>
              <li>その他、運営者が本サービスの目的および運営に照らして合理的に不適切と判断する行為</li>
            </ul>
          </section>

          {/* 第3条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第3条（AI機能および提供情報の免責）</h2>
            <p>
              1. 本サービスが提供するギア情報（商品名、メーカー名、重量、価格、カテゴリー等）およびAI（人工知能）による画像・テキスト解析結果は、ユーザー入力情報に基づく参考情報・目安値であり、運営者はその正確性、完全性、最新性、有用性または特定目的への適合性を保証しません。
            </p>
            <p>
              2. AI解析結果には誤認識や数値の誤りが含まれる場合があります。ユーザーは、製品表示、公式スペック、実測値等により自身で内容を確認した上で利用するものとします。
            </p>
            <p>
              3. ユーザーは、本サービスの算出結果を、航空機・車両・運送サービスの重量制限や、ラック・ザック等の耐荷重制限、または火器・燃料・バッテリー等の安全判断に単独で使用してはなりません。本サービスの情報に起因して生じた事故、荷崩れ、手荷物超過料金の発生等について、運営者は故意または過失がある場合を除き責任を負いません。
            </p>
          </section>

          {/* 第4条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第4条（共有機能）</h2>
            <p>
              1. ユーザーが共有機能を有効にした場合、共有URLを知る者は共有設定に応じてリストの閲覧・編集を行うことができます。
            </p>
            <p>
              2. ユーザーは、共有URLを自己の責任において管理し、共有リストに公開を予定していない機密情報や個人情報を入力しないものとします。
            </p>
            <p>
              3. 共有相手によるデータの改ざん、削除、意図しない第三者への再共有等によって生じた損害について、運営者は故意または過失がある場合を除き責任を負いません。重要なデータについては、ユーザー自身でCSVエクスポート等のバックアップを行ってください。
            </p>
          </section>

          {/* 第5条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第5条（外部サービスおよびアフィリエイト連携）</h2>
            <p>
              1. 本サービス内には、Amazon.co.jpその他の第三者が運営する外部ストアへのリンクが含まれる場合があります。
            </p>
            <p>
              2. 運営者はリンク先における商品の販売当事者ではありません。商品の購入、決済、配送、品質、保証等に関する取引および紛争は、ユーザーと販売事業者との間で直接解決されるものとし、運営者に故意または過失がある場合を除き、運営者は責任を負いません。
            </p>
            <p>
              3. 本サービスは、Amazon.co.jpを宣伝しリンクすることによって紹介料を獲得できる手段を提供する、Amazonアソシエイト・プログラムの参加者です。
            </p>
          </section>

          {/* 第6条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第6条（本サービスの変更、中断および終了）</h2>
            <p>
              1. 運営者は、保守、障害対応、セキュリティ確保その他の運営上の理由により、本サービスの全部または一部を変更、中断または終了することができます。
            </p>
            <p>
              2. 運営者は、本サービスを終了する場合、緊急時を除き、合理的な予告期間を設けて本サービス上で告知します。
            </p>
            <p>
              3. 緊急保守、クラウド・外部API（Gemini等）の障害、サイバー攻撃、不可抗力等の事由によりサービスが一時中断されたことでユーザーに生じた損害について、運営者は故意または過失がある場合を除き責任を負いません。
            </p>
          </section>

          {/* 第7条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第7条（損害賠償責任の制限）</h2>
            <p>
              1. 運営者の過失（重過失を除きます）によりユーザーに損害が生じた場合、運営者が負う損害賠償責任は、現実に発生した直接かつ通常の損害（上限10,000円）を限度とします。ただし、ユーザーの生命または身体に生じた損害についてはこの上限を適用しません。
            </p>
            <p>
              2. 運営者の故意または重大な過失によって生じた損害については、前項の責任制限は適用されません。
            </p>
          </section>

          {/* 第8条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第8条（本規約の変更）</h2>
            <p>
              1. 運営者は、民法第548条の4に基づき、変更がユーザーの一般の利益に適合する場合、または利用目的に反せず合理的である場合に、本規約を変更できるものとします。
            </p>
            <p>
              2. 運営者は、本規約を変更する場合、効力発生日の前に変更内容および効力発生日を本サービス上で告知します。
            </p>
          </section>

          {/* 第9条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第9条（ユーザーデータおよび権利帰属）</h2>
            <p>
              1. ユーザーが本サービスに入力・アップロードしたテキスト、画像、リスト情報等の権利は、ユーザーまたは正当な権利者に留保されます。
            </p>
            <p>
              2. ユーザーは運営者に対し、本サービスの提供、AI解析、データ保存、共有表示、保守および不正利用防止に必要な範囲内で、ユーザーデータを利用・複製・送信することを許諾するものとします。
            </p>
          </section>

          {/* 第10条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第10条（知的財産権）</h2>
            <p>
              本サービスを構成するプログラム、UIデザイン、ロゴ、文章等に関する知的財産権は、運営者または正当な権利者に帰属します。
            </p>
          </section>

          {/* 第11条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第11条（利用制限およびデータの削除）</h2>
            <p>
              運営者は、ユーザーが本規約に違反した場合、またはセキュリティ確保等の合理的な理由がある場合、事前の通知なく当該ユーザーによるアクセス制限や入力データの削除・非公開化を行うことができるものとします。
            </p>
          </section>

          {/* 第12条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第12条（未成年者による利用）</h2>
            <p>
              未成年者が本サービスを利用する場合は、法令上必要となる場合、親権者その他の法定代理人の同意を得た上で利用してください。
            </p>
          </section>

          {/* 第13条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第13条（分離可能性）</h2>
            <p>
              本規約のいずれかの条項またはその一部が法令等により無効または執行不能と判断された場合であっても、本規約の残りの規定は完全に有効に存続するものとします。
            </p>
          </section>

          {/* 第14条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第14条（準拠法および合意管轄）</h2>
            <p>
              1. 本規約の準拠法は日本法とします。
            </p>
            <p>
              2. 本サービスまたは本規約に関して紛争が生じた場合、東京地方裁判所または東京簡易裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>

          {/* 第15条 */}
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-white">第15条（お問い合わせ）</h2>
            <p>
              本規約に関するお問い合わせは、
              <Link href="/contact" className="text-[#FF5500] hover:underline ml-1">
                お問い合わせフォーム
              </Link>
              よりご連絡ください。
            </p>
          </section>
        </div>
      </div>

      {/* 共通フッター */}
      <div className="max-w-3xl mx-auto w-full">
        <Footer />
      </div>
    </main>
  );
}