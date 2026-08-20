const PAGE_TITLE = "チェキロク｜推し活の記録・集計アプリ";
const PAGE_DESCRIPTION =
  "ライブやイベントで撮った枚数、会えた回数、記念日をかんたんに記録・集計できる推し活アプリ。";

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function createDownloadPageResponse({
  method,
  canonicalUrl,
  appStoreUrl,
  googlePlayUrl,
  indexable = false,
}) {
  const canonical = escapeHtml(canonicalUrl);
  const appStore = escapeHtml(appStoreUrl);
  const googlePlay = escapeHtml(googlePlayUrl);
  const body = method === "HEAD" ? null : `<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${PAGE_TITLE}</title>
    <meta name="description" content="${PAGE_DESCRIPTION}">
    <meta name="theme-color" content="#f58a1f">
    <meta name="apple-itunes-app" content="app-id=6505026936">
    <link rel="icon" type="image/png" sizes="384x384" href="/app-icon.png">
    <link rel="apple-touch-icon" sizes="384x384" href="/app-icon.png">
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="チェキロク">
    <meta property="og:title" content="${PAGE_TITLE}">
    <meta property="og:description" content="${PAGE_DESCRIPTION}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="https://chekiroku.com/app-icon.png">
    <meta property="og:image:width" content="384">
    <meta property="og:image:height" content="384">
    <meta property="og:image:alt" content="チェキロクのアプリアイコン">
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="${PAGE_TITLE}">
    <meta name="twitter:description" content="${PAGE_DESCRIPTION}">
    <meta name="twitter:image" content="https://chekiroku.com/app-icon.png">
    <style>
      :root {
        color-scheme: light;
        --orange: #f58a1f;
        --orange-dark: #a84f00;
        --ink: #26231f;
        --muted: #706a62;
        --line: #e9e3dc;
        --paper: #fffdf9;
        --wash: #f7f2ea;
      }
      * { box-sizing: border-box; }
      html { min-width: 320px; background: var(--wash); }
      body {
        min-height: 100vh;
        margin: 0;
        color: var(--ink);
        font-family: -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Yu Gothic UI", "Noto Sans JP", sans-serif;
        background:
          radial-gradient(circle at 18% 10%, rgba(245, 138, 31, .13), transparent 28rem),
          linear-gradient(135deg, #fffdf9 0%, #f6f0e8 100%);
      }
      a { color: inherit; }
      .page {
        width: min(1080px, calc(100% - 48px));
        min-height: 100vh;
        margin: 0 auto;
        display: grid;
        grid-template-rows: auto 1fr auto;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 30px 0;
        font-size: 18px;
        font-weight: 750;
        letter-spacing: .04em;
      }
      .brand img {
        width: 42px;
        height: 42px;
        border-radius: 11px;
        box-shadow: 0 6px 18px rgba(108, 63, 17, .16);
      }
      main {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(320px, .8fr);
        align-items: center;
        gap: clamp(48px, 8vw, 96px);
        padding: 38px 0 72px;
      }
      .eyebrow {
        margin: 0 0 18px;
        color: var(--orange-dark);
        font-size: 13px;
        font-weight: 800;
        letter-spacing: .16em;
      }
      h1 {
        margin: 0;
        font-size: clamp(42px, 3.8vw, 58px);
        line-height: 1.16;
        letter-spacing: -.045em;
        white-space: nowrap;
      }
      .lead {
        max-width: 590px;
        margin: 28px 0 0;
        color: var(--muted);
        font-size: 17px;
        line-height: 1.9;
      }
      .features {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        padding: 0;
        margin: 30px 0 0;
        list-style: none;
      }
      .features li {
        padding: 8px 13px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: rgba(255, 255, 255, .68);
        color: #565049;
        font-size: 13px;
        font-weight: 650;
      }
      .stores {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 28px;
        margin-top: 34px;
      }
      .store {
        display: inline-block;
        line-height: 0;
        text-decoration: none;
      }
      .store:focus-visible { outline: 3px solid rgba(245, 138, 31, .5); outline-offset: 3px; }
      .store img { display: block; width: auto; height: 54px; }
      .device-note { margin: 16px 0 0; color: #6f675e; font-size: 12px; }
      .download-card {
        position: relative;
        overflow: hidden;
        padding: 34px;
        border: 1px solid rgba(255, 255, 255, .92);
        border-radius: 32px;
        background: rgba(255, 255, 255, .8);
        box-shadow: 0 28px 80px rgba(82, 53, 22, .15), inset 0 0 0 1px rgba(225, 215, 203, .55);
        backdrop-filter: blur(18px);
      }
      .download-card::before {
        content: "";
        position: absolute;
        width: 220px;
        height: 220px;
        right: -90px;
        top: -110px;
        border-radius: 50%;
        background: rgba(245, 138, 31, .13);
      }
      .app-summary {
        position: relative;
        display: flex;
        align-items: center;
        gap: 18px;
      }
      .app-icon {
        width: 82px;
        height: 82px;
        flex: 0 0 auto;
        border-radius: 21px;
        box-shadow: 0 10px 26px rgba(116, 65, 15, .2);
      }
      .app-name { margin: 0; font-size: 25px; font-weight: 800; letter-spacing: -.02em; }
      .app-subtitle { margin: 5px 0 0; color: var(--muted); font-size: 13px; line-height: 1.6; }
      .scan {
        display: grid;
        grid-template-columns: 148px minmax(0, 1fr);
        align-items: center;
        gap: 24px;
        margin-top: 30px;
        padding-top: 30px;
        border-top: 1px solid var(--line);
      }
      .qr {
        display: block;
        width: 148px;
        height: 148px;
        padding: 9px;
        border: 1px solid var(--line);
        border-radius: 17px;
        background: #fff;
      }
      .scan strong { display: block; font-size: 16px; line-height: 1.55; }
      .scan p { margin: 8px 0 0; color: var(--muted); font-size: 13px; line-height: 1.7; }
      .short-url {
        display: inline-block;
        margin-top: 12px;
        padding: 6px 9px;
        border-radius: 8px;
        background: var(--wash);
        color: #514a42;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
      }
      footer {
        padding: 24px 0 30px;
        border-top: 1px solid rgba(216, 207, 197, .75);
        color: #6f675e;
        font-size: 11px;
      }
      @media (max-width: 800px) {
        .page { width: min(100% - 32px, 640px); }
        .brand { padding: 22px 0; }
        main { grid-template-columns: 1fr; gap: 42px; padding: 28px 0 54px; }
        h1 { font-size: clamp(28px, 9vw, 54px); }
        .lead { font-size: 16px; }
        .download-card { padding: 26px; border-radius: 26px; }
      }
      @media (max-width: 470px) {
        .stores { align-items: flex-start; flex-direction: column; }
        .scan { grid-template-columns: 112px minmax(0, 1fr); gap: 17px; }
        .qr { width: 112px; height: 112px; padding: 7px; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <header class="brand">
        <img src="/app-icon.png" width="42" height="42" alt="">
        <span>チェキロク</span>
      </header>
      <main>
        <section aria-labelledby="page-title">
          <p class="eyebrow">推し活記録アプリ</p>
          <h1 id="page-title">数で記録、思い出集計</h1>
          <p class="lead">ライブやイベントで撮った枚数、会えた回数、出会ってからの日数まで。チェキロクなら、推しとの思い出をすばやく記録して、あとからきれいに集計できます。</p>
          <ul class="features" aria-label="主な機能">
            <li>かんたん記録</li>
            <li>期間・カテゴリ別集計</li>
            <li>カレンダー</li>
            <li>記念日管理</li>
            <li>SNSシェア</li>
          </ul>
          <div class="stores" aria-label="アプリをダウンロード">
            <a class="store" href="${appStore}" rel="noopener noreferrer" aria-label="App Storeからダウンロード">
              <img src="/app-store-badge-ja.svg" width="147" height="54" alt="">
            </a>
            <a class="store" href="${googlePlay}" rel="noopener noreferrer" aria-label="Google Playで手に入れよう">
              <img src="/google-play-badge-ja.svg" width="182" height="54" alt="">
            </a>
          </div>
          <p class="device-note">App StoreまたはGoogle Playから無料でダウンロードできます。</p>
        </section>
        <aside class="download-card" aria-label="スマートフォンでダウンロード">
          <div class="app-summary">
            <img class="app-icon" src="/app-icon.png" width="82" height="82" alt="チェキロクのアプリアイコン">
            <div>
              <p class="app-name">チェキロク</p>
              <p class="app-subtitle">推しとの思い出を記録<br>基本機能は無料</p>
            </div>
          </div>
          <div class="scan">
            <img class="qr" src="/download-qr.svg" width="148" height="148" alt="チェキロクをスマートフォンで開くQRコード">
            <div>
              <strong>QRコードを読み取る</strong>
              <p>端末に合ったストアを自動で開きます。</p>
              <span class="short-url">chekiroku.com/app</span>
            </div>
          </div>
        </aside>
      </main>
      <footer>
        <span>© 2024–2026 イズミアプリケーション</span><br>
        <span>「チェキロク」は登録商標です。</span><br>
        <span>Apple、Appleのロゴ、App Storeは、米国およびその他の国で登録されたApple Inc.の商標です。Google PlayおよびGoogle Playロゴは、Google LLCの商標です。</span>
      </footer>
    </div>
  </body>
</html>`;

  const headers = {
    "Cache-Control": "no-store",
    "Content-Security-Policy":
      "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    "Content-Type": "text/html; charset=UTF-8",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };

  if (!indexable) {
    headers["X-Robots-Tag"] = "noindex, nofollow";
  }

  return new Response(body, { status: 200, headers });
}
