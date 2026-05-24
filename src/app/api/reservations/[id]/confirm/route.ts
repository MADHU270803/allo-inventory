import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const r = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!r) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (r.status !== "PENDING") {
      return NextResponse.json(
        { error: `Reservation is already ${r.status}` },
        { status: 400 }
      );
    }

    // EXPIRED reservation check
    if (r.expiresAt < new Date()) {
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
          where: { id },
          data: { status: "RELEASED" },
        }),
      ]);

      return NextResponse.json(
        { error: "Reservation has expired" },
        { status: 410 }
      );
    }

    // CONFIRM reservation
    await prisma.$transaction([
      prisma.stock.update({
        where: {
          productId_warehouseId: {
            productId: r.productId,
            warehouseId: r.warehouseId,
          },
        },
        data: {
          total: { decrement: r.quantity },
          reserved: { decrement: r.quantity },
        },
      }),
      prisma.reservation.update({
        where: { id },
        data: { status: "CONFIRMED" },
      }),
    ]);

    const updated = await prisma.reservation.findUnique({
      where: { id },
      include: {
        product: true,
        warehouse: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}