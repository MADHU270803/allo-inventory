import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Protect cron endpoint
    const auth = req.headers.get("authorization");

    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find expired reservations
    const expired = await prisma.reservation.findMany({
      where: {
        status: "PENDING",
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    let released = 0;

    for (const r of expired) {
      await prisma.$transaction([
        prisma.stock.update({
          where: {
            productId_warehouseId: {
              productId: r.productId,
              warehouseId: r.warehouseId,
            },
          },
          data: {
            reserved: { decrement: r.quantity },
          },
        }),

        prisma.reservation.update({
          where: { id: r.id },
          data: { status: "RELEASED" },
        }),
      ]);

      released++;
    }

    return NextResponse.json({
      released,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}