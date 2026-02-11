const serverResult = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  format: "esm",
  sourcemap: 'linked',
  minify: true,
  external: ["pino*"]
});

if (!serverResult.success) {
  console.error("Server build failed");
  for (const message of serverResult.logs) {
    console.error(message);
  }
}

const browserResult = await Bun.build({
  entrypoints: ['./src/index.browser.ts'],
  outdir: './dist',
  format: "esm",
  sourcemap: 'linked',
  minify: true,
});

if (!browserResult.success) {
  console.error("Browser build failed");
  for (const message of browserResult.logs) {
    console.error(message);
  }
}
