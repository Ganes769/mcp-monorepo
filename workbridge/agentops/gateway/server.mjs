import { createServer } from 'node:http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { HOST, PORT, WORKBRIDGE_API } from './config.mjs'
import { getBotConfig, listCalls, onCall, setBotPaused } from './store.mjs'
import { TOOLS, mcpName, runMonitored } from './tools.mjs'

const MCP_URL = `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/mcp`

function buildMcpServer(bot) {
  const server = new McpServer({ name: 'agentmesh-gateway', version: '0.1.0' })
  for (const tool of TOOLS) {
    server.registerTool(
      mcpName(tool.name),
      { title: tool.name, description: tool.description, inputSchema: tool.input },
      async (args) => {
        const outcome = await runMonitored({ bot, tool: tool.name, args, source: 'mcp' })
        return outcome.ok
          ? { content: [{ type: 'text', text: JSON.stringify(outcome.result, null, 2) }] }
          : { isError: true, content: [{ type: 'text', text: outcome.error }] }
      },
    )
  }
  return server
}

function botFrom(req, url) {
  const header = req.headers['x-agentmesh-bot']
  return (url.searchParams.get('bot') ?? (Array.isArray(header) ? header[0] : header) ?? 'Unknown bot').trim() || 'Unknown bot'
}

async function readJson(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString('utf8')
  return raw ? JSON.parse(raw) : undefined
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, X-AgentMesh-Bot, Mcp-Session-Id, Mcp-Protocol-Version',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  })
  res.end(JSON.stringify(body))
}

async function handleMcp(req, res, url) {
  if (req.method !== 'POST') return send(res, 405, { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed' }, id: null })
  const bot = botFrom(req, url)
  const server = buildMcpServer(bot)
  // Stateless mode: a fresh server + transport per request, so each request carries its own bot identity.
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  res.on('close', () => {
    void transport.close()
    void server.close()
  })
  await server.connect(transport)
  await transport.handleRequest(req, res, await readJson(req))
}

function handleStream(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })
  res.write(': connected\n\n')
  const unsubscribe = onCall((call) => res.write(`event: call\ndata: ${JSON.stringify(call)}\n\n`))
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000)
  req.on('close', () => {
    unsubscribe()
    clearInterval(heartbeat)
  })
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  try {
    if (req.method === 'OPTIONS') return send(res, 204, {})
    if (url.pathname === '/mcp') return await handleMcp(req, res, url)

    if (req.method === 'GET' && url.pathname === '/health') {
      return send(res, 200, { data: { ok: true, mcpUrl: MCP_URL, backend: WORKBRIDGE_API, tools: TOOLS.length } })
    }
    if (req.method === 'GET' && url.pathname === '/tools') {
      return send(res, 200, {
        data: TOOLS.map((t) => ({ name: t.name, mcpName: mcpName(t.name), server: t.server, description: t.description })),
      })
    }
    if (req.method === 'GET' && url.pathname === '/bots') {
      const { defaultPolicy, bots } = getBotConfig()
      return send(res, 200, { data: { defaultPolicy, bots: Object.entries(bots).map(([name, b]) => ({ name, ...b })) } })
    }
    const botAction = url.pathname.match(/^\/bots\/(.+)\/(pause|resume)$/)
    if (req.method === 'POST' && botAction) {
      const name = decodeURIComponent(botAction[1])
      const updated = setBotPaused(name, botAction[2] === 'pause')
      return updated ? send(res, 200, { data: { name, ...updated } }) : send(res, 404, { error: `Unknown bot ${name}` })
    }
    if (req.method === 'GET' && url.pathname === '/calls') {
      const limit = Math.min(Number(url.searchParams.get('limit') ?? 500), 5000)
      return send(res, 200, { data: listCalls(limit) })
    }
    if (req.method === 'GET' && url.pathname === '/calls/stream') return handleStream(req, res)
    if (req.method === 'POST' && url.pathname === '/test-call') {
      const body = (await readJson(req)) ?? {}
      const outcome = await runMonitored({ bot: body.bot ?? 'Dashboard test', tool: body.tool, args: body.args ?? {}, source: 'test' })
      return send(res, 200, { data: outcome.record })
    }
    send(res, 404, { error: 'Not found' })
  } catch (err) {
    console.error(err)
    if (!res.headersSent) send(res, 500, { error: err instanceof Error ? err.message : 'Internal error' })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`AgentMesh MCP gateway listening on ${MCP_URL}`)
  console.log(`Forwarding tool calls to ${WORKBRIDGE_API}`)
  console.log(`Identify bots with ?bot=<name> or the X-AgentMesh-Bot header`)
})
