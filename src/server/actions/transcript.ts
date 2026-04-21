"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function saveConversation(title: string, messages: { role: string; content: string }[]) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (messages.length === 0) return null;

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      title: title || "New Conversation",
      messages: {
        create: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
    },
  });

  return conversation;
}

export async function getConversations() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { messages: true },
  });
}