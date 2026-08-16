// MCP server entry point — Spec Librarian agent tools
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { searchSpecs, getSpecContext, submitMetadataProposal, listSources } from "./tools.js";

// ─── Configuration ───────────────────────────────────────────────────────────

const BACKEND_PORT = Number(process.env["SPEC_LIBRARY_PORT"]) || 3100;
const DATA_DIR = process.env["SPEC_LIBRARY_DATA_DIR"] || join(process.cwd(), "data");
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

/**
 * The backend and this MCP server are spawned as separate OS processes with
 * no shared memory, so the token an env var doesn't cover falls back to the
 * file the backend writes at startup (see backend/src/index.ts).
 */
function resolveMcpToken(): string {
  const fromEnv = process.env["SPEC_LIBRARY_MCP_TOKEN"];
  if (fromEnv) return fromEnv;
  try {
    return readFileSync(join(DATA_DIR, "mcp-token"), "utf-8").trim();
  } catch {
    return "";
  }
}

const client = { baseUrl: BACKEND_URL, token: resolveMcpToken() };

// ─── Server Setup ────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: "spec-library-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// ─── Tool Definitions ────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "list_sources",
      description:
        "List all registered repositories (sources) the Spec Library indexes. Returns each source's id, type (local/remote), path or URL, and last scan timestamp. Use this to discover what repositories are being tracked before searching.",
      inputSchema: {
        type: "object" as const,
        properties: {},
        required: [],
      },
    },
    {
      name: "search_specs",
      description:
        "Search for Kiro Specs across all indexed repositories. Returns matching specs with title, stage, progress, and metadata.",
      inputSchema: {
        type: "object" as const,
        properties: {
          query: {
            type: "string",
            description: "Search query (matched against title, content, owner, theme, tags, repository)",
          },
          filters: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["feature", "bugfix", "quick", "unknown"] },
              stage: { type: "string", enum: ["new", "scoped", "refined", "in-flight", "done"] },
              theme: { type: "string" },
              owner: { type: "string" },
              repository: { type: "string" },
            },
          },
          limit: {
            type: "number",
            description: "Max results (capped at 100)",
            default: 50,
          },
        },
        required: ["query"],
      },
    },
    {
      name: "get_spec_context",
      description:
        "Get full context for a specific Spec including its artifacts (requirements, design, tasks) and resolved metadata.",
      inputSchema: {
        type: "object" as const,
        properties: {
          specId: {
            type: "string",
            description: "The spec key or ID to retrieve",
          },
          revisionId: {
            type: "string",
            description: "Optional: specific archive revision to retrieve instead of current",
          },
        },
        required: ["specId"],
      },
    },
    {
      name: "submit_metadata_proposal",
      description:
        "Propose metadata changes for a Spec. Creates a pending proposal that requires human approval — does NOT modify metadata directly.",
      inputSchema: {
        type: "object" as const,
        properties: {
          specId: {
            type: "string",
            description: "The spec key to propose changes for",
          },
          baseRevision: {
            type: "number",
            description: "The current metadata revision number (for conflict detection)",
          },
          metadataPatch: {
            type: "object",
            description: "Metadata fields to change (title, summary, owner, theme, tags, targetRelease, retentionPolicy)",
          },
          relationshipAdds: {
            type: "array",
            items: {
              type: "object",
              properties: {
                targetSpecId: { type: "string" },
                type: { type: "string", enum: ["depends_on", "blocks", "supersedes", "duplicates", "related"] },
                note: { type: "string" },
              },
              required: ["targetSpecId", "type"],
            },
            description: "Optional relationships to propose",
          },
          rationale: {
            type: "string",
            description: "Explanation of why these changes are proposed",
          },
        },
        required: ["specId", "baseRevision", "metadataPatch", "rationale"],
      },
    },
  ],
}));

// ─── Tool Execution ──────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case "list_sources":
        result = await listSources(client);
        break;
      case "search_specs":
        result = await searchSpecs(client, args as unknown as Parameters<typeof searchSpecs>[1]);
        break;
      case "get_spec_context":
        result = await getSpecContext(client, args as unknown as Parameters<typeof getSpecContext>[1]);
        break;
      case "submit_metadata_proposal":
        result = await submitMetadataProposal(client, args as unknown as Parameters<typeof submitMetadataProposal>[1]);
        break;
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [{ type: "text", text: result }],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[mcp] Spec Library MCP server running on stdio");
}

main().catch((err) => {
  console.error("[mcp] Fatal error:", err);
  process.exit(1);
});
