import { handleTrackedLink } from "../src/link-redirect.js";

export function onRequest(context) {
  return handleTrackedLink(context, { source: "app" });
}

