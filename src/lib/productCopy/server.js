// src/lib/productCopy/server.js
// THE import for app code: import { … } from "@/lib/productCopy/server".
// 'server-only' makes the build fail if a Client Component imports this file,
// so the 254 KB de.json (all drafts, approved or not) never reaches the
// browser bundle. Use it only in Server Components, generateMetadata and
// route handlers; pass the finished strings to client components as props.
// index.js stays importable without Next (node --test, tools), app code must
// not import it directly (enforced by tests/unit/productCopy.test.mjs).
import "server-only";

export {
  buildFaqJsonLd,
  getProductCopy,
  getProductCopyDraft,
  getProductCopyPreview,
  isPublishedCopy,
  listProductCopyKeys,
  metadataOverride,
  resolveProductCopy,
} from "./index.js";
