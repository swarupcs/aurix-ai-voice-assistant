"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { FeedbackType } from "@prisma/client";

export async function submitFeedback(data: { type: FeedbackType; message: string }) {
  const session = await auth();
  
  // We can allow anonymous feedback if we want, but since they are logged in it's better to attach user ID.
  // If not logged in, userId is null.
  const userId = session?.user?.id || null;

  try {
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        type: data.type,
        message: data.message,
      },
    });

    return { success: true, feedback };
  } catch (e) {
    console.error('Failed to submit feedback:', e);
    return { success: false, error: 'Failed to submit feedback' };
  }
}

export async function getFeedbackList() {
  const session = await auth();
  // Simple admin check based on role, assuming role exists in session or db
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    const feedbackList = await prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    });

    return feedbackList;
  } catch (e) {
    console.error('Failed to fetch feedback:', e);
    return [];
  }
}

export async function updateFeedbackStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    const updated = await prisma.feedback.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/feedback");
    return { success: true, feedback: updated };
  } catch (e) {
    console.error('Failed to update feedback status:', e);
    return { success: false, error: 'Failed to update feedback status' };
  }
}
