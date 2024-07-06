const result = await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  format: "esm",
  sourcemap: 'linked',
  minify: true,
  external: ["pino*"]
});

if (!result.success) {
  console.error("Build failed");
  for (const message of result.logs) {
    console.error(message);
  }
}