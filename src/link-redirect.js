export const APP_STORE_URL = "https://apps.apple.com/jp/app/id6505026936";
export const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.izumeee.chekiroku";
export const LANDING_PAGE_URL = "https://chekiroku.com/";
export const ANALYTICS_HOST = "chekiroku.com";
export const LEGACY_PAGES_HOST = "chekiroku-qr.pages.dev";
export const LEGACY_QR_URL = "https://chekiroku.com/qr1";

const BOT_PATTERN =
  /bot|crawler|spider|preview|facebookexternalhit|slackbot|discordbot|telegrambot|skypeuripreview|whatsapp/i;
const CAMPAIGN_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}._-]{0,63}$/u;

export function classifyRequest(userAgent = "", cf = {}) {
  const isKnownBot = cf.botManagement?.verifiedBot === true || BOT_PATTERN.test(userAgent);
  const trafficType = isKnownBot ? "known_bot" : "unclassified";

  if (/android/i.test(userAgent)) {
    return { device: "android", trafficType };
  }

  if (/iphone|ipad|ipod|macintosh.*mobile/i.test(userAgent)) {
    return { device: "ios", trafficType };
  }

  if (/windows|macintosh|cros|linux/i.test(userAgent)) {
    return { device: "desktop", trafficType };
  }

  return { device: "other", trafficType };
}

export function normalizeCampaign(value, fallback = "default") {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }

  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return "invalid";
  }

  const normalized = decoded.normalize("NFKC").trim().toLowerCase();
  return CAMPAIGN_PATTERN.test(normalized) ? normalized : "invalid";
}

export function getReferrerHost(request) {
  const referrer = request.headers.get("referer");
  if (!referrer) {
    return "direct";
  }

  try {
    return new URL(referrer).hostname || "direct";
  } catch {
    return "invalid";
  }
}

export function selectDestination({ device, trafficType }) {
  if (trafficType === "known_bot") {
    return { name: "landing", url: LANDING_PAGE_URL };
  }

  if (device === "android") {
    return { name: "google_play", url: GOOGLE_PLAY_URL };
  }

  if (device === "ios") {
    return { name: "app_store", url: APP_STORE_URL };
  }

  return { name: "landing", url: LANDING_PAGE_URL };
}

function redirect(location) {
  return new Response(null, {
    status: 302,
    headers: {
      "Cache-Control": "no-store",
      Location: location,
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

function methodNotAllowed() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: { Allow: "GET, HEAD" },
  });
}

function writeAnalytics(context, event) {
  if (event.hostname !== ANALYTICS_HOST) {
    return false;
  }

  const dataset = context.env?.LINK_ANALYTICS;
  if (!dataset || typeof dataset.writeDataPoint !== "function") {
    return false;
  }

  try {
    dataset.writeDataPoint({
      indexes: [event.source],
      blobs: [
        event.source,
        event.campaign,
        event.device,
        event.destination,
        event.trafficType,
        event.referrerHost,
        event.country,
        event.hostname,
        event.pathname,
      ],
      doubles: [1],
    });
    return true;
  } catch {
    return false;
  }
}

export function handleTrackedLink(context, { source, campaign = "default" }) {
  const { request } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return methodNotAllowed();
  }

  const url = new URL(request.url);
  const classification = classifyRequest(
    request.headers.get("user-agent") || "",
    request.cf,
  );
  const destination = selectDestination(classification);

  if (request.method === "GET") {
    writeAnalytics(context, {
      source,
      campaign: normalizeCampaign(campaign),
      device: classification.device,
      destination: destination.name,
      trafficType: classification.trafficType,
      referrerHost: getReferrerHost(request),
      country: request.cf?.country || "unknown",
      hostname: url.hostname,
      pathname: url.pathname,
    });
  }

  return redirect(destination.url);
}

export function handleLegacyQr1(context) {
  const { request } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return methodNotAllowed();
  }

  const url = new URL(request.url);
  if (url.hostname === LEGACY_PAGES_HOST) {
    return redirect(LEGACY_QR_URL);
  }

  return handleTrackedLink(context, {
    source: "qr",
    campaign: "legacy-qr1",
  });
}
