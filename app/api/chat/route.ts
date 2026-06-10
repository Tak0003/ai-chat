import { NextRequest } from "next/server";
import { z } from "zod";
import { ObjectId } from "mongodb";
import anthropic, { MODEL_NAME } from "@/lib/anthropic";
import { getConversationsCollection } from "@/lib/mongodb";
import type { Message, ContentBlock, SseEvent } from "@/types/chat";

export const dynamic = "force-dynamic";

const chatRequestSchema = z.object({
  conversationId: z.string().nullable(),
  message: z.string().min(1, "メッセージを入力してください"),
  images: z.array(z.string()).optional().default([]),
  useRag: z.boolean().optional().default(false),
});

function encodeSse(event: SseEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = async (event: SseEvent) => {
    await writer.write(encoder.encode(encodeSse(event)));
  };

  (async () => {
    try {
      const body = await req.json();
      const parsed = chatRequestSchema.safeParse(body);

      if (!parsed.success) {
        await send({ type: "error", message: "リクエストの形式が正しくありません" });
        await writer.close();
        return;
      }

      const { conversationId, message, images } = parsed.data;
      const conversations = await getConversationsCollection();

      // 既存会話の取得 or 新規作成
      let existingMessages: Message[] = [];
      let resolvedConversationId = conversationId;

      if (conversationId) {
        const conv = await conversations.findOne({ _id: new ObjectId(conversationId) });
        if (conv) {
          existingMessages = conv.messages;
        }
      }

      // ユーザーメッセージの組み立て
      const userContent: ContentBlock[] = [];

      if (images && images.length > 0) {
        for (const imageData of images) {
          const [header, data] = imageData.split(",");
          const mediaType = header.match(/:(.*?);/)?.[1] as
            | "image/jpeg"
            | "image/png"
            | "image/gif"
            | "image/webp";
          userContent.push({ type: "image", source: { type: "base64", media_type: mediaType, data } });
        }
      }
      userContent.push({ type: "text", text: message });

      const userMessage: Message = {
        role: "user",
        content: userContent.length === 1 && userContent[0].type === "text"
          ? message
          : userContent,
        timestamp: new Date(),
      };

      // Anthropic API 用メッセージ配列を組み立て
      const apiMessages = [
        ...existingMessages.map((m) => ({
          role: m.role,
          content: m.content as string | ContentBlock[],
        })),
        { role: "user" as const, content: userMessage.content as string | ContentBlock[] },
      ];

      // ストリーミング開始
      let assistantText = "";

      const claudeStream = await anthropic.messages.stream({
        model: MODEL_NAME,
        max_tokens: 4096,
        system: "あなたは学習・教育支援を行うAIアシスタントです。丁寧でわかりやすい日本語で回答してください。",
        messages: apiMessages,
      });

      for await (const chunk of claudeStream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          assistantText += chunk.delta.text;
          await send({ type: "delta", text: chunk.delta.text });
        }
      }

      // 会話を MongoDB に保存
      const assistantMessage: Message = {
        role: "assistant",
        content: assistantText,
        timestamp: new Date(),
      };

      if (resolvedConversationId) {
        await conversations.updateOne(
          { _id: new ObjectId(resolvedConversationId) },
          {
            $push: { messages: { $each: [userMessage, assistantMessage] } },
            $set: { updatedAt: new Date() },
          }
        );
      } else {
        // タイトルはユーザーの最初のメッセージ先頭 30 文字
        const title = message.slice(0, 30) + (message.length > 30 ? "…" : "");
        const result = await conversations.insertOne({
          title,
          messages: [userMessage, assistantMessage],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        resolvedConversationId = result.insertedId.toString();
      }

      await send({ type: "done", conversationId: resolvedConversationId! });
    } catch (err) {
      console.error("チャット API エラー:", err);
      await send({ type: "error", message: "サーバーエラーが発生しました。しばらく経ってから再試行してください。" });
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function GET() {
  const conversations = await getConversationsCollection();
  const list = await conversations
    .find({}, { projection: { messages: 0 } })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  return Response.json(
    list.map((c) => ({ ...c, _id: c._id!.toString() }))
  );
}
