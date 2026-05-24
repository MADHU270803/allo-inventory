import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { z } from "zod";

const Schema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  // 1. Parse JSON safely
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 2. Validate input
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { productId, warehouseId, quantity } = parsed.data;

  // 3. Idempotency key (optional but powerful)
  const idempotencyKey = req.headers.get("Idempotency-Key");

  if (idempotencyKey) {
    const cached = await redis.get(`idempotency:reserve:${idempotencyKey}`);

    if (cached) {
      return NextResponse.json(cached);
    }
  }

  // 4. Redis distributed lock
  const lockKey = `lock:stock:${productId}:${warehouseId}`;
  const lockVal = `${Date.now()}:${Math.random()}`;

  const acquired = await redis.set(lockKey, lockVal, {
    nx: true,
    ex: 5, // lock expires in 5s (safety fallback)
  });

  if (!acquired) {
    return NextResponse.json(
      { error: "Server busy, please retry" },
      { status: 503 }
    );
  }

  try {
    // 5. Check stock
    const stock = await prisma.stock.findUnique({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
    });

    if (!stock || stock.total - stock.reserved < quantity) {
      return NextResponse.json(
        { error: "Not enough stock available" },
        { status: 409 }
      );
    }

    // 6. Reserve stock
    await prisma.stock.update({
      where: {
        productId_warehouseId: {
          productId,
          warehouseId,
        },
      },
      data: {
        reserved: {
          increment: quantity,
        },
      },
    });

    // 7. Create reservation
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const reservation = await prisma.reservation.create({
      data: {
        productId,
        warehouseId,
        quantity,
        expiresAt,
        idempotencyKey: idempotencyKey ?? undefined,
      },
      include: {
        product: true,
        warehouse: true,
      },
    });

    // 8. Cache result for idempotency
    if (idempotencyKey) {
      await redis.set(
        `idempotency:reserve:${idempotencyKey}`,
        reservation,
        { ex: 86400 }
      );
    }

    return NextResponse.json(reservation, { status: 201 });
  } finally {
    // 9. Always release lock safely
    const cur = await redis.get(lockKey);
    if (cur === lockVal) {
      await redis.del(lockKey);
    }
  }
}