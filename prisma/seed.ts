import { PrismaClient, type MenuItem } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const shouldReset = process.argv.includes("--reset");

async function clearDatabase() {
  await prisma.$transaction([
    prisma.receipt.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.order.deleteMany(),
    prisma.inventory.deleteMany(),
    prisma.menuItem.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
    prisma.role.deleteMany()
  ]);
}

async function upsertUser(data: {
  roleId: number;
  fullName: string;
  username: string;
  email: string;
  password: string;
  status?: string;
}) {
  return prisma.user.upsert({
    where: { username: data.username },
    update: {
      roleId: data.roleId,
      fullName: data.fullName,
      email: data.email,
      status: data.status ?? "ACTIVE"
    },
    create: {
      roleId: data.roleId,
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 12),
      status: data.status ?? "ACTIVE"
    }
  });
}

async function main() {
  if (shouldReset) {
    await clearDatabase();
    console.log("Existing POS data cleared.");
  }

  const [adminRole, cashierRole] = await Promise.all([
    prisma.role.upsert({
      where: { roleName: "ADMIN" },
      update: { description: "Administrator role for system management" },
      create: { roleName: "ADMIN", description: "Administrator role for system management" }
    }),
    prisma.role.upsert({
      where: { roleName: "CASHIER" },
      update: { description: "Cashier role for POS transactions" },
      create: { roleName: "CASHIER", description: "Cashier role for POS transactions" }
    })
  ]);

  const admin = await upsertUser({
    roleId: adminRole.roleId,
    fullName: "Default Administrator",
    username: "admin",
    email: "admin@morninghaze.local",
    password: "Admin@123"
  });

  const cashier = await upsertUser({
    roleId: cashierRole.roleId,
    fullName: "Default Cashier",
    username: "cashier",
    email: "cashier@morninghaze.local",
    password: "Cashier@123"
  });

  await upsertUser({
    roleId: cashierRole.roleId,
    fullName: "Morning Shift Cashier",
    username: "cashier2",
    email: "cashier2@morninghaze.local",
    password: "Cashier@123"
  });

  const categoryData = [
    { categoryId: 1, categoryName: "Coffee", description: "Espresso, latte, cappuccino, and brewed coffee" },
    { categoryId: 2, categoryName: "Tea", description: "Hot and iced tea selections" },
    { categoryId: 3, categoryName: "Bakery", description: "Fresh pastries and cafe snacks" },
    { categoryId: 4, categoryName: "Cold Drinks", description: "Iced coffee, soda, and chilled cafe drinks" }
  ];

  const categories = await Promise.all(
    categoryData.map((category) =>
      prisma.category.upsert({
        where: { categoryId: category.categoryId },
        update: {
          categoryName: category.categoryName,
          description: category.description,
          status: "ACTIVE",
          updatedByAdminId: admin.userId
        },
        create: {
          ...category,
          status: "ACTIVE",
          createdByAdminId: admin.userId,
          updatedByAdminId: admin.userId
        }
      })
    )
  );

  const categoryIdByName = Object.fromEntries(categories.map((category) => [category.categoryName, category.categoryId]));

  const menuData = [
    ["Espresso", "Strong single-shot coffee", 3500, "Coffee", "/morning-haze-logo.png", 24, 8, "cups"],
    ["Americano", "Rich black coffee", 3200, "Coffee", "/morning-haze-logo.png", 70, 10, "cups"],
    ["Cafe Latte", "Espresso with steamed milk", 4500, "Coffee", "/morning-haze-logo.png", 55, 10, "cups"],
    ["Cappuccino", "Espresso, steamed milk, and foam", 4800, "Coffee", "/morning-haze-logo.png", 36, 8, "cups"],
    ["Green Tea", "Aromatic hot green tea", 2800, "Tea", "/morning-haze-logo.png", 42, 8, "cups"],
    ["Lemon Iced Tea", "Chilled tea with lemon", 3000, "Tea", "/morning-haze-logo.png", 28, 8, "cups"],
    ["Butter Croissant", "Flaky butter pastry", 3500, "Bakery", "/morning-haze-logo.png", 30, 6, "pieces"],
    ["Blueberry Muffin", "Soft muffin with blueberry filling", 3800, "Bakery", "/morning-haze-logo.png", 18, 6, "pieces"],
    ["Iced Latte", "Cold latte over ice", 5200, "Cold Drinks", "/morning-haze-logo.png", 22, 8, "cups"],
    ["Chocolate Frappe", "Blended chocolate cafe drink", 5800, "Cold Drinks", "/morning-haze-logo.png", 12, 5, "cups"]
  ] as const;

  const menuItems: MenuItem[] = [];
  for (let index = 0; index < menuData.length; index += 1) {
    const [itemName, description, price, categoryName, imageUrl, stockQuantity, reorderLevel, unit] = menuData[index];
    const item = await prisma.menuItem.upsert({
      where: { menuItemId: index + 1 },
      update: {
        categoryId: categoryIdByName[categoryName],
        updatedByAdminId: admin.userId,
        itemName,
        description,
        price,
        imageUrl,
        isAvailable: true
      },
      create: {
        menuItemId: index + 1,
        categoryId: categoryIdByName[categoryName],
        createdByAdminId: admin.userId,
        updatedByAdminId: admin.userId,
        itemName,
        description,
        price,
        imageUrl,
        isAvailable: true
      }
    });

    await prisma.inventory.upsert({
      where: { menuItemId: item.menuItemId },
      update: {
        lastUpdatedByAdminId: admin.userId,
        stockQuantity,
        reorderLevel,
        unit
      },
      create: {
        menuItemId: item.menuItemId,
        lastUpdatedByAdminId: admin.userId,
        stockQuantity,
        reorderLevel,
        unit
      }
    });

    menuItems.push(item);
  }

  const existingOrders = await prisma.order.count();
  if (existingOrders === 0) {
    const sampleOrders = [
      {
        daysAgo: 6,
        paymentMethod: "Cash",
        printedStatus: true,
        items: [
          ["Americano", 2],
          ["Butter Croissant", 1]
        ]
      },
      {
        daysAgo: 4,
        paymentMethod: "Mobile Pay",
        printedStatus: true,
        items: [
          ["Cafe Latte", 2],
          ["Blueberry Muffin", 2]
        ]
      },
      {
        daysAgo: 2,
        paymentMethod: "Card",
        printedStatus: false,
        items: [
          ["Iced Latte", 1],
          ["Chocolate Frappe", 1],
          ["Butter Croissant", 1]
        ]
      },
      {
        daysAgo: 0,
        paymentMethod: "Cash",
        printedStatus: true,
        items: [
          ["Espresso", 1],
          ["Cappuccino", 1],
          ["Green Tea", 1]
        ]
      }
    ] as const;

    for (const [index, sampleOrder] of sampleOrders.entries()) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - sampleOrder.daysAgo);
      orderDate.setHours(9 + index * 2, 15, 0, 0);

      const orderItems = sampleOrder.items.map(([itemName, quantity]) => {
        const item = menuItems.find((entry) => entry.itemName === itemName);
        if (!item) throw new Error(`Missing seed menu item: ${itemName}`);
        const unitPrice = Number(item.price);
        return {
          menuItemId: item.menuItemId,
          quantity,
          unitPrice,
          subTotal: unitPrice * quantity
        };
      });
      const totalAmount = orderItems.reduce((sum, item) => sum + item.subTotal, 0);

      const order = await prisma.order.create({
        data: {
          cashierId: cashier.userId,
          orderDate,
          totalAmount,
          orderStatus: "Completed",
          createdAt: orderDate,
          updatedAt: orderDate,
          orderItems: { create: orderItems }
        }
      });

      const payment = await prisma.payment.create({
        data: {
          orderId: order.orderId,
          paymentMethod: sampleOrder.paymentMethod,
          amountPaid: totalAmount,
          changeAmount: 0,
          paymentStatus: "Paid",
          paymentDate: orderDate
        }
      });

      await prisma.receipt.create({
        data: {
          orderId: order.orderId,
          paymentId: payment.paymentId,
          receiptNumber: `MHC-SEED-${String(index + 1).padStart(4, "0")}`,
          receiptDate: orderDate,
          totalAmount,
          printedStatus: sampleOrder.printedStatus
        }
      });

      for (const item of orderItems) {
        await prisma.inventory.updateMany({
          where: { menuItemId: item.menuItemId },
          data: { stockQuantity: { decrement: item.quantity } }
        });
      }
    }
  }

  console.log("Seed completed.");
  console.log("Admin: admin / Admin@123");
  console.log("Cashier: cashier / Cashier@123");
  console.log("Extra cashier: cashier2 / Cashier@123");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
