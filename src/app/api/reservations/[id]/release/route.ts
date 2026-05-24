import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const r = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!r || r.status !== "PENDING") {
      return NextResponse.json(
        { error: "Cannot release this reservation" },
        { status: 400 }
      );
    }

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
        data: {
          status: "RELEASED",
        },
      }),
    ]);

    return NextResponse.json({
      message: "Reservation released successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}