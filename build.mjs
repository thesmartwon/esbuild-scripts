import { build as esbuild } from 'esbuild'
import { writeFileSync } from 'fs'
import { join } from 'path'

export async function build(esbuildConfig) {
	const { metafile } = await esbuild(esbuildConfig);
	if (metafile && esbuildConfig.outdir) {
		writeFileSync(join(esbuildConfig.outdir, 'metafile.json'), JSON.stringify(metafile, null, 2))
	}
}
