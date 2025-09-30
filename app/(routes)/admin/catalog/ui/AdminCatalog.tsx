"use client";

import * as React from "react";
import { generateCatalog, saveReviewed, type DraftRow } from "../actions";

type Gender = "boy" | "girl" | "neutral";

export default function AdminCatalog() {
    const [gender, setGender] = React.useState<Gender>("neutral");
    const [extraQuery, setExtraQuery] = React.useState("");
    const [busy, setBusy] = React.useState<null | "gen" | "save">(null);
    const [rows, setRows] = React.useState<DraftRow[]>([]);
    const [msg, setMsg] = React.useState<string>("");

    const [debug, setDebug] = React.useState<unknown[]>([]);

    async function runGenerate() {
        setBusy("gen"); setMsg("");
        try {
            const result = await generateCatalog(`${gender} toys ${extraQuery}`);
            setRows(result.rows);
            setDebug(result.runs || []);
            setMsg(`Generated ${result.created} new items; showing ${result.rows.length} total.`);
        } catch (e: unknown) {
            setMsg(`Generate failed: ${String((e as Error)?.message || e)}`);
        } finally {
            setBusy(null);
        }
    }

    async function runSave() {
        setBusy("save");
        setMsg("");
        try {
            const { ok, count } = await saveReviewed(gender, rows);
            setMsg(ok ? `Saved ${count} ${gender} items to DB (replaced bucket).` : "Save failed");
        } catch (e: unknown) {
            setMsg(`Save failed: ${String((e as Error)?.message || e)}`);
        } finally {
            setBusy(null);
        }
    }

    function updateCell<K extends keyof DraftRow>(i: number, key: K, value: DraftRow[K]) {
        setRows((prev) => {
            const next = [...prev];
            next[i] = { ...next[i], [key]: value };
            return next;
        });
    }

    function removeRow(i: number) {
        setRows((prev) => prev.filter((_, idx) => idx !== i));
    }

    return (
        <div className="mx-auto max-w-7xl p-6">
            <h1 className="mb-4 text-2xl font-bold">Admin · Catalog Builder</h1>

            <div className="flex flex-wrap items-end gap-3 rounded-xl border p-4">
                <div className="flex flex-col">
                    <label className="text-sm text-gray-600">Gender bucket</label>
                    <select
                        className="rounded-lg border px-3 py-2"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as Gender)}
                    >
                        <option value="boy">Boys</option>
                        <option value="girl">Girls</option>
                        <option value="neutral">Gender Neutral</option>
                    </select>
                </div>

                <div className="flex min-w-[320px] flex-1 flex-col">
                    <label className="text-sm text-gray-600">Extra query (optional)</label>
                    <input
                        className="rounded-lg border px-3 py-2"
                        placeholder='e.g. "under $25", "STEM robotics", "plush dragon"'
                        value={extraQuery}
                        onChange={(e) => setExtraQuery(e.target.value)}
                    />
                </div>

                <button onClick={runGenerate} disabled={busy !== null} className="rounded-lg border px-4 py-2">
                    {busy === "gen" ? "Generating…" : "Generate candidates"}
                </button>

                <button
                    onClick={runSave}
                    disabled={busy !== null || rows.length === 0}
                    className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                >
                    {busy === "save" ? "Saving…" : "Save to DB (replace bucket)"}
                </button>
            </div>

            {msg && <p className="mt-3 text-sm text-emerald-700">{msg}</p>}

            <div className="mt-6 overflow-auto rounded-xl border">
                {debug.length > 0 && (
                    <div className="mt-3 rounded-lg border p-3 text-xs text-gray-700">
                        <div className="font-medium mb-1">Debug (per query & model)</div>
                        <pre className="max-h-64 overflow-auto whitespace-pre-wrap">
                            {JSON.stringify(debug.slice(0, 12), null, 2)}
                        </pre>
                    </div>
                )}
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-2 py-2 text-left">Title</th>
                            <th className="px-2 py-2 text-left">Retailer</th>
                            <th className="px-2 py-2 text-left">Price</th>
                            <th className="px-2 py-2 text-left">Image</th>
                            <th className="px-2 py-2 text-left">URL</th>
                            <th className="px-2 py-2 text-left">Brand</th>
                            <th className="px-2 py-2 text-left">Model</th>
                            <th className="px-2 py-2 text-left">Category</th>
                            <th className="px-2 py-2 text-left">Tags (comma)</th>
                            <th className="px-2 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={`${r.title}-${i}`} className="border-t">
                                <td className="px-2 py-2">
                                    <input
                                        className="w-80 rounded border px-2 py-1"
                                        value={r.title}
                                        onChange={(e) => updateCell(i, "title", e.target.value)}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        className="w-28 rounded border px-2 py-1"
                                        value={r.retailer ?? ""}
                                        onChange={(e) => updateCell(i, "retailer", e.target.value)}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-24 rounded border px-2 py-1"
                                        value={typeof r.price === "number" ? r.price : ""}
                                        onChange={(e) => updateCell(i, "price", e.target.value ? Number(e.target.value) : undefined)}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        className="w-64 rounded border px-2 py-1"
                                        value={r.imageUrl ?? ""}
                                        onChange={(e) => updateCell(i, "imageUrl", e.target.value)}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        className="w-80 rounded border px-2 py-1"
                                        value={r.productUrl ?? ""}
                                        onChange={(e) => updateCell(i, "productUrl", e.target.value)}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        className="w-40 rounded border px-2 py-1"
                                        value={r.brand ?? ""}
                                        onChange={(e) => updateCell(i, "brand", e.target.value)}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        className="w-40 rounded border px-2 py-1"
                                        value={r.model ?? ""}
                                        onChange={(e) => updateCell(i, "model", e.target.value)}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        className="w-40 rounded border px-2 py-1"
                                        value={r.category ?? ""}
                                        onChange={(e) => updateCell(i, "category", e.target.value)}
                                    />
                                </td>
                                <td className="px-2 py-2">
                                    <input
                                        className="w-56 rounded border px-2 py-1"
                                        value={(r.tags ?? []).join(", ")}
                                        onChange={(e) =>
                                            updateCell(
                                                i,
                                                "tags",
                                                e.target.value
                                                    .split(",")
                                                    .map((t) => t.trim())
                                                    .filter(Boolean)
                                            )
                                        }
                                    />
                                </td>
                                <td className="px-2 py-2 text-right">
                                    <button className="rounded border px-2 py-1 text-xs" onClick={() => removeRow(i)}>
                                        Remove
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td className="px-2 py-8 text-center text-gray-500" colSpan={10}>
                                    No rows yet. Click <em>Generate candidates</em>.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
