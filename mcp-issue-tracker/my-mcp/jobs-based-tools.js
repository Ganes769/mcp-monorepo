import { z } from "zod";

export default function jobsBasedTools(server) {
  const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

  // Helper function to make HTTP requests
  async function makeRequest(method, url, data = null, options = {}) {
    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    // Merge other options except headers (which we already handled)
    const { headers: _, ...otherOptions } = options;
    Object.assign(config, otherOptions);

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const result = await response.text();

      let jsonResult;
      try {
        jsonResult = JSON.parse(result);
      } catch {
        jsonResult = result;
      }

      return {
        status: response.status,
        data: jsonResult,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } catch (error) {
      return {
        status: 0,
        error: error.message,
      };
    }
  }

  // Tag IDs differ between databases (local SQLite vs Turso), so resolve
  // them by name at call time instead of hardcoding. Cached per process.
  const tagIdCache = new Map();
  async function getTagIdByName(name, apiKey) {
    if (tagIdCache.has(name)) {
      return tagIdCache.get(name);
    }

    const result = await makeRequest("GET", `${API_BASE_URL}/tags`, null, {
      headers: { "x-api-key": apiKey },
    });

    const tags = result?.data?.data;
    if (!Array.isArray(tags)) {
      throw new Error(
        `Could not fetch tags: ${JSON.stringify(result?.data ?? result?.error)}`,
      );
    }

    const match = tags.find(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    );
    if (!match) {
      const available = tags.map((t) => `${t.name} (id: ${t.id})`).join(", ");
      throw new Error(`Tag "${name}" not found. Available tags: ${available}`);
    }

    tagIdCache.set(name, match.id);
    return match.id;
  }

  // Tool 1: Create new bug with high priority
  server.registerTool(
    "create-bug",
    {
      title: "Create High Priority Bug",
      description: "Create a new bug issue with high priority and bug tag",
      inputSchema: {
        title: z.string().describe("Bug title"),
        description: z.string().describe("Bug description"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { apiKey, ...bugData } = params;

      let bugTagId;
      try {
        bugTagId = await getTagIdByName("bug", apiKey);
      } catch (error) {
        return {
          content: [{ type: "text", text: error.message }],
          isError: true,
        };
      }

      // Create bug with high priority and bug tag
      const issueData = {
        ...bugData,
        priority: "high",
        status: "not_started",
        tag_ids: [bugTagId],
      };

      const result = await makeRequest(
        "POST",
        `${API_BASE_URL}/issues`,
        issueData,
        { headers: { "x-api-key": apiKey } },
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // Tool 2: Create new feature request with low priority
  server.registerTool(
    "create-feature-request",
    {
      title: "Create Low Priority Feature Request",
      description:
        "Create a new feature request issue with low priority and feature tag",
      inputSchema: {
        title: z.string().describe("Feature request title"),
        description: z.string().describe("Feature request description"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { apiKey, ...featureData } = params;

      let featureTagId;
      try {
        featureTagId = await getTagIdByName("feature", apiKey);
      } catch (error) {
        return {
          content: [{ type: "text", text: error.message }],
          isError: true,
        };
      }

      // Create feature request with low priority and feature tag
      const issueData = {
        ...featureData,
        priority: "low",
        status: "not_started",
        tag_ids: [featureTagId],
      };

      const result = await makeRequest(
        "POST",
        `${API_BASE_URL}/issues`,
        issueData,
        { headers: { "x-api-key": apiKey } },
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );

  // Tool 3: Update ticket status
  server.registerTool(
    "update-ticket-status",
    {
      title: "Update Ticket Status",
      description: "Update the status of an existing ticket/issue",
      inputSchema: {
        id: z.number().describe("Issue ID to update"),
        status: z
          .enum(["not_started", "in_progress", "done"])
          .describe("New status for the ticket"),
        apiKey: z.string().describe("API key for authentication"),
      },
    },
    async (params) => {
      const { id, status, apiKey } = params;

      const result = await makeRequest(
        "PUT",
        `${API_BASE_URL}/issues/${id}`,
        { status },
        { headers: { "x-api-key": apiKey } },
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    },
  );
}
