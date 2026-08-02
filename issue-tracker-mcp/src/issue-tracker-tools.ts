import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

const DEFAULT_API_BASE_URL = "https://mcp-monorepo-yccf.vercel.app/api";

type ApiResult = {
	status: number;
	data?: unknown;
	error?: string;
	headers?: Record<string, string>;
};

async function makeRequest(
	method: string,
	url: string,
	data: unknown = null,
	headers: Record<string, string> = {},
): Promise<ApiResult> {
	try {
		const response = await fetch(url, {
			method,
			headers: {
				"Content-Type": "application/json",
				...headers,
			},
			body: data == null ? undefined : JSON.stringify(data),
		});

		const text = await response.text();
		let jsonResult: unknown = text;
		try {
			jsonResult = JSON.parse(text);
		} catch {
			// keep raw text
		}

		return {
			status: response.status,
			data: jsonResult,
			headers: Object.fromEntries(response.headers.entries()),
		};
	} catch (error) {
		return {
			status: 0,
			error: error instanceof Error ? error.message : String(error),
		};
	}
}

function textResult(result: unknown, isError = false) {
	return {
		content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
		...(isError ? { isError: true } : {}),
	};
}

async function resolveTagNames(
	apiBaseUrl: string,
	tagNames: string[],
	apiKey: string,
): Promise<{ tagIds: number[] } | { error: string }> {
	const result = await makeRequest("GET", `${apiBaseUrl}/tags`, null, {
		"x-api-key": apiKey,
	});

	const tags = (result?.data as { data?: Array<{ id: number; name: string }> })
		?.data;
	if (!Array.isArray(tags)) {
		return {
			error: `Could not fetch tags to resolve names: ${JSON.stringify(result?.data ?? result?.error)}`,
		};
	}

	const tagIds: number[] = [];
	const unknown: string[] = [];
	for (const name of tagNames) {
		const match = tags.find(
			(t) => t.name.toLowerCase() === String(name).trim().toLowerCase(),
		);
		if (match) tagIds.push(match.id);
		else unknown.push(name);
	}

	if (unknown.length > 0) {
		const available = tags.map((t) => `${t.name} (id: ${t.id})`).join(", ");
		return {
			error: `Unknown tag name(s): ${unknown.join(", ")}. Available tags: ${available}`,
		};
	}

	return { tagIds };
}

export function registerIssueTrackerTools(
	server: McpServer,
	apiBaseUrl = DEFAULT_API_BASE_URL,
) {
	const base = apiBaseUrl.replace(/\/$/, "");

	server.registerTool(
		"issues-list",
		{
			description: "Get a list of issues with optional filtering",
			inputSchema: z.object({
				status: z
					.enum(["not_started", "in_progress", "done"])
					.optional()
					.describe("Filter by status"),
				assigned_user_id: z
					.string()
					.optional()
					.describe("Filter by assigned user ID"),
				tag_ids: z.string().optional().describe("Comma-separated tag IDs"),
				search: z
					.string()
					.optional()
					.describe("Search in title and description"),
				page: z.number().optional().describe("Page number (default: 1)"),
				limit: z
					.number()
					.optional()
					.describe("Items per page (default: 10, max: 100)"),
				priority: z
					.enum(["low", "medium", "high"])
					.optional()
					.describe("Filter by priority"),
				created_by_user_id: z
					.string()
					.optional()
					.describe("Filter by creator user ID"),
				apiKey: z.string().describe("API key for authentication"),
			}),
		},
		async (params) => {
			const { apiKey, ...queryParams } = params;
			const searchParams = new URLSearchParams();
			for (const [key, value] of Object.entries(queryParams)) {
				if (value !== undefined && value !== null) {
					searchParams.append(key, String(value));
				}
			}
			const url = `${base}/issues${
				searchParams.toString() ? `?${searchParams.toString()}` : ""
			}`;
			return textResult(
				await makeRequest("GET", url, null, { "x-api-key": apiKey }),
			);
		},
	);

	server.registerTool(
		"issues-create",
		{
			description: "Create a new issue",
			inputSchema: z.object({
				title: z.string().describe("Issue title"),
				description: z.string().optional().describe("Issue description"),
				status: z
					.enum(["not_started", "in_progress", "done"])
					.optional()
					.describe("Issue status"),
				priority: z
					.enum(["low", "medium", "high", "urgent"])
					.optional()
					.describe("Issue priority"),
				assigned_user_id: z.string().optional().describe("Assigned user ID"),
				tag_ids: z
					.array(z.number())
					.optional()
					.describe("Numeric tag IDs from tags-list"),
				tag_names: z
					.array(z.string())
					.optional()
					.describe('Tag names (e.g. ["bug"]); resolved to IDs automatically'),
				apiKey: z.string().describe("API key for authentication"),
			}),
		},
		async (params) => {
			const { apiKey, tag_names, ...issueData } = params;
			if (tag_names?.length) {
				const resolved = await resolveTagNames(base, tag_names, apiKey);
				if ("error" in resolved) return textResult(resolved.error, true);
				issueData.tag_ids = [
					...new Set([...(issueData.tag_ids ?? []), ...resolved.tagIds]),
				];
			}
			return textResult(
				await makeRequest("POST", `${base}/issues`, issueData, {
					"x-api-key": apiKey,
				}),
			);
		},
	);

	server.registerTool(
		"issues-get",
		{
			description: "Get a specific issue by its ID",
			inputSchema: z.object({
				id: z.number().describe("Issue ID"),
				apiKey: z.string().describe("API key for authentication"),
			}),
		},
		async ({ id, apiKey }) =>
			textResult(
				await makeRequest("GET", `${base}/issues/${id}`, null, {
					"x-api-key": apiKey,
				}),
			),
	);

	server.registerTool(
		"issues-update",
		{
			description: "Update an existing issue",
			inputSchema: z.object({
				id: z.number().describe("Issue ID"),
				title: z.string().optional().describe("Issue title"),
				description: z.string().optional().describe("Issue description"),
				status: z
					.enum(["not_started", "in_progress", "done"])
					.optional()
					.describe("Issue status"),
				priority: z
					.enum(["low", "medium", "high"])
					.optional()
					.describe("Issue priority"),
				assigned_user_id: z.string().optional().describe("Assigned user ID"),
				tag_ids: z.array(z.number()).optional().describe("Numeric tag IDs"),
				tag_names: z
					.array(z.string())
					.optional()
					.describe("Tag names resolved to IDs automatically"),
				apiKey: z.string().describe("API key for authentication"),
			}),
		},
		async (params) => {
			const { id, apiKey, tag_names, ...updateData } = params;
			if (tag_names?.length) {
				const resolved = await resolveTagNames(base, tag_names, apiKey);
				if ("error" in resolved) return textResult(resolved.error, true);
				updateData.tag_ids = [
					...new Set([...(updateData.tag_ids ?? []), ...resolved.tagIds]),
				];
			}
			return textResult(
				await makeRequest("PUT", `${base}/issues/${id}`, updateData, {
					"x-api-key": apiKey,
				}),
			);
		},
	);

	server.registerTool(
		"issues-delete",
		{
			description: "Delete an issue by ID",
			inputSchema: z.object({
				id: z.number().describe("Issue ID"),
				apiKey: z.string().describe("API key for authentication"),
			}),
		},
		async ({ id, apiKey }) =>
			textResult(
				await makeRequest("DELETE", `${base}/issues/${id}`, null, {
					"x-api-key": apiKey,
				}),
			),
	);

	server.registerTool(
		"tags-list",
		{
			description: "Get all available tags",
			inputSchema: z.object({
				apiKey: z.string().describe("API key for authentication"),
			}),
		},
		async ({ apiKey }) =>
			textResult(
				await makeRequest("GET", `${base}/tags`, null, {
					"x-api-key": apiKey,
				}),
			),
	);

	server.registerTool(
		"tags-create",
		{
			description: "Create a new tag",
			inputSchema: z.object({
				name: z.string().describe("Tag name"),
				color: z.string().describe("Tag color (hex format)"),
				apiKey: z.string().describe("API key for authentication"),
			}),
		},
		async ({ apiKey, ...tagData }) =>
			textResult(
				await makeRequest("POST", `${base}/tags`, tagData, {
					"x-api-key": apiKey,
				}),
			),
	);

	server.registerTool(
		"tags-delete",
		{
			description: "Delete a tag by ID",
			inputSchema: z.object({
				id: z.number().describe("Tag ID"),
				apiKey: z.string().describe("API key for authentication"),
			}),
		},
		async ({ id, apiKey }) =>
			textResult(
				await makeRequest("DELETE", `${base}/tags/${id}`, null, {
					"x-api-key": apiKey,
				}),
			),
	);

	server.registerTool(
		"users-list",
		{
			description: "Get all users",
			inputSchema: z.object({
				apiKey: z.string().describe("API key for authentication"),
			}),
		},
		async ({ apiKey }) =>
			textResult(
				await makeRequest("GET", `${base}/users`, null, {
					"x-api-key": apiKey,
				}),
			),
	);

	server.registerTool(
		"api-key-verify",
		{
			description: "Verify if an API key is valid",
			inputSchema: z.object({
				apiKey: z.string().describe("API key to verify"),
			}),
		},
		async ({ apiKey }) =>
			textResult(
				await makeRequest("POST", `${base}/auth/api-key/verify`, {
					key: apiKey,
				}),
			),
	);

	server.registerTool(
		"health-status",
		{
			description: "Get the health status of the issue tracker API",
			inputSchema: z.object({}),
		},
		async () =>
			textResult(await makeRequest("GET", `${base.replace(/\/api$/, "")}/health`)),
	);
}
