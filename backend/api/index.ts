// Vercel serves this file as the single serverless function. It re-exports the
// compiled Nest handler (built by `nest build` into ../dist) so that Vercel's
// esbuild bundler doesn't have to compile the decorator-heavy Nest source.
// vercel.json rewrites every request here; Nest's router handles the path.
// eslint-disable-next-line @typescript-eslint/no-var-requires
export { default } from "../dist/serverless";
