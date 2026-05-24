import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  // Clean database (safe re-run)
  await prisma.reservation.deleteMany();
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  // Warehouses
  const mumbai = await prisma.warehouse.create({
    data: {
      name: "Mumbai Warehouse",
      location: "Mumbai, India",
    },
  });

  const delhi = await prisma.warehouse.create({
    data: {
      name: "Delhi Warehouse",
      location: "Delhi, India",
    },
  });

  // Products
  const p1 = await prisma.product.create({
    data: {
      name: "Wireless Headphones",
      price: 2999,
      description: "Premium sound, 30hr battery",
    },
  });

  const p2 = await prisma.product.create({
    data: {
      name: "Mechanical Keyboard",
      price: 4499,
      description: "RGB backlit, tactile switches",
    },
  });

  const p3 = await prisma.product.create({
    data: {
      name: "USB-C Hub 7-in-1",
      price: 1299,
      description: "Multiport adapter for laptops",
    },
  });

  // Stock
  await prisma.stock.createMany({
    data: [
      { productId: p1.id, warehouseId: mumbai.id, total: 5, reserved: 0 },
      { productId: p1.id, warehouseId: delhi.id, total: 3, reserved: 0 },
      { productId: p2.id, warehouseId: mumbai.id, total: 2, reserved: 0 },
      { productId: p3.id, warehouseId: mumbai.id, total: 1, reserved: 0 },
      { productId: p3.id, warehouseId: delhi.id, total: 4, reserved: 0 },
    ],
  });

  console.log(
    "Done! Seeded 2 warehouses, 3 products, 5 stock entries."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });