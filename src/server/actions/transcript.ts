"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";

export async function saveConversation(
  title: string,
  language: string,
  messages: { role: string; content: string }[]
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (messages.length === 0) return null;

  let finalMessages = messages;

  // Transliterate to English format if the language is not English
  if (language && !language.toLowerCase().includes("english")) {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey, vertexai: false });
        
        const prompt = `You are a strict JSON data converter. Your only job is to transliterate the 'content' field of the following JSON array of messages into Romanized English characters (e.g., 'नमस्ते' becomes 'namaste', 'مرحبا' becomes 'merhaba').
Keep the exact same JSON structure and the same language meaning, just write it in English alphabet (Romanization). Do not translate the meaning to English words, just transliterate the pronunciation to English characters.
Input Language: ${language}
Input JSON:
${JSON.stringify(messages)}

Output ONLY valid JSON.`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const text = response.text;
        if (text) {
          finalMessages = JSON.parse(text);
        }
      }
    } catch (e) {
      console.error("Failed to transliterate messages:", e);
      // Fallback to original messages if transliteration fails
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      userId: session.user.id,
      title: title || "New Conversation",
      language: language || "English",
      messages: {
        create: finalMessages.map((m) => ({
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