import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

const DEFAULT_API_BASE_URL = "https://mcp-monorepo-yccf.vercel.app/api";

type ApiResult = {
	status: number;
	data?: unknown;
	error?: string;
};

export type IssueTrackerConfig = {
	apiBaseUrl?: string;
	/** Optional Worker secret fallback if the chat does not pass apiKey */
	apiKey?: string;
};

type UserRow = { id: string; name: string; email: string };

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

		return { status: response.status, data: jsonResult };
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

function resolveKey(
	provided: string | undefined,
	fallback: string,
): string | null {
	const key = (provided || fallback || "").trim();
	return key || null;
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

async function resolveAssignee(
	apiBaseUrl: string,
	apiKey: string,
	assignee: string,
): Promise<{ userId: string } | { error: string }> {
	const result = await makeRequest("GET", `${apiBaseUrl}/users`, null, {
		"x-api-key": apiKey,
	});
	const users = (result?.data as { data?: UserRow[] })?.data;
	if (!Array.isArray(users)) {
		return {
			error: `Could not resolve assignee: ${JSON.stringify(result?.data ?? result?.error)}`,
		};
	}

	const needle = assignee.trim().toLowerCase();
	const match = users.find(
		(u) =>
			u.email?.toLowerCase() === needle ||
			u.name?.toLowerCase() === needle ||
			u.id === assignee.trim(),
	);

	if (!match) {
		const available = users.map((u) => `${u.name} <${u.email}>`).join(", ");
		return {
			error: `Unknown assignee "${assignee}". Available users: ${available}`,
		};
	}

	return { userId: match.id };
}

function mapPriority(
	priority?: "low" | "medium" | "high" | "urgent",
	severity?: "low" | "medium" | "high" | "critical",
): "low" | "medium" | "high" | "urgent" | undefined {
	if (priority) return priority;
	if (!severity) return undefined;
	if (severity === "critical") return "urgent";
	return severity;
}

const apiKeyField = z
	.string()
	.describe(
		"Issue Tracker API key (paste from the app for now). Sent as x-api-key.",
	);

export function registerIssueTrackerTools(
	server: McpServer,
	config: IssueTrackerConfig = {},
) {
	const base = (config.apiBaseUrl || DEFAULT_API_BASE_URL).replace(/\/$/, "");
	const fallbackKey = config.apiKey?.trim() || "";

	server.registerTool(
		"create_issue",
		{
			description:
				"Create a new issue. Pass apiKey from the Issue Tracker app in chat for now.",
			inputSchema: z.object({
				apiKey: apiKeyField,
				title: z.string().describe("Issue title"),
				description: z.string().optional().describe("Issue description"),
				priority: z
					.enum(["low", "medium", "high", "urgent"])
					.optional()
					.describe("Issue priority"),
				severity: z
					.enum(["low", "medium", "high", "critical"])
					.optional()
					.describe("Optional severity; mapped to priority if priority omitted"),
				status: z
					.enum(["not_started", "in_progress", "done"])
					.optional()
					.describe("Issue status"),
				assignee: z
					.string()
					.optional()
					.describe("Assignee email, name, or user id"),
				tag_names: z
					.array(z.string())
					.optional()
					.describe('Tag names, e.g. ["bug", "frontend"]'),
			}),
		},
		async (params) => {
			const apiKey = resolveKey(params.apiKey, fallbackKey);
			if (!apiKey) {
				return textResult({ error: "apiKey is required" }, true);
			}

			const body: Record<string, unknown> = {
				title: params.title,
				description: params.description,
				status: params.status,
				priority: mapPriority(params.priority, params.severity),
			};

			if (params.assignee) {
				const resolved = await resolveAssignee(base, apiKey, params.assignee);
				if ("error" in resolved) return textResult(resolved.error, true);
				body.assigned_user_id = resolved.userId;
			}

			if (params.tag_names?.length) {
				const resolved = await resolveTagNames(base, params.tag_names, apiKey);
				if ("error" in resolved) return textResult(resolved.error, true);
				body.tag_ids = resolved.tagIds;
			}

			return textResult(
				await makeRequest("POST", `${base}/issues`, body, {
					"x-api-key": apiKey,
				}),
			);
		},
	);

	server.registerTool(
		"list_issues",
		{
			description: "List issues with optional filters. Pass apiKey in chat.",
			inputSchema: z.object({
				apiKey: apiKeyField,
				status: z
					.enum(["not_started", "in_progress", "done"])
					.optional()
					.describe("Filter by status"),
				priority: z
					.enum(["low", "medium", "high"])
					.optional()
					.describe("Filter by priority"),
				assignee: z
					.string()
					.optional()
					.describe("Filter by assignee email, name, or user id"),
				search: z
					.string()
					.optional()
					.describe("Search in title and description"),
				page: z.number().optional().describe("Page number (default: 1)"),
				limit: z
					.number()
					.optional()
					.describe("Items per page (default: 10, max: 100)"),
			}),
		},
		async (params) => {
			const apiKey = resolveKey(params.apiKey, fallbackKey);
			if (!apiKey) {
				return textResult({ error: "apiKey is required" }, true);
			}

			const searchParams = new URLSearchParams();
			if (params.status) searchParams.set("status", params.status);
			if (params.priority) searchParams.set("priority", params.priority);
			if (params.search) searchParams.set("search", params.search);
			if (params.page != null) searchParams.set("page", String(params.page));
			if (params.limit != null) searchParams.set("limit", String(params.limit));

			if (params.assignee) {
				const resolved = await resolveAssignee(base, apiKey, params.assignee);
				if ("error" in resolved) return textResult(resolved.error, true);
				searchParams.set("assigned_user_id", resolved.userId);
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
		"get_issue",
		{
			description: "Get one issue by ID. Pass apiKey in chat.",
			inputSchema: z.object({
				apiKey: apiKeyField,
				id: z.number().describe("Issue ID"),
			}),
		},
		async ({ id, apiKey: provided }) => {
			const apiKey = resolveKey(provided, fallbackKey);
			if (!apiKey) {
				return textResult({ error: "apiKey is required" }, true);
			}
			return textResult(
				await makeRequest("GET", `${base}/issues/${id}`, null, {
					"x-api-key": apiKey,
				}),
			);
		},
	);

	server.registerTool(
		"update_issue",
		{
			description: "Update an issue. Pass apiKey in chat.",
			inputSchema: z.object({
				apiKey: apiKeyField,
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
				assignee: z
					.string()
					.optional()
					.describe("Assignee email, name, or user id"),
				tag_names: z.array(z.string()).optional().describe("Tag names"),
			}),
		},
		async (params) => {
			const apiKey = resolveKey(params.apiKey, fallbackKey);
			if (!apiKey) {
				return textResult({ error: "apiKey is required" }, true);
			}

			const { id, assignee, tag_names, apiKey: _k, ...rest } = params;
			const body: Record<string, unknown> = { ...rest };

			if (assignee) {
				const resolved = await resolveAssignee(base, apiKey, assignee);
				if ("error" in resolved) return textResult(resolved.error, true);
				body.assigned_user_id = resolved.userId;
			}

			if (tag_names?.length) {
				const resolved = await resolveTagNames(base, tag_names, apiKey);
				if ("error" in resolved) return textResult(resolved.error, true);
				body.tag_ids = resolved.tagIds;
			}

			return textResult(
				await makeRequest("PUT", `${base}/issues/${id}`, body, {
					"x-api-key": apiKey,
				}),
			);
		},
	);

	server.registerTool(
		"delete_issue",
		{
			description: "Delete an issue by ID. Pass apiKey in chat.",
			inputSchema: z.object({
				apiKey: apiKeyField,
				id: z.number().describe("Issue ID"),
			}),
		},
		async ({ id, apiKey: provided }) => {
			const apiKey = resolveKey(provided, fallbackKey);
			if (!apiKey) {
				return textResult({ error: "apiKey is required" }, true);
			}
			return textResult(
				await makeRequest("DELETE", `${base}/issues/${id}`, null, {
					"x-api-key": apiKey,
				}),
			);
		},
	);

	server.registerTool(
		"list_users",
		{
			description: "List users for assignees. Pass apiKey in chat.",
			inputSchema: z.object({
				apiKey: apiKeyField,
			}),
		},
		async ({ apiKey: provided }) => {
			const apiKey = resolveKey(provided, fallbackKey);
			if (!apiKey) {
				return textResult({ error: "apiKey is required" }, true);
			}
			return textResult(
				await makeRequest("GET", `${base}/users`, null, {
					"x-api-key": apiKey,
				}),
			);
		},
	);

	server.registerTool(
		"list_tags",
		{
			description: "List tags. Pass apiKey in chat.",
			inputSchema: z.object({
				apiKey: apiKeyField,
			}),
		},
		async ({ apiKey: provided }) => {
			const apiKey = resolveKey(provided, fallbackKey);
			if (!apiKey) {
				return textResult({ error: "apiKey is required" }, true);
			}
			return textResult(
				await makeRequest("GET", `${base}/tags`, null, {
					"x-api-key": apiKey,
				}),
			);
		},
	);

	server.registerTool(
		"create_tag",
		{
			description: "Create a tag. Pass apiKey in chat.",
			inputSchema: z.object({
				apiKey: apiKeyField,
				name: z.string().describe("Tag name"),
				color: z.string().describe("Tag color hex, e.g. #ff0000"),
			}),
		},
		async ({ apiKey: provided, ...tagData }) => {
			const apiKey = resolveKey(provided, fallbackKey);
			if (!apiKey) {
				return textResult({ error: "apiKey is required" }, true);
			}
			return textResult(
				await makeRequest("POST", `${base}/tags`, tagData, {
					"x-api-key": apiKey,
				}),
			);
		},
	);

	server.registerTool(
		"health_status",
		{
			description: "Check Issue Tracker API health (no apiKey needed).",
			inputSchema: z.object({}),
		},
		async () =>
			textResult(await makeRequest("GET", `${base.replace(/\/api$/, "")}/health`)),
	);
}
