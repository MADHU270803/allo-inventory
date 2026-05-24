"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Reservation } from "@/lib/types";

// Countdown
function Countdown({ expiresAt }: { expiresAt: string }) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    function tick() {
      const remaining = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecs(remaining);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  const urgent = secs < 60;

  return (
    <span
      className={`text-3xl font-bold tabular-nums ${
        urgent ? "text-red-600" : "text-orange-500"
      }`}
    >
      {m}:{String(s).padStart(2, "0")}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  RELEASED: "bg-slate-100 text-slate-600",
};

export default function ReservationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadReservation = useCallback(async () => {
    try {
      const res = await fetch(`/api/reservations/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReservation(data);
      } else {
        setReservation(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadReservation();
  }, [loadReservation]);

  async function handleConfirm() {
    setErrorMsg("");
    setSuccessMsg("");

    const res = await fetch(`/api/reservations/${id}/confirm`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error ?? "Failed to confirm");
      return;
    }

    setReservation(data);
    setSuccessMsg("Payment confirmed! Your order is placed.");
  }

  async function handleCancel() {
    setErrorMsg("");
    setSuccessMsg("");

    const res = await fetch(`/api/reservations/${id}/release`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data.error ?? "Failed to cancel");
      return;
    }

    setReservation((prev) =>
      prev ? { ...prev, status: "RELEASED" } : prev
    );

    setSuccessMsg("Order cancelled. Stock returned to inventory.");
  }

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <p className="text-slate-500">Loading reservation...</p>
      </div>
    );

  if (!reservation)
    return (
      <div className="flex justify-center py-20">
        <p className="text-red-500">Reservation not found.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      {errorMsg && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 rounded border border-green-300 bg-green-50 px-4 py-3 text-green-700">
          {successMsg}
        </div>
      )}

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <Row label="Product" value={reservation.product.name} />
          <Row label="Warehouse" value={reservation.warehouse.name} />
          <Row label="Quantity" value={String(reservation.quantity)} />
          <Row
            label="Total"
            value={`Rs.${(
              reservation.product.price * reservation.quantity
            ).toLocaleString("en-IN")}`}
            bold
          />

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-500">Status</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                STATUS_STYLES[reservation.status] ?? ""
              }`}
            >
              {reservation.status}
            </span>
          </div>
        </div>

        {reservation.status === "PENDING" && (
          <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
            <p className="mb-1 text-xs text-slate-500">
              Reservation expires in
            </p>
            <Countdown expiresAt={reservation.expiresAt} />
          </div>
        )}

        {reservation.status === "PENDING" && (
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 rounded-lg bg-slate-900 py-2.5 font-semibold text-white hover:bg-slate-700"
            >
              Confirm Purchase
            </button>

            <button
              onClick={handleCancel}
              className="flex-1 rounded-lg border border-slate-300 py-2.5 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        )}

        {reservation.status !== "PENDING" && (
          <button
            onClick={() => router.push("/")}
            className="mt-5 w-full rounded-lg border border-slate-300 py-2.5 text-slate-700 hover:bg-slate-50"
          >
            Back to Products
          </button>
        )}
      </div>
    </div>
  );
}

// Helper
function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={bold ? "text-lg font-bold" : "font-medium"}>
        {value}
      </span>
    </div>
  );
}