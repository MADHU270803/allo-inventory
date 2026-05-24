"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  async function handleReserve(productId: string, warehouseId: string) {
    setError("");
    setBusy(`${productId}:${warehouseId}`);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          warehouseId,
          quantity: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      router.push(`/reservation/${data.id}`);
    } finally {
      setBusy(null);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">Loading products...</p>
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Products</h1>

      <p className="text-slate-500 mb-6 text-sm">
        Click Reserve to hold a product for 10 minutes while you pay.
      </p>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">{product.name}</h2>

            <p className="mt-1 text-sm text-slate-500">
              {product.description}
            </p>

            <p className="mt-3 text-2xl font-bold text-slate-800">
              Rs.{product.price.toLocaleString("en-IN")}
            </p>

            <div className="mt-4 space-y-2">
              {product.stock.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="text-slate-600">
                    {s.warehouse.name}
                  </span>

                  <div className="flex items-center gap-3">
                    <span
                      className={
                        s.available > 0
                          ? "font-medium text-green-600"
                          : "font-medium text-red-500"
                      }
                    >
                      {s.available} left
                    </span>

                    <button
                      disabled={
                        s.available <= 0 ||
                        busy === `${product.id}:${s.warehouseId}`
                      }
                      onClick={() =>
                        handleReserve(product.id, s.warehouseId)
                      }
                      className="rounded-md bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {busy === `${product.id}:${s.warehouseId}`
                        ? "..."
                        : "Reserve"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}