import { handleLegacyQr1 } from "../src/link-redirect.js";

export function onRequest(context) {
  return handleLegacyQr1(context);
}

