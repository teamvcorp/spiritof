"use client";

import * as React from "react";
import { generateFastCatalog, saveFastCatalog, getTrendingByCategory, type FastCatalogRow } from "../fast-actions";
import { seedCatalogWithPopularToys } from "../seed-actions";
import type { ToyCategory } from "@/lib/toy-data-source";

type Gender = "boy" | "girl" | "neutral";

const CATEGORIES: { value: ToyCategory; label: string }[] = [
  { value: "action-figures", label: "Action Figures" },
  { value: "dolls", label: "Dolls" },
  { value: "building-blocks", label: "Building Blocks" },
  { value: "vehicles", label: "Vehicles & RC" },
  { value: "arts-crafts", label: "Arts & Crafts" },
  { value: "games-puzzles", label: "Games & Puzzles" },
  { value: "educational", label: "Educational & STEM" },
  { value: "outdoor", label: "Outdoor & Sports" },
  { value: "plush", label: "Plush & Collectibles" },
  { value: "electronics", label: "Electronics & Gaming" },
];

export default function FastAdminCatalog() {
  const [gender, setGender] = React.useState<Gender>("neutral");
  const [category, setCategory] = React.useState<ToyCategory | "">("");
  const [priceMax, setPriceMax] = React.useState<number>(100);
  const [busy, setBusy] = React.useState<null | "gen" | "save" | "trending" | "seed">(null);
  const [rows, setRows] = React.useState<FastCatalogRow[]>([]);
  const [msg, setMsg] = React.useState<string>("");
  const [stats, setStats] = React.useState<{
    curatedCount: number;
    aiEnhancedCount: number;
    totalUnique: number;
  } | null>(null);

  // Fast generation with curated toys + AI enhancement
  async function runFastGenerate() {
    setBusy("gen");
    setMsg("");
    try {
      const result = await generateFastCatalog(
        gender,
        category || undefined,
        priceMax
      );
      setRows(result.rows);
      setStats(result.stats);
      setMsg(
        `✨ Fast generation complete! ${result.stats.curatedCount} curated toys, ${result.stats.aiEnhancedCount} AI-enhanced with real URLs, ${result.stats.totalUnique} total unique items.`
      );
    } catch (e: unknown) {
      setMsg(`Generate failed: ${String((e as Error)?.message || e)}`);
    } finally {
      setBusy(null);
    }
  }

  // Get instant trending toys from curated list
  async function runTrending() {
    setBusy("trending");
    setMsg("");
    try {
      const trending = await getTrendingByCategory(gender, category || undefined);
      const trendingRows: FastCatalogRow[] = trending.map((toy, index) => ({
        _tmpId: `trending_${index}`,
        title: toy.title,
        brand: toy.brand,
        category: toy.category,
        gender: toy.gender as Gender,
        price: toy.price,
        retailer: undefined,
        productUrl: undefined,
        imageUrl: undefined,
        popularity: toy.popularity || 90,
        keywords: toy.tags || [],
        isFromCuratedList: true,
      }));
      setRows(trendingRows);
      setMsg(`🔥 ${trending.length} trending toys loaded instantly!`);
    } catch (e: unknown) {
      setMsg(`Trending failed: ${String((e as Error)?.message || e)}`);
    } finally {
      setBusy(null);
    }
  }

  async function runSave() {
    setBusy("save");
    setMsg("");
    try {
      const { ok, count, error } = await saveFastCatalog(gender, rows, true);
      if (ok) {
        setMsg(`💾 Saved ${count} ${gender} items to database (replaced existing ${gender} catalog).`);
      } else {
        setMsg(`Save failed: ${error || "Unknown error"}`);
      }
    } catch (e: unknown) {
      setMsg(`Save failed: ${String((e as Error)?.message || e)}`);
    } finally {
      setBusy(null);
    }
  }

  // Seed database with all popular toys
  async function runSeedDatabase() {
    setBusy("seed");
    setMsg("");
    try {
      const result = await seedCatalogWithPopularToys();
      if (result.success) {
        setMsg(`🌱 ${result.message} - Database ready for fast searching!`);
      } else {
        setMsg(`Seed failed: ${result.message}`);
      }
    } catch (e: unknown) {
      setMsg(`Seed failed: ${String((e as Error)?.message || e)}`);
    } finally {
      setBusy(null);
    }
  }

  function updateCell<K extends keyof FastCatalogRow>(
    i: number,
    key: K,
    value: FastCatalogRow[K]
  ) {
    setRows((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [key]: value };
      return next;
    });
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Add a new row manually
  function addRow() {
    const newRow: FastCatalogRow = {
      _tmpId: `manual_${Date.now()}`,
      title: "",
      brand: "",
      category: "toys",
      gender,
      price: undefined,
      retailer: undefined,
      productUrl: undefined,
      imageUrl: undefined,
      popularity: 50,
      keywords: [],
      isFromCuratedList: false,
    };
    setRows(prev => [...prev, newRow]);
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-santa mb-2">🚀 Fast Catalog Builder</h1>
        <p className="text-gray-600">
          Generate toy catalogs 10x faster using curated popular toys + AI enhancement
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border p-6 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gender Target
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 focus:ring-santa focus:border-santa"
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
            >
              <option value="boy">Boys</option>
              <option value="girl">Girls</option>
              <option value="neutral">Gender Neutral</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (optional)
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 focus:ring-santa focus:border-santa"
              value={category}
              onChange={(e) => setCategory(e.target.value as ToyCategory | "")}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Price ($)
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 focus:ring-santa focus:border-santa"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
            >
              <option value={25}>Under $25</option>
              <option value={50}>Under $50</option>
              <option value={100}>Under $100</option>
              <option value={200}>Under $200</option>
              <option value={500}>Under $500</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              {rows.length} items loaded
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={runSeedDatabase}
            disabled={busy !== null}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {busy === "seed" ? "Seeding..." : "🌱 Seed Database (All Categories)"}
          </button>

          <button
            onClick={runTrending}
            disabled={busy !== null}
            className="bg-blueberry text-white px-4 py-2 rounded-lg hover:bg-blueberry/90 disabled:opacity-50 transition-colors"
          >
            {busy === "trending" ? "Loading..." : "⚡ Get Trending (Instant)"}
          </button>

          <button
            onClick={runFastGenerate}
            disabled={busy !== null}
            className="bg-evergreen text-white px-4 py-2 rounded-lg hover:bg-evergreen/90 disabled:opacity-50 transition-colors"
          >
            {busy === "gen" ? "Generating..." : "🚀 Fast Generate (AI Enhanced)"}
          </button>

          <button
            onClick={addRow}
            disabled={busy !== null}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            ➕ Add Manual Row
          </button>

          <button
            onClick={runSave}
            disabled={busy !== null || rows.length === 0}
            className="bg-santa text-white px-4 py-2 rounded-lg hover:bg-santa/90 disabled:opacity-50 transition-colors"
          >
            {busy === "save" ? "Saving..." : "💾 Save to Database"}
          </button>
        </div>
      </div>

      {/* Status Message */}
      {msg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">{msg}</p>
          {stats && (
            <div className="mt-2 grid grid-cols-3 gap-4 text-xs text-green-600">
              <div>Curated: {stats.curatedCount}</div>
              <div>AI Enhanced: {stats.aiEnhancedCount}</div>
              <div>Total: {stats.totalUnique}</div>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Title</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Brand</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Category</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Price</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Retailer</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Product URL</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Image URL</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Pop.</th>
                <th className="px-3 py-3 text-left font-medium text-gray-700">Source</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, i) => (
                <tr key={row._tmpId} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <input
                      className="w-64 rounded border px-2 py-1 text-sm"
                      value={row.title}
                      onChange={(e) => updateCell(i, "title", e.target.value)}
                      placeholder="Toy title..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-24 rounded border px-2 py-1 text-sm"
                      value={row.brand}
                      onChange={(e) => updateCell(i, "brand", e.target.value)}
                      placeholder="Brand"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      className="w-32 rounded border px-2 py-1 text-sm"
                      value={row.category}
                      onChange={(e) => updateCell(i, "category", e.target.value)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step="0.01"
                      className="w-20 rounded border px-2 py-1 text-sm"
                      value={row.price || ""}
                      onChange={(e) =>
                        updateCell(i, "price", e.target.value ? Number(e.target.value) : undefined)
                      }
                      placeholder="$"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-24 rounded border px-2 py-1 text-sm"
                      value={row.retailer || ""}
                      onChange={(e) => updateCell(i, "retailer", e.target.value)}
                      placeholder="walmart"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-64 rounded border px-2 py-1 text-sm"
                      value={row.productUrl || ""}
                      onChange={(e) => updateCell(i, "productUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="w-64 rounded border px-2 py-1 text-sm"
                      value={row.imageUrl || ""}
                      onChange={(e) => updateCell(i, "imageUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </td>
                  <td className="px-3 py-2">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {row.popularity}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        row.isFromCuratedList
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {row.isFromCuratedList ? "Curated" : "Manual"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="text-xs text-red-600 hover:text-red-800"
                      onClick={() => removeRow(i)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="px-3 py-12 text-center text-gray-500" colSpan={10}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">🎯</div>
                      <div>No toys loaded yet</div>
                      <div className="text-xs">Click &ldquo;Get Trending&rdquo; for instant results or &ldquo;Fast Generate&rdquo; for AI-enhanced catalog</div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">🚀 Speed Improvements:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Get Trending:</strong> Instant results from curated popular toys (0.1s vs 5min)</li>
          <li>• <strong>Fast Generate:</strong> Curated toys + AI enhancement for real URLs (30s vs 5min)</li>
          <li>• <strong>Smart Categories:</strong> Filter by actual toy categories children want</li>
          <li>• <strong>Popularity Scoring:</strong> Based on real trending data, not random search results</li>
        </ul>
      </div>
    </div>
  );
}