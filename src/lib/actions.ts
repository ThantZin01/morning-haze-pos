"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { login, logout, requireRole, requireUser } from "./auth";
import { prisma } from "./prisma";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function loginAction(formData: FormData) {
  const result = await login(value(formData, "username"), value(formData, "password"));
  if (!result.ok) redirect("/login?error=1");
  redirect(result.roleName === "ADMIN" ? "/admin" : "/cashier");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireUser();
  await prisma.user.update({
    where: { userId: user.userId },
    data: {
      fullName: value(formData, "fullName"),
      email: value(formData, "email")
    }
  });
  revalidatePath("/profile");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const currentPassword = value(formData, "currentPassword");
  const newPassword = value(formData, "newPassword");
  const record = await prisma.user.findUniqueOrThrow({ where: { userId: user.userId } });
  if (!(await bcrypt.compare(currentPassword, record.passwordHash))) {
    throw new Error("Current password is incorrect.");
  }
  await prisma.user.update({
    where: { userId: user.userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) }
  });
}

export async function saveUserAction(formData: FormData) {
  await requireRole("ADMIN");
  const id = Number(value(formData, "userId") || 0);
  const role = await prisma.role.findUniqueOrThrow({ where: { roleName: value(formData, "roleName") } });
  const data = {
    fullName: value(formData, "fullName"),
    username: value(formData, "username"),
    email: value(formData, "email"),
    roleId: role.roleId,
    status: value(formData, "status") || "ACTIVE"
  };
  z.object({ fullName: z.string().min(1), username: z.string().min(1), email: z.string().email() }).parse(data);

  if (id) {
    await prisma.user.update({ where: { userId: id }, data });
  } else {
    await prisma.user.create({
      data: {
        ...data,
        passwordHash: await bcrypt.hash(value(formData, "password") || "Password@123", 12)
      }
    });
  }
  revalidatePath("/admin/users");
}

export async function toggleUserAction(formData: FormData) {
  await requireRole("ADMIN");
  await prisma.user.update({
    where: { userId: Number(value(formData, "userId")) },
    data: { status: value(formData, "status") === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
  });
  revalidatePath("/admin/users");
}

export async function deleteUserAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const userId = Number(value(formData, "userId"));

  if (userId === admin.userId) {
    throw new Error("You cannot delete your own account.");
  }

  const user = await prisma.user.findUnique({
    where: { userId },
    include: {
      _count: {
        select: {
          orders: true,
          createdCategories: true,
          updatedCategories: true,
          createdMenuItems: true,
          updatedMenuItems: true,
          lastUpdatedInventories: true
        }
      }
    }
  });

  if (!user) {
    throw new Error("User account not found.");
  }

  const linkedRecordCount =
    user._count.orders +
    user._count.createdCategories +
    user._count.updatedCategories +
    user._count.createdMenuItems +
    user._count.updatedMenuItems +
    user._count.lastUpdatedInventories;

  if (linkedRecordCount > 0) {
    throw new Error("This account has system records. Deactivate it instead of deleting it.");
  }

  await prisma.user.delete({ where: { userId } });
  revalidatePath("/admin/users");
}

export async function saveCategoryAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const id = Number(value(formData, "categoryId") || 0);
  const data = {
    categoryName: value(formData, "categoryName"),
    description: value(formData, "description"),
    status: value(formData, "status") || "ACTIVE",
    updatedByAdminId: admin.userId
  };
  if (id) {
    await prisma.category.update({ where: { categoryId: id }, data });
  } else {
    await prisma.category.create({ data: { ...data, createdByAdminId: admin.userId } });
  }
  revalidatePath("/admin/categories");
}

export async function saveMenuItemAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const id = Number(value(formData, "menuItemId") || 0);
  const data = {
    categoryId: Number(value(formData, "categoryId")),
    itemName: value(formData, "itemName"),
    description: value(formData, "description"),
    price: Number(value(formData, "price")),
    imageUrl: value(formData, "imageUrl"),
    isAvailable: value(formData, "isAvailable") === "on",
    updatedByAdminId: admin.userId
  };
  if (id) {
    await prisma.menuItem.update({ where: { menuItemId: id }, data });
  } else {
    await prisma.menuItem.create({ data: { ...data, createdByAdminId: admin.userId } });
  }
  revalidatePath("/admin/menu-items");
  revalidatePath("/cashier");
}

export async function deleteMenuItemAction(formData: FormData) {
  await requireRole("ADMIN");
  const menuItemId = Number(value(formData, "menuItemId"));

  await prisma.$transaction(async (tx) => {
    const menuItem = await tx.menuItem.findUnique({
      where: { menuItemId },
      include: {
        inventory: true,
        _count: { select: { orderItems: true } }
      }
    });

    if (!menuItem) {
      throw new Error("Menu item not found.");
    }

    if (menuItem.inventory && menuItem.inventory.stockQuantity !== 0) {
      throw new Error("Only menu items with zero inventory quantity can be deleted.");
    }

    if (menuItem.inventory) {
      await tx.inventory.delete({ where: { menuItemId } });
    }

    if (menuItem._count.orderItems > 100) {
      await tx.menuItem.update({
        where: { menuItemId },
        data: { isAvailable: false }
      });
    } else {
      await tx.orderItem.deleteMany({ where: { menuItemId } });
      await tx.menuItem.delete({ where: { menuItemId } });
    }
  });

  revalidatePath("/admin/menu-items");
  revalidatePath("/admin/inventory");
  revalidatePath("/cashier");
}

export async function saveInventoryAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const stockQuantity = Number(value(formData, "stockQuantity"));
  if (stockQuantity < 0) throw new Error("Stock quantity cannot be negative.");
  await prisma.inventory.upsert({
    where: { menuItemId: Number(value(formData, "menuItemId")) },
    update: {
      stockQuantity,
      reorderLevel: Number(value(formData, "reorderLevel")),
      unit: value(formData, "unit"),
      lastUpdatedByAdminId: admin.userId
    },
    create: {
      menuItemId: Number(value(formData, "menuItemId")),
      stockQuantity,
      reorderLevel: Number(value(formData, "reorderLevel")),
      unit: value(formData, "unit"),
      lastUpdatedByAdminId: admin.userId
    }
  });
  revalidatePath("/admin/inventory");
}

export async function createOrderAction(formData: FormData) {
  const cashier = await requireRole("CASHIER");
  const itemIds = formData.getAll("menuItemId").map(Number);
  const quantities = formData.getAll("quantity").map((item) => Number(item));
  const paymentMethod = value(formData, "paymentMethod");

  const requested = itemIds
    .map((menuItemId, index) => ({ menuItemId, quantity: quantities[index] || 0 }))
    .filter((entry) => entry.quantity > 0);

  if (!requested.length) throw new Error("Add at least one item to the cart.");

  const result = await prisma.$transaction(async (tx) => {
    const menuItems = await tx.menuItem.findMany({
      where: { menuItemId: { in: requested.map((entry) => entry.menuItemId) } },
      include: { inventory: true }
    });

    let totalAmount = 0;
    const orderItems = requested.map((entry) => {
      const item = menuItems.find((menuItem) => menuItem.menuItemId === entry.menuItemId);
      if (!item || !item.isAvailable) throw new Error("Unavailable menu items cannot be added.");
      if (item.inventory && item.inventory.stockQuantity < entry.quantity) throw new Error(`${item.itemName} has insufficient stock.`);
      const unitPrice = Number(item.price);
      const subTotal = unitPrice * entry.quantity;
      totalAmount += subTotal;
      return { menuItemId: entry.menuItemId, quantity: entry.quantity, unitPrice, subTotal };
    });

    const order = await tx.order.create({
      data: {
        cashierId: cashier.userId,
        totalAmount,
        orderStatus: "Payment Pending",
        orderItems: { create: orderItems }
      }
    });

    const payment = await tx.payment.create({
      data: {
        orderId: order.orderId,
        paymentMethod,
        amountPaid: totalAmount,
        changeAmount: 0,
        paymentStatus: "Paid"
      }
    });

    for (const item of orderItems) {
      await tx.inventory.updateMany({
        where: { menuItemId: item.menuItemId },
        data: { stockQuantity: { decrement: item.quantity } }
      });
    }

    const receipt = await tx.receipt.create({
      data: {
        orderId: order.orderId,
        paymentId: payment.paymentId,
        receiptNumber: `MHC-${Date.now()}-${order.orderId}`,
        totalAmount,
        printedStatus: false
      }
    });

    await tx.order.update({
      where: { orderId: order.orderId },
      data: { orderStatus: "Completed" }
    });

    return receipt;
  });

  revalidatePath("/cashier");
  redirect(`/cashier/orders?receipt=${result.receiptId}`);
}

export async function markReceiptPrintedAction(formData: FormData) {
  await requireRole("CASHIER");
  await prisma.receipt.update({
    where: { receiptId: Number(value(formData, "receiptId")) },
    data: { printedStatus: true }
  });
  revalidatePath("/cashier/orders");
}
