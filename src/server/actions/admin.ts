"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function getAdminStats() {
  await checkAdmin();
  try {
    const [totalUsers, totalConversations, totalMessages] = await Promise.all([
      prisma.user.count(),
      prisma.conversation.count(),
      prisma.message.count(),
    ]);

    // Calculate active users (users who had a conversation in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await prisma.user.count({
      where: {
        conversations: {
          some: {
            updatedAt: {
              gte: sevenDaysAgo
            }
          }
        }
      }
    });

    return {
      totalUsers,
      totalConversations,
      totalMessages,
      activeUsers
    };
  } catch (error) {
    console.error("Failed to fetch admin stats:", error);
    throw new Error("Failed to fetch admin stats.");
  }
}

export async function getRecentUsers(limit = 5) {
  await checkAdmin();
  try {
    return await prisma.user.findMany({
      take: limit,
      orderBy: { id: "desc" },
      include: {
        _count: {
          select: { conversations: true }
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch recent users:", error);
    throw new Error("Failed to fetch recent users.");
  }
}

export async function getUsers() {
  await checkAdmin();
  try {
    const users = await prisma.user.findMany({
      include: {
        preferences: true,
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: { id: "desc" },
    });
    return users;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw new Error("Failed to fetch users.");
  }
}

export async function updateUserRole(userId: string, newRole: Role) {
  await checkAdmin();
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to update user role:", error);
    return { success: false, error: "Failed to update user role." };
  }
}

export async function deleteUser(userId: string) {
  await checkAdmin();
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Failed to delete user." };
  }
}

export async function getAllConversations() {
  await checkAdmin();
  try {
    return await prisma.conversation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true, image: true }
        },
        _count: {
          select: { messages: true }
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    throw new Error("Failed to fetch conversations.");
  }
}

export async function getAdminConversationById(conversationId: string) {
  await checkAdmin();
  try {
    return await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        user: {
          select: { name: true, email: true, image: true, role: true }
        },
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
  } catch (error) {
    console.error("Failed to fetch conversation details:", error);
    throw new Error("Failed to fetch conversation details.");
  }
}

