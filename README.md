# esbuild-scripts

Scripts to build a static site + start a live dev server using esbuild.
Made because I got tired of copy/pasting between projects.

Only supports ESM config files for now.

```
Usage: esbuild-scripts [options] [command]

Options:
  -c, --config <string>  Path to esbuild config (default: "./esbuild.config.mjs")
  -h, --help             display help for command

Commands:
  build                  runs esbuild and saves metafile.json
  start                  builds and then runs a live-reloading dev server
  help [command]         display help for command
```

## esbuild.config.mjs

```js
// Defaults to localhost:3000
export const devConfig = {
	host: 'localhost',
	port: 4000,
};

export const esbuildConfig = ({ isProd }) => ({
	outdir, // required for `start`
})
```

