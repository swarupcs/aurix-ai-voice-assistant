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
      orderBy: { id: "asc" },
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
    revalidatePath("/admin");
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
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete user:", error);
    return { success: false, error: "Failed to delete user." };
  }
}
