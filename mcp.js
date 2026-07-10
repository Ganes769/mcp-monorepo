import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const server = new McpServer({
  name: "my-mcp",
  version: "1.0.0",
});
server.registerTool(
  "add",
  {
    title: "Addition tool",
    description: "Add two numbers",
    inputSchema: {
      a: z.number(),
      b: z.number(),
    },
  },
  async ({ a, b }) => {
    return {
      content: [{ type: "text", text: `The sum of ${a} and ${b} is ${a + b}` }],
    };
  },
);
const transport = new StdioServerTransport();
await server.connect(transport);
