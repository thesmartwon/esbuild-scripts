import http from 'http'
import esbuild from 'esbuild'
import { existsSync } from 'fs'
import { join } from 'path'

// https://github.com/evanw/esbuild/pull/2816
const liveReload = `
new EventSource('/esbuild').addEventListener('change', e => {
	const { added, removed, updated } = JSON.parse(e.data)
	if (!added.length && !removed.length && updated.length === 1) {
		for (const link of document.getElementsByTagName("link")) {
			const url = new URL(link.href)
			if (url.host === location.host && url.pathname === updated[0]) {
				const next = link.cloneNode()
				next.href = updated[0] + '?' + Math.random().toString(36).slice(2)
				next.onload = () => link.remove()
				link.parentNode.insertBefore(next, link.nextSibling)
				return
			}
		}
	}
	location.reload()
})
`
async function streamToString(stream) {
	const chunks = [];
	for await (const chunk of stream) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks).toString("utf-8");
}

export async function start(esbuildConfig, devConfig = { host: 'localhost', port: 3000 }) {
	const context = await esbuild.context(esbuildConfig)
	await context.watch()

	// https://esbuild.github.io/api/#serve-proxy
	const servedir = esbuildConfig.outdir
	const host = devConfig.host
	const port = devConfig.port + 1
	await context.serve({ port, servedir })

	http.createServer((req, res) => {
		var path = req.url;
		if (!existsSync(join(servedir, path))) {
			if (existsSync(join(servedir, `${path.substring(1)}.html`))) path += '.html';
		}
		const options = {
			hostname: host,
			port,
			path,
			method: req.method,
			headers: req.headers,
		}

		const proxyReq = http.request(options, async proxyRes => {
			if (proxyRes.statusCode === 404) {
				res.writeHead(404, { 'Content-Type': 'text/html' })
				res.end('<h1>A custom 404 page</h1>')
				return
			}

			const contentType = proxyRes.headers?.['content-type']
			if (contentType && contentType.includes('text/html')) {
				const resp = (await streamToString(proxyRes)).replace('</body>', `<script>${liveReload}</script></body>`)
				const buffer = Buffer.from(resp, 'utf8')
				proxyRes.headers['content-length'] = buffer.length
				res.writeHead(proxyRes.statusCode, proxyRes.headers)
				res.write(resp)
				res.end()
			} else {
				res.writeHead(proxyRes.statusCode, proxyRes.headers)
				proxyRes.pipe(res, { end: true })
			}
		})

		req.pipe(proxyReq, { end: true })
	}).listen(devConfig.port)

	console.log(`serving on http://${host}:${devConfig.port}`)
}
