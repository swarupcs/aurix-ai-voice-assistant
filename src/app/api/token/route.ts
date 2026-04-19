import { AuthToken, GoogleGenAI } from "@google/genai";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing Gemini API key");
    return Response.json({ error: "Missing API Key" }, { status: 500 });
  }

  const geminiClient = new GoogleGenAI({
    apiKey,
    vertexai: false,
  });

  const expireTime = new Date(
    Date.now() + 30 * 60 * 1000,
  ).toISOString();

  const token: AuthToken =
    await geminiClient.authTokens.create({
      config: {
        uses: 1, // The default
        expireTime: expireTime, // Default is 30 mins
        newSessionExpireTime: new Date(
          Date.now() + 1 * 60 * 1000,
        ).toISOString(), // Default 1 minute in the future
        httpOptions: { apiVersion: "v1alpha" },
      },
    });

  return Response.json({ token });
}
