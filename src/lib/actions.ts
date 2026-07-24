"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { put } from "@vercel/blob";
import { z } from "zod";
import { login, logout, requireRole, requireUser } from "./auth";
import { prisma } from "./prisma";

function value(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

async function uploadImageToBlob(formData: FormData) {
  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return undefined;
  }

  const storeId = process.env.BLOB_STORE_ID;
  if (!storeId) {
    throw new Error("Vercel Blob store ID is not configured. Set BLOB_STORE_ID in your environment.");
  }

  const safeName = image.name
    ? image.name.replace(/[^a-zA-Z0-9_.-]/g, "-").replace(/^-+|-+$/g, "")
    : "menu-image.jpg";
  const fileName = `menu-items/${Date.now()}-${safeName}`;
  const blob = await put(fileName, image, {
    access: "public",
    storeId,
    addRandomSuffix: true,
    contentType: image.type || undefined
  });
  return blob.url;
}

async function getUploadedImageUrl(formData: FormData) {
  const blobUrl = await uploadImageToBlob(formData);
  if (blobUrl) {
    return blobUrl;
  }
  const imageUrl = value(formData, "imageUrl");
  return imageUrl || undefined;
}

async function repairSerialSequence(tableName: string, primaryKeyColumn: string) {
  const escapedTableName = tableName.replace(/"/g, '""');
  const escapedPrimaryKeyColumn = primaryKeyColumn.replace(/"/g, '""');
  const qualifiedTableName = `public."${escapedTableName}"`;
  const quotedPrimaryKeyColumn = `"${escapedPrimaryKeyColumn}"`;

  await prisma.$executeRawUnsafe(
    `SELECT setval(
      pg_get_serial_sequence('${qualifiedTableName}', '${escapedPrimaryKeyColumn}'),
      COALESCE((SELECT MAX(${quotedPrimaryKeyColumn}) FROM ${qualifiedTableName}), 0) + 1,
      false
    )`
  );
}

const userSchema = z.object({
  fullName: z.string().min(1),
  username: z.string().min(1),
  email: z.string().email(),
  roleId: z.number().int().positive(),
  status: z.enum(["ACTIVE", "INACTIVE"])
});

const menuItemSchema = z.object({
  categoryId: z.number().int().positive(),
  itemName: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  imageUrl: z.string().optional(),
  isAvailable: z.boolean(),
  updatedByAdminId: z.number().int().positive()
});

const inventorySchema = z.object({
  menuItemId: z.number().int().positive(),
  stockQuantity: z.number().int().min(0),
  reorderLevel: z.number().int().min(0),
  unit: z.string().min(1),
  lastUpdatedByAdminId: z.number().int().positive()
});

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
    status: (value(formData, "status") || "ACTIVE") as "ACTIVE" | "INACTIVE"
  };
  userSchema.parse(data);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }]
    }
  });

  if (existingUser && existingUser.userId !== id) {
    if (existingUser.username === data.username && existingUser.email === data.email) {
      throw new Error("A user with this username and email already exists.");
    }
    if (existingUser.username === data.username) {
      throw new Error("A user with this username already exists. Choose a different username.");
    }
    throw new Error("A user with this email already exists. Use a different email address.");
  }

  try {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(", ") : "";
      if (target.includes("username")) {
        throw new Error("A user with this username already exists. Choose a different username.");
      }
      if (target.includes("email")) {
        throw new Error("A user with this email already exists. Use a different email address.");
      }
      throw new Error("A user with this username or email already exists.");
    }
    throw error;
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
    try {
      await prisma.category.create({ data: { ...data, createdByAdminId: admin.userId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("categoryId")
      ) {
        await repairSerialSequence("Categories", "categoryId");
        await prisma.category.create({ data: { ...data, createdByAdminId: admin.userId } });
      } else {
        throw error;
      }
    }
  }

  revalidatePath("/admin/categories");
}

export async function saveMenuItemAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const id = Number(value(formData, "menuItemId") || 0);
  const rawImageUrl = value(formData, "imageUrl");

  let imageUrl = await getUploadedImageUrl(formData);
  let existingItem = null;
  if (id) {
    existingItem = await prisma.menuItem.findUnique({ where: { menuItemId: id } });
    if (existingItem && !imageUrl && rawImageUrl === "") {
      imageUrl = existingItem.imageUrl ?? undefined;
    }
  }

  const data = {
    categoryId: Number(value(formData, "categoryId")),
    itemName: value(formData, "itemName"),
    description: value(formData, "description"),
    price: Number(value(formData, "price")),
    imageUrl: imageUrl || rawImageUrl || undefined,
    isAvailable: value(formData, "isAvailable") === "on",
    updatedByAdminId: admin.userId
  };
  menuItemSchema.parse(data);

  if (id) {
    await prisma.menuItem.update({ where: { menuItemId: id }, data });
  } else {
    try {
      await prisma.menuItem.create({ data: { ...data, createdByAdminId: admin.userId } });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002" &&
        Array.isArray(error.meta?.target) &&
        error.meta.target.includes("menuItemId")
      ) {
        await repairSerialSequence("MenuItems", "menuItemId");
        await prisma.menuItem.create({ data: { ...data, createdByAdminId: admin.userId } });
      } else {
        throw error;
      }
    }
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
  const data = {
    menuItemId: Number(value(formData, "menuItemId")),
    stockQuantity: Number(value(formData, "stockQuantity")),
    reorderLevel: Number(value(formData, "reorderLevel")),
    unit: value(formData, "unit"),
    lastUpdatedByAdminId: admin.userId
  };
  inventorySchema.parse(data);

  const existingInventory = await prisma.inventory.findUnique({ where: { menuItemId: data.menuItemId } });

  if (existingInventory) {
    await prisma.inventory.update({
      where: { menuItemId: data.menuItemId },
      data: {
        stockQuantity: { increment: data.stockQuantity },
        reorderLevel: data.reorderLevel,
        unit: data.unit,
        lastUpdatedByAdminId: admin.userId
      }
    });
  } else {
    await prisma.inventory.create({
      data: {
        menuItemId: data.menuItemId,
        stockQuantity: data.stockQuantity,
        reorderLevel: data.reorderLevel,
        unit: data.unit,
        lastUpdatedByAdminId: admin.userId
      }
    });
  }
  revalidatePath("/admin/inventory");
}

export async function createOrderAction(formData: FormData) {
  const cashier = await requireRole("CASHIER");
  const itemIds = formData.getAll("menuItemId").map(Number);
  const quantities = formData.getAll("quantity").map((item) => Number(item));
  const paymentMethod = value(formData, "paymentMethod");

  if (!["Cash", "Card", "Mobile Pay"].includes(paymentMethod)) {
    throw new Error("Invalid payment method.");
  }

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
