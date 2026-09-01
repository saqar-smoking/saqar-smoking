// Explicit .js extension required: Vercel's Node runtime resolves this import
// with native ESM (which needs a file extension), even though the source is .ts.
import { createApp } from "../server/index.js";

const app = createApp();

export default app;
