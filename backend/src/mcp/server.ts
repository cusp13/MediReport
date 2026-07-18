#!/usr/bin/env node
/**
 * Health Recovery MCP Server (stdio transport).
 *
 * Exposes three tools to the LLM:
 *   - get_recovery_trend
 *   - get_nutrition_info
 *   - get_condition_stage_guidelines
 *
 * Started as a subprocess by healthAdvice.ts when generating daily advice.
 * Requires MONGODB_URI env var to access DailyHealthLog data.
 */
import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { connectDb } from "../db.js";
import { recoveryTrendSchema, getRecoveryTrend } from "./tools/recoveryTrend.js";
import { nutritionInfoSchema, getNutritionInfo } from "./tools/nutritionInfo.js";
import { conditionGuidelinesSchema, getConditionGuidelines } from "./tools/conditionGuidelines.js";

await connectDb();

const server = new Server(
  { name: "health-recovery", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [recoveryTrendSchema, nutritionInfoSchema, conditionGuidelinesSchema]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    if (name === recoveryTrendSchema.name) {
      result = await getRecoveryTrend(args as Parameters<typeof getRecoveryTrend>[0]);
    } else if (name === nutritionInfoSchema.name) {
      result = getNutritionInfo(args as Parameters<typeof getNutritionInfo>[0]);
    } else if (name === conditionGuidelinesSchema.name) {
      result = getConditionGuidelines(args as Parameters<typeof getConditionGuidelines>[0]);
    } else {
      return {
        isError: true,
        content: [{ type: "text" as const, text: `Unknown tool: ${name}` }]
      };
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }]
    };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Tool error: ${String(err)}` }]
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
