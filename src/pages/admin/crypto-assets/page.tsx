"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdmin } from "@/components/admin/admin-shell";
import { adminFetch } from "@/lib/api";
import { inputCls, Modal, TableWrap } from "@/components/admin/ui";

interface Asset {
  id: string;
  email?: string;
  symbol: string;
  name: string;
  balance: string;
  price_usd: string | null;
}

function CryptoAssetsAdmin() {
  const { slug } = useAdmin();
  const [rows, setRows] = useState<Asset[]>([]);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<{ id: string; label: string; balance: string; price_usd: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminFetch<{ assets: Asset[] }>(slug, `/crypto-assets${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    if (res.ok && res.data?.assets) setRows(res.data.assets);
  }, [slug, query]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    await adminFetch(slug, "/crypto-assets", {
      method: "POST",
      body: JSON.stringify({
        id: editing.id,
        balance: editing.balance,
        price_usd: editing.price_usd,
      }),
    });
    setBusy(false);
    setEditing(null);
    await load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Crypto assets</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && load()}
        placeholder="Search by member or symbol…"
        className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
      <TableWrap empty={rows.length === 0}>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200/70 text-xs text-gray-500 dark:border-gray-700/50">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Member</th>
              <th className="px-4 py-2.5 text-left font-medium">Asset</th>
              <th className="px-4 py-2.5 text-left font-medium">Balance</th>
              <th className="px-4 py-2.5 text-left font-medium">Price (USD)</th>
              <th className="px-4 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{a.email ?? "--"}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{a.symbol}</span>
                  <span className="ml-2 text-xs text-gray-500">{a.name}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">{Number(a.balance).toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-700 dark:text-gray-300">
                  ${Number(a.price_usd ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      setEditing({
                        id: a.id,
                        label: `${a.symbol} — ${a.email ?? ""}`,
                        balance: String(Number(a.balance)),
                        price_usd: String(Number(a.price_usd ?? 0)),
                      })
                    }
                    className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {editing && (
        <Modal title={`Edit ${editing.label}`} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Coin balance</span>
              <input
                type="number"
                step="any"
                min="0"
                value={editing.balance}
                onChange={(e) => setEditing({ ...editing, balance: e.target.value })}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-gray-700 dark:text-gray-300">Price (USD)</span>
              <input
                type="number"
                step="any"
                min="0"
                value={editing.price_usd}
                onChange={(e) => setEditing({ ...editing, price_usd: e.target.value })}
                className={inputCls}
              />
            </label>
            <button
              onClick={save}
              disabled={busy}
              className="w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "var(--brand)" }}
            >
              {busy ? "Saving…" : "Save asset"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function AdminCryptoAssetsPage() {
  return (
    <AdminShell>
      <CryptoAssetsAdmin />
    </AdminShell>
  );
}
