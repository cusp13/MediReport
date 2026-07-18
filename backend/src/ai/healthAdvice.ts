import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool
} from "openai/resources/chat/completions.js";
import { getClient, MODEL } from "./client.js";
import { formatContextForPrompt, type RagContext } from "./ragContext.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MCP_SERVER_PATH = join(__dirname, "../mcp/server.ts");

export interface DailyAdvicePayload {
  recoveryAssessment: string;
  dietPlan: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snacks: string;
    avoid: string[];
  };
  hydrationTarget: string;
  exerciseAdvice: string;
  warningFlags: string[];
  tomorrowGoal: string;
}

const ADVICE_JSON_SCHEMA = {
  type: "object",
  properties: {
    recoveryAssessment: { type: "string" },
    dietPlan: {
      type: "object",
      properties: {
        breakfast: { type: "string" },
        lunch: { type: "string" },
        dinner: { type: "string" },
        snacks: { type: "string" },
        avoid: { type: "array", items: { type: "string" } }
      },
      required: ["breakfast", "lunch", "dinner", "snacks", "avoid"],
      additionalProperties: false
    },
    hydrationTarget: { type: "string" },
    exerciseAdvice: { type: "string" },
    warningFlags: { type: "array", items: { type: "string" } },
    tomorrowGoal: { type: "string" }
  },
  required: [
    "recoveryAssessment",
    "dietPlan",
    "hydrationTarget",
    "exerciseAdvice",
    "warningFlags",
    "tomorrowGoal"
  ],
  additionalProperties: false
} as const;

function buildSystemPrompt(
  conditionName: string,
  stage: string,
  dayNumber: number,
  userProfile: string,
  ragContext: string
): string {
  return `You are a compassionate medical AI assistant helping a patient recover from ${conditionName} (stage: ${stage}, day ${dayNumber}).

PATIENT PROFILE:
${userProfile}

CONTEXT FROM HEALTH HISTORY AND MEDICAL GUIDELINES:
${ragContext || "No prior history available — this is the first check-in."}

Your job: analyse today's health log, call the available tools for more data if needed, then respond with a personalised daily advice plan in JSON format.

Rules:
- Be specific and actionable, not generic.
- If fever > 39°C or concerning symptoms, flag as warnings.
- Tailor diet to the condition stage and patient's dietary preference.
- Only recommend exercise appropriate to energy level.
- Keep advice encouraging and warm in tone.`;
}

function mcpToolToOpenAi(tool: {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}): ChatCompletionTool {
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description ?? "",
      parameters: tool.inputSchema as Record<string, unknown>
    }
  };
}

async function parseAdviceFromContent(content: string, messages: ChatCompletionMessageParam[]): Promise<DailyAdvicePayload> {
  try {
    return JSON.parse(content) as DailyAdvicePayload;
  } catch {
    const fallbackMessages: ChatCompletionMessageParam[] = [
      ...messages,
      { role: "assistant", content },
      { role: "user", content: "Return your advice now as valid JSON matching the required schema." }
    ];
    const jsonResponse = await getClient().chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      messages: fallbackMessages,
      response_format: {
        type: "json_schema",
        json_schema: { name: "daily_advice", strict: true, schema: ADVICE_JSON_SCHEMA }
      }
    });
    return JSON.parse(jsonResponse.choices[0]?.message.content ?? "{}") as DailyAdvicePayload;
  }
}

export async function generateAdvice(opts: {
  userId: string;
  conditionId: string;
  conditionName: string;
  stage: string;
  dayNumber: number;
  todayLogText: string;
  userProfile: string;
  ragCtx: RagContext;
}): Promise<DailyAdvicePayload> {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["tsx", MCP_SERVER_PATH],
    env: { ...process.env } as Record<string, string>,
    stderr: "pipe"
  });

  const mcpClient = new Client({ name: "medireport-advisor", version: "1.0.0" });
  await mcpClient.connect(transport);

  try {
    const { tools: mcpTools } = await mcpClient.listTools();
    const openAiTools: ChatCompletionTool[] = mcpTools.map((t) =>
      mcpToolToOpenAi({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema as Record<string, unknown>
      })
    );

    const systemPrompt = buildSystemPrompt(
      opts.conditionName,
      opts.stage,
      opts.dayNumber,
      opts.userProfile,
      formatContextForPrompt(opts.ragCtx)
    );

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Today's log: ${opts.todayLogText}\n\nUse tools as needed, then return your advice as JSON matching the required schema.`
      }
    ];

    for (let round = 0; round < 5; round++) {
      const response = await getClient().chat.completions.create({
        model: MODEL,
        temperature: 0.3,
        messages,
        tools: openAiTools
      });

      const choice = response.choices[0];
      if (!choice) throw new Error("Empty response from model");

      const { message } = choice;

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return parseAdviceFromContent(message.content ?? "", messages);
      }

      // Append assistant turn (with tool_calls) to history
      messages.push({
        role: "assistant",
        content: message.content ?? null,
        tool_calls: message.tool_calls
      });

      // Execute each tool call via MCP and append results
      for (const toolCall of message.tool_calls) {
        const toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;

        // Auto-inject ids for recovery trend tool
        if (toolCall.function.name === "get_recovery_trend") {
          toolArgs.userId ??= opts.userId;
          toolArgs.conditionId ??= opts.conditionId;
        }

        const toolResult = await mcpClient.callTool({
          name: toolCall.function.name,
          arguments: toolArgs
        });

        const firstBlock = Array.isArray(toolResult.content) ? toolResult.content[0] : null;
        const resultText =
          firstBlock && typeof firstBlock === "object" && "text" in firstBlock
            ? String(firstBlock.text)
            : JSON.stringify(toolResult.content);

        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: resultText
        });
      }
    }

    throw new Error("Max tool call rounds exceeded without final answer");
  } finally {
    await mcpClient.close();
  }
}
