"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUserPreferences() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const preferences = await prisma.userPreferences.findUnique({
    where: { userId: session.user.id },
  });

  return preferences;
}

export async function updateUserPreferences(data: {
  languageRegion?: string;
  languageName?: string;
  topic?: string;
  voice?: string;
  proficiencyLevel?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const preferences = await prisma.userPreferences.upsert({
    where: { userId: session.user.id },
    update: data,
    create: {
      userId: session.user.id,
      ...data,
    },
  });

  revalidatePath("/dashboard");
  return preferences;
}