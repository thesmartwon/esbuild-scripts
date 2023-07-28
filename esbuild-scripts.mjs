#!/usr/bin/env node

import { program } from 'commander'
import { build } from './build.mjs'
import { start } from './start.mjs'
import { join } from 'path'

async function getConfig(command, buildOpts) {
	var res = undefined;
	const { config } = command.parent.opts()
	const configPath = join(process.cwd(), config)
	const { esbuildConfig, devConfig } = await import(`file://${configPath}`);
	switch (typeof esbuildConfig) {
		case 'function':
			res = {
				esbuildConfig: esbuildConfig(buildOpts),
				devConfig
			};
			break;
		case 'object':
			res = {
				esbuildConfig,
				devConfig
			};
			break;
		default:
			throw new Error('invalid esbuildConfig type', typeof esbuildConfig)
	}
	if (res === undefined) {
		throw new Error('no esbuildConfig provided. make sure to `export esbuildConfig = {}`')
	}
	return res
}

program
	.command('build')
	.description('runs esbuild and saves metafile.json')
	.action(async (_opts, command) => {
		const { esbuildConfig } = await getConfig(command, { isProd: true });
		await build(esbuildConfig)
	})

program
	.command('start')
	.description('builds and then runs a live-reloading dev server')
	.action(async (_opts, command) => {
		const { esbuildConfig, devConfig } = await getConfig(command, { isProd: false });
		await build(esbuildConfig)
		start(esbuildConfig, devConfig)
	})

program
	.option('-c, --config <string>', 'Path to esbuild config', './esbuild.config.mjs')
	.parse()
