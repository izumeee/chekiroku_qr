import { handleHomepage } from "../src/link-redirect.js";

export function onRequest(context) {
  return handleHomepage(context);
}
