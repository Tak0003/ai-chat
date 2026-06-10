import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getConversationsCollection } from "@/lib/mongodb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return Response.json({ error: "無効な会話 ID です" }, { status: 400 });
  }

  const conversations = await getConversationsCollection();
  const conv = await conversations.findOne({ _id: new ObjectId(id) });

  if (!conv) {
    return Response.json({ error: "会話が見つかりません" }, { status: 404 });
  }

  return Response.json({ ...conv, _id: conv._id!.toString() });
}
