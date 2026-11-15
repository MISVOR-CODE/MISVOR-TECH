import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Default setup, no incremental cache. Add an R2 or KV cache here later if you start using revalidate / ISR.
// https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({});
