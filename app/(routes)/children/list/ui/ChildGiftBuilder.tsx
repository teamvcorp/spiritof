"use client";

import * as React from "react";
import { submitProposal } from "../actions";

type ChildLite = { id: string; name: string };
type CatalogGender = "boy" | "girl" | "neutral";

type CatalogResult = {
  _id: string;
  title: string;
  gender: CatalogGender;
  price?: number;
  retailer?: string;
  productUrl?: string;
  imageUrl?: string;
  brand?: string;
  model?: string;
  category?: string;
};

type DraftItem = {
  title: string;
  url: string;
  imageUrl?: string;
  price?: string | number;
  retailer?: string;
  brand?: string;
  model?: string;
  category?: string;
};

export default function ChildGiftBuilder({
  initialChildren,
  initialCatalog,
}: {
  initialChildren: ChildLite[];
  initialCatalog: CatalogResult[];
}) {
  const [childId, setChildId] = React.useState(initialChildren[0]?.id ?? "");
  const [gender, setGender] = React.useState<CatalogGender>("neutral");
  const [q, setQ] = React.useState("");
  const [age, setAge] = React.useState<number | "">("");
  const [pageBusy, setPageBusy] = React.useState(false);

  const [catalog, setCatalog] = React.useState<CatalogResult[]>(initialCatalog || []);
  const [cursor, setCursor] = React.useState<number | null>(24);
  const [hasMore, setHasMore] = React.useState(true);

  // Paste-a-link (special request)
  const [pasteUrl, setPasteUrl] = React.useState("");
  const [pasteBusy, setPasteBusy] = React.useState(false);

  // Draft list
  const [items, setItems] = React.useState<DraftItem[]>([]);
  const [busy, startTransition] = React.useTransition();

  async function fetchCatalog(reset = false) {
    setPageBusy(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (gender) params.set("gender", gender);
      if (age !== "") params.set("age", String(age));
      params.set("limit", "24");
      if (!reset && cursor !== null) params.set("cursor", String(cursor));

      const res = await fetch(`/api/catalog?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];
      if (reset) setCatalog(results);
      else setCatalog((prev) => [...prev, ...results]);
      setCursor(data.cursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } finally {
      setPageBusy(false);
    }
  }

  React.useEffect(() => {
    // whenever gender/q/age changes, reset list from start
    setCursor(0);
    setHasMore(true);
    fetchCatalog(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, q, age]);

  async function addByUrl() {
    if (!pasteUrl.trim() || !childId) return;
    setPasteBusy(true);
    try {
      const r = await fetch("/api/clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ url: pasteUrl.trim(), childId }),
      });
      const data = await r.json();
      if (data?.item) {
        const it = data.item;
        setItems((prev) => [
          ...prev,
          {
            title: it.title || it.url,
            url: it.url,
            imageUrl: it.imageUrl,
            price: it.price,
            retailer: it.retailer,
            brand: it.brand,
            model: it.model,
            category: it.category,
          },
        ]);
        setPasteUrl("");
      } else {
        alert("Could not add link");
      }
    } finally {
      setPasteBusy(false);
    }
  }

  function addFromCatalog(c: CatalogResult) {
    setItems((prev) => [
      ...prev,
      {
        title: c.title,
        url: c.productUrl || "",
        imageUrl: c.imageUrl,
        price: c.price,
        retailer: c.retailer,
        brand: c.brand,
        model: c.model,
        category: c.category,
      },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const submit = () =>
    startTransition(async () => {
      await submitProposal(childId, items);
      setItems([]);
      alert("Submitted for parent approval.");
    });

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b p-3">
        <select value={childId} onChange={(e) => setChildId(e.target.value)} className="rounded-xl border px-3 py-2">
          {initialChildren.length ? (
            initialChildren.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))
          ) : (
            <option value="" disabled>
              No children
            </option>
          )}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-sm">Gender</label>
          <select
            className="rounded-xl border px-3 py-2"
            value={gender}
            onChange={(e) => setGender(e.target.value as CatalogGender)}
          >
            <option value="boy">Boys</option>
            <option value="girl">Girls</option>
            <option value="neutral">Gender Neutral</option>
          </select>
        </div>

        <input
          type="search"
          placeholder='Search in our catalog (e.g., "LEGO", "plush", "STEM")'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border px-3 py-2"
        />

        <div className="flex items-center gap-2">
          <label className="text-sm">Age</label>
          <input
            type="number"
            min={0}
            max={18}
            value={age}
            onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-20 rounded-xl border px-2 py-1"
          />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!items.length || busy || !childId}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {busy ? "Submitting..." : "Submit for Approval"}
        </button>
      </div>

      <div className="grid flex-1 grid-cols-12">
        {/* LEFT: Catalog */}
        <div className="col-span-9 border-r">
          <div className="border-b p-3">
            <h2 className="text-lg font-semibold">Our Top Picks</h2>
            <p className="text-sm text-gray-500">Curated gifts from our in-house catalog.</p>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {catalog.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-gray-500">
                No items yet. Try adjusting filters or search terms.
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                  {catalog.map((c) => (
                    <li key={c._id} className="overflow-hidden rounded-xl border">
                      <button className="block w-full text-left" onClick={() => addFromCatalog(c)} title={c.title}>
                        {c.imageUrl ? (
                          <img src={c.imageUrl} alt="" className="h-40 w-full object-cover" />
                        ) : (
                          <div className="grid h-40 place-items-center bg-gray-100 text-xs text-gray-500">No Image</div>
                        )}
                        <div className="p-2">
                          <div className="line-clamp-2 text-sm font-medium">{c.title}</div>
                          <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
                            <span className="truncate">{c.retailer}</span>
                            {typeof c.price === "number" ? <span>${c.price.toFixed(2)}</span> : <span />}
                          </div>
                        </div>
                      </button>
                      <div className="border-t p-2 text-right">
                        <button className="rounded-lg border px-2 py-1 text-xs" onClick={() => addFromCatalog(c)}>
                          Add
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex items-center justify-center">
                  <button
                    className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
                    onClick={() => fetchCatalog(false)}
                    disabled={!hasMore || pageBusy}
                  >
                    {hasMore ? (pageBusy ? "Loading…" : "Load more") : "No more results"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Draft List + Special Request */}
        <aside className="col-span-3 flex h-full flex-col">
          <div className="border-b p-3">
            <h2 className="text-lg font-semibold">Christmas List</h2>
            <p className="text-sm text-gray-500">Paste a link for special requests.</p>

            <div className="mt-2 flex items-center gap-2">
              <input
                type="url"
                inputMode="url"
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
                placeholder="Paste a product link (Target, Walmart, Amazon)…"
                className="min-w-0 flex-1 rounded-xl border px-3 py-2"
              />
              <button
                type="button"
                onClick={addByUrl}
                className="rounded-xl border px-3 py-2 text-sm"
                disabled={pasteBusy || !pasteUrl.trim() || !childId}
              >
                {pasteBusy ? "Adding…" : "Add link"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3">
            {items.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-gray-500">No items yet — add some!</div>
            ) : (
              <ul className="space-y-3">
                {items.map((it, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl border p-2">
                    {it.imageUrl ? (
                      <img src={it.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    ) : (
                      <div className="grid h-16 w-16 place-items-center rounded-lg bg-gray-100 text-xs text-gray-500">
                        Img
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500 truncate">{it.retailer}</div>
                      <div className="line-clamp-2 text-sm">{it.title}</div>
                      <div className="text-sm font-semibold">
                        {typeof it.price !== "undefined" ? `$${Number(it.price).toFixed(2)}` : <span className="text-gray-400">—</span>}
                      </div>
                    </div>
                    <button className="rounded-lg border px-2 py-1 text-xs" onClick={() => removeItem(i)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
