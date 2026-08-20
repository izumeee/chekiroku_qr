import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { onRequest as onHomepageRequest } from "../functions/index.js";
import { onRequest as onQrCampaignRequest } from "../functions/qr/[campaign].js";
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  HOMEPAGE_URL,
  LEGACY_QR_URL,
  classifyRequest,
  getReferrerHost,
  handleLegacyQr1,
  handleTrackedLink,
  normalizeCampaign,
  selectDestination,
} from "../src/link-redirect.js";

function createContext({
  url = "https://chekiroku.com/app",
  method = "GET",
  userAgent = "",
  referrer,
  cookie,
  country = "JP",
  analytics,
} = {}) {
  const headers = new Headers({ "user-agent": userAgent });
  if (referrer) {
    headers.set("referer", referrer);
  }
  if (cookie) {
    headers.set("cookie", cookie);
  }

  return {
    request: {
      url,
      method,
      headers,
      cf: { country },
    },
    env: analytics ? { LINK_ANALYTICS: analytics } : {},
  };
}

test("classifyRequestはAndroidを分類する", () => {
  assert.deepEqual(classifyRequest("Mozilla/5.0 (Linux; Android 15; Pixel 9)"), {
    device: "android",
    trafficType: "unclassified",
  });
});

test("classifyRequestはiOSを分類する", () => {
  assert.deepEqual(classifyRequest("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)"), {
    device: "ios",
    trafficType: "unclassified",
  });
});

test("classifyRequestはiPadOSのデスクトップ形式UAをiOSに分類する", () => {
  assert.deepEqual(
    classifyRequest(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    ),
    {
      device: "ios",
      trafficType: "unclassified",
    },
  );
});

test("classifyRequestはSNSプレビューBotを分離する", () => {
  assert.deepEqual(classifyRequest("Twitterbot/1.0"), {
    device: "other",
    trafficType: "known_bot",
  });
});

test("classifyRequestはCloudflareのverified botシグナルを利用する", () => {
  assert.deepEqual(classifyRequest("", { botManagement: { verifiedBot: true } }), {
    device: "other",
    trafficType: "known_bot",
  });
});

test("normalizeCampaignは安全な識別子だけを受け付ける", () => {
  assert.equal(normalizeCampaign("Event_2026"), "event_2026");
  assert.equal(normalizeCampaign("Summer.2026"), "summer.2026");
  assert.equal(normalizeCampaign("夏フェス2026"), "夏フェス2026");
  assert.equal(
    normalizeCampaign(encodeURIComponent("夏フェス2026")),
    "夏フェス2026",
  );
  assert.equal(normalizeCampaign("event/name"), "invalid");
  assert.equal(normalizeCampaign("%E0%A4%A"), "invalid");
  assert.equal(normalizeCampaign(""), "default");
});

test("getReferrerHostはホスト名だけを返す", () => {
  const context = createContext({ referrer: "https://x.com/example?secret=value" });
  assert.equal(getReferrerHost(context.request), "x.com");
});

test("selectDestinationは既知Botにダウンロードページを返す", () => {
  assert.deepEqual(selectDestination({ device: "android", trafficType: "known_bot" }), {
    kind: "page",
    name: "download_page",
  });
});

test("Androidアクセスを記録してGoogle Playへ転送する", () => {
  const points = [];
  const context = createContext({
    url: "https://chekiroku.com/qr/event-2026",
    userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9)",
    referrer: "https://example.com/private/path?token=secret",
    analytics: { writeDataPoint: (point) => points.push(point) },
  });

  const response = handleTrackedLink(context, {
    source: "qr",
    campaign: "event-2026",
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), GOOGLE_PLAY_URL);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(points.length, 1);
  assert.deepEqual(points[0].indexes, ["qr"]);
  assert.deepEqual(points[0].blobs, [
    "qr",
    "event-2026",
    "android",
    "google_play",
    "unclassified",
    "example.com",
    "JP",
    "chekiroku.com",
    "/qr/event-2026",
  ]);
});

test("Cookieとクエリを計測データへ保存しない", () => {
  const points = [];
  const context = createContext({
    url: "https://chekiroku.com/sns/x?token=private-value",
    referrer: "https://example.com/private/path?secret=value",
    cookie: "session=private-cookie",
    analytics: { writeDataPoint: (point) => points.push(point) },
  });

  handleTrackedLink(context, { source: "sns", campaign: "x" });

  const serialized = JSON.stringify(points[0]);
  assert.doesNotMatch(serialized, /private-value|private-cookie|private\/path|secret/);
  assert.match(serialized, /example\.com/);
});

test("previewホストへのアクセスは本番データへ記録しない", () => {
  const points = [];
  const context = createContext({
    url: "https://preview.chekiroku-qr.pages.dev/qr/event-2026",
    analytics: { writeDataPoint: (point) => points.push(point) },
  });

  handleTrackedLink(context, { source: "qr", campaign: "event-2026" });

  assert.equal(points.length, 0);
});

test("Pagesのエンコード済み日本語campaignを記録する", () => {
  const points = [];
  const context = createContext({
    url: `https://chekiroku.com/qr/${encodeURIComponent("夏フェス2026")}`,
    analytics: { writeDataPoint: (point) => points.push(point) },
  });
  context.params = { campaign: encodeURIComponent("夏フェス2026") };

  onQrCampaignRequest(context);

  assert.equal(points.length, 1);
  assert.equal(points[0].blobs[1], "夏フェス2026");
});

test("iOSアクセスをApp Storeへ転送する", () => {
  const context = createContext({
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)",
  });
  const response = handleTrackedLink(context, { source: "app" });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), APP_STORE_URL);
});

test("PCと判定不能なアクセスにダウンロードページを返す", async () => {
  const points = [];
  const desktop = createContext({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6)",
    analytics: { writeDataPoint: (point) => points.push(point) },
  });
  const unknown = createContext({ userAgent: "unknown-client" });

  const desktopResponse = handleTrackedLink(desktop, { source: "app" });
  const unknownResponse = handleTrackedLink(unknown, { source: "app" });

  assert.equal(desktopResponse.status, 200);
  assert.match(desktopResponse.headers.get("content-type"), /text\/html/);
  assert.equal(desktopResponse.headers.get("location"), null);
  assert.equal(unknownResponse.status, 200);
  assert.equal(points[0].blobs[3], "download_page");

  const html = await desktopResponse.text();
  assert.match(html, /会えた日のこと/);
  assert.match(html, new RegExp(APP_STORE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(html, new RegExp(GOOGLE_PLAY_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(html, /\/download-qr\.svg/);
  assert.match(html, /\/app-store-badge-ja\.svg/);
  assert.match(html, /\/google-play-badge-ja\.svg/);
  assert.match(html, /rel="icon"[^>]+href="\/app-icon\.png"/);
  assert.match(html, /rel="apple-touch-icon"[^>]+href="\/app-icon\.png"/);
  assert.doesNotMatch(html, /store-icon|store-copy/);
  assert.match(html, /property="og:title"/);
  assert.doesNotMatch(html, /<script/i);
});

test("ダウンロードページはクエリをcanonical URLへ含めない", async () => {
  const context = createContext({
    url: "https://chekiroku.com/sns/x?token=private",
    userAgent: "Twitterbot/1.0",
  });
  const response = handleTrackedLink(context, { source: "sns", campaign: "x" });
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /href="https:\/\/chekiroku\.com\/sns\/x"/);
  assert.doesNotMatch(html, /token=private/);
  assert.match(response.headers.get("content-security-policy"), /default-src 'none'/);
});

test("公式ストアバッジSVGを同梱する", async () => {
  const [appStoreBadge, googlePlayBadge] = await Promise.all([
    readFile(new URL("../app-store-badge-ja.svg", import.meta.url), "utf8"),
    readFile(new URL("../google-play-badge-ja.svg", import.meta.url), "utf8"),
  ]);

  assert.match(appStoreBadge, /Download_on_the_App_Store_Badge_JP/);
  assert.match(googlePlayBadge, /aria-label="で手に入れよう"/);
});

test("トップページは端末にかかわらずホームページとして表示する", async () => {
  const userAgents = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6)",
  ];

  for (const userAgent of userAgents) {
    const context = createContext({
      url: "https://chekiroku.com/?utm_source=test",
      userAgent,
    });
    const response = onHomepageRequest(context);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("x-robots-tag"), null);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.ok(html.includes(`href="${HOMEPAGE_URL}"`));
    assert.match(html, /会えた日のこと/);
    assert.doesNotMatch(html, /集計するあなたに革命を/);
  }
});

test("トップページのHEADは本文を返さない", async () => {
  const response = onHomepageRequest(
    createContext({ url: HOMEPAGE_URL, method: "HEAD" }),
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("x-robots-tag"), null);
});

test("トップページは許可していないHTTPメソッドを拒否する", () => {
  const response = onHomepageRequest(
    createContext({ url: HOMEPAGE_URL, method: "POST" }),
  );

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("HEADは計測せずGETと同じ転送先を返す", () => {
  const points = [];
  const context = createContext({
    method: "HEAD",
    userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9)",
    analytics: { writeDataPoint: (point) => points.push(point) },
  });
  const response = handleTrackedLink(context, { source: "app" });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), GOOGLE_PLAY_URL);
  assert.equal(points.length, 0);
});

test("PCのHEADは本文なしのダウンロードページを返し計測しない", async () => {
  const points = [];
  const context = createContext({
    method: "HEAD",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6)",
    analytics: { writeDataPoint: (point) => points.push(point) },
  });
  const response = handleTrackedLink(context, { source: "app" });

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "");
  assert.equal(points.length, 0);
});

test("計測基盤が利用できなくても転送は継続する", () => {
  const context = createContext({
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)",
    analytics: {
      writeDataPoint: () => {
        throw new Error("analytics unavailable");
      },
    },
  });

  const response = handleTrackedLink(context, { source: "sns" });
  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), APP_STORE_URL);
});

test("許可していないHTTPメソッドは拒否する", () => {
  const context = createContext({ method: "POST" });
  const response = handleTrackedLink(context, { source: "app" });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET, HEAD");
});

test("旧pages.devのqr1はchekiroku.com/qr1へ転送する", () => {
  const context = createContext({
    url: "https://chekiroku-qr.pages.dev/qr1",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)",
  });
  const response = handleLegacyQr1(context);

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), LEGACY_QR_URL);
});

test("chekiroku.comのqr1はlegacy-qr1として計測する", () => {
  const points = [];
  const context = createContext({
    url: "https://chekiroku.com/qr1",
    userAgent: "Mozilla/5.0 (Linux; Android 15; Pixel 9)",
    analytics: { writeDataPoint: (point) => points.push(point) },
  });
  const response = handleLegacyQr1(context);

  assert.equal(response.headers.get("location"), GOOGLE_PLAY_URL);
  assert.equal(points.length, 1);
  assert.equal(points[0].blobs[0], "qr");
  assert.equal(points[0].blobs[1], "legacy-qr1");
});
