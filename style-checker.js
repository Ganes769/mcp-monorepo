import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import z from "zod";

import { readFileSync } from "fs";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
const airbnbMarkDownPath = "/Volumes/GaNesh/my-mcp/style-guide.md";
const airBnbMarkDown = readFileSync(airbnbMarkDownPath, "utf-8");
const server = new McpServer({
  name: "code review server",
  version: "1.0.0",
});
server.registerPrompt(
  "review-code",
  {
    title: "Code review",
    description: "Review code for best practice  and potential issue",
    argsSchema: { code: z.string() },
  },
  ({ code }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `please review this code  to see if it follow best practices.Use this airbnb style giude as refrence and rule:\n\n==============${airBnbMarkDown}
          \n\n===== here is the code ${code}`,
        },
      },
    ],
  }),
);
const transport = new StdioServerTransport();
await server.connect(transport);
