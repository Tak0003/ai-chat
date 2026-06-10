import Anthropic from "@anthropic-ai/sdk";

export const MODEL_NAME = "claude-sonnet-4-6";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export default anthropic;
