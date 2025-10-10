"use client";

import { useState, useEffect } from "react";
import { put } from "@vercel/blob";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ImageUpload from "@/components/ui/ImageUpload";
import ToyRequestViewer from "@/components/admin/ToyRequestViewer";
import CatalogItemForm, { CatalogFormData, emptyCatalogFormData } from "@/components/admin/CatalogItemForm";
import { MasterCatalogItem, CatalogGender } from "@/models/MasterCatalog";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUpload, FaSave, FaTimes, FaImage } from "react-icons/fa";
import Container from "@/components/ui/Container";

const ADMIN_PASSWORD = "admin123";

interface CatalogStats {
  totalItems: number;
  activeItems: number;
  categories: string[];
}

type FormData = CatalogFormData;
const emptyFormData = emptyCatalogFormData;

export default function CatalogManagerPage() {
  const [items, setItems] = useState<MasterCatalogItem[]>([]);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterCatalogItem | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkItems, setBulkItems] = useState<FormData[]>([emptyFormData]);
  const [showToyRequests, setShowToyRequests] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyFormData); // NEW: Add form state
  const [isSubmitting, setIsSubmitting] = useState(false); // NEW: Add submitting state

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/catalog-manager", {
        headers: { "X-Admin-Password": ADMIN_PASSWORD },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (genderFilter !== "all") params.append("gender", genderFilter);
      params.append("limit", "1000"); // Increased limit to show more items

      const response = await fetch(`/api/admin/catalog-manager/items?${params}`, {
        headers: { "X-Admin-Password": ADMIN_PASSWORD },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchItems();
  }, [searchTerm, genderFilter]);

  // Convert form data to API format
  const formToApiData = (form: FormData) => ({
    title: form.title,
    brand: form.brand || undefined,
    brandLogoUrl: form.brandLogoUrl || undefined,
    brandLogoStoredAt: form.brandLogoUrl ? new Date() : undefined, // NEW: Add timestamp when logo exists
    category: form.category || undefined,
    description: form.description || undefined,
    gender: form.gender,
    ageMin: form.ageMin === "" ? undefined : Number(form.ageMin),
    ageMax: form.ageMax === "" ? undefined : Number(form.ageMax),
    price: form.price === "" ? undefined : Number(form.price),
    retailer: form.retailer || undefined,
    productUrl: form.productUrl,
    imageUrl: form.imageUrl || undefined,
    imageStoredAt: form.imageUrl ? new Date() : undefined, // Add timestamp when image exists
    sku: form.sku || undefined,
    tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(t => t) : [],
    popularity: form.popularity === "" ? undefined : Number(form.popularity),
    sourceType: form.sourceType,
    isActive: form.isActive,
  });

  // Create single item
  const createItem = async (formData: FormData) => {
    try {
      const response = await fetch("/api/admin/catalog-manager/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Password": ADMIN_PASSWORD,
        },
        body: JSON.stringify(formToApiData(formData)),
      });

      if (response.ok) {
        setGenderFilter("all"); // Reset filter to show all items including the new one
        setSearchTerm(""); // Clear search to see the new item
        await fetchItems();
        await fetchStats();
        return true;
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error("Error creating item:", error);
      alert("Failed to create item");
      return false;
    }
  };

  // Update item
  const updateItem = async (id: string, formData: FormData) => {
    try {
      const response = await fetch(`/api/admin/catalog-manager/items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Password": ADMIN_PASSWORD,
        },
        body: JSON.stringify(formToApiData(formData)),
      });

      if (response.ok) {
        await fetchItems();
        await fetchStats();
        setEditingItem(null);
        return true;
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item");
      return false;
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`/api/admin/catalog-manager/items/${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Password": ADMIN_PASSWORD },
      });

      if (response.ok) {
        await fetchItems();
        await fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item");
    }
  };

  // Bulk create items
  const createBulkItems = async () => {
    setLoading(true);
    let successCount = 0;

    for (const item of bulkItems) {
      if (item.title && item.productUrl) {
        const success = await createItem(item);
        if (success) successCount++;
      }
    }

    setLoading(false);
    setBulkMode(false);
    setBulkItems([emptyFormData]);
    alert(`Successfully created ${successCount} items`);
  };

  // NEW: Reset form helper
  const resetForm = () => {
    setFormData(emptyFormData);
    setShowAddForm(false);
    setEditingItem(null);
  };

  // Update createItem to use the form state
  const handleCreateSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const success = await createItem(data);
    setIsSubmitting(false);
    if (success) {
      resetForm();
    }
  };

  // Update updateItem to use the form state
  const handleUpdateSubmit = async (data: FormData) => {
    if (!editingItem) return;
    setIsSubmitting(true);
    const success = await updateItem(editingItem._id!.toString(), data);
    setIsSubmitting(false);
    if (success) {
      resetForm();
    }
  };

  // NEW: Prepare form data when editing
  useEffect(() => {
    if (editingItem) {
      setFormData({
        title: editingItem.title,
        brand: editingItem.brand || "",
        brandLogoUrl: editingItem.brandLogoUrl || "",
        category: editingItem.category || "",
        description: editingItem.description || "",
        gender: editingItem.gender,
        ageMin: editingItem.ageMin !== undefined ? editingItem.ageMin : "",
        ageMax: editingItem.ageMax !== undefined ? editingItem.ageMax : "",
        price: editingItem.price !== undefined ? editingItem.price : "",
        retailer: editingItem.retailer || "",
        productUrl: editingItem.productUrl,
        imageUrl: editingItem.imageUrl || "",
        sku: editingItem.sku || "",
        tags: editingItem.tags?.join(", ") || "",
        popularity: editingItem.popularity !== undefined ? editingItem.popularity : "",
        sourceType: editingItem.sourceType,
        isActive: editingItem.isActive,
      });
    } else if (showAddForm) {
      setFormData(emptyFormData);
    }
  }, [editingItem, showAddForm]);

  return (
    <Container className="py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-santa mb-2">🎄 Master Catalog Manager</h1>
        <p className="text-gray-600">Manage your toy catalog and review requests</p>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Items</h3>
            <p className="text-3xl font-bold text-santa">{stats.totalItems}</p>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Active Items</h3>
            <p className="text-3xl font-bold text-evergreen">{stats.activeItems}</p>
          </Card>
          <Card>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Categories</h3>
            <p className="text-3xl font-bold text-blueberry">{stats.categories.length}</p>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-8">
        <Button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingItem(null);
            setBulkMode(false);
            setShowToyRequests(false);
          }}
          className="bg-evergreen hover:bg-green-600"
        >
          <FaPlus className="mr-2" />
          {showAddForm ? "Hide Form" : "Add Single Item"}
        </Button>
        <Button
          onClick={() => {
            setBulkMode(!bulkMode);
            setShowAddForm(false);
            setEditingItem(null);
            setShowToyRequests(false);
          }}
          className="bg-blueberry hover:bg-blue-600"
        >
          <FaUpload className="mr-2" />
          {bulkMode ? "Hide Bulk Form" : "Bulk Upload"}
        </Button>
        <Button
          onClick={() => {
            setShowToyRequests(!showToyRequests);
            setShowAddForm(false);
            setBulkMode(false);
            setEditingItem(null);
          }}
          className="bg-berryPink hover:bg-pink-600"
        >
          <FaImage className="mr-2" />
          {showToyRequests ? "Hide Requests" : "View Toy Requests"}
        </Button>
      </div>

      {/* Toy Requests Viewer */}
      {showToyRequests && (
        <div className="mb-8">
          <ToyRequestViewer 
            isOpen={showToyRequests}
            onClose={() => setShowToyRequests(false)}
          />
        </div>
      )}

      {/* Single Item Form */}
      {showAddForm && !editingItem && (
        <Card className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-santa">Add New Item</h2>
            <Button
              onClick={resetForm}
              className="bg-gray-500 hover:bg-gray-600 text-sm"
            >
              <FaTimes className="mr-1" />
              Cancel
            </Button>
          </div>
          <CatalogItemForm
            formData={formData}
            onSubmit={handleCreateSubmit}
            loading={isSubmitting}
            submitLabel="Create Item"
            includeBrandLogoUpload={true}
          />
        </Card>
      )}

      {/* Edit Item Form */}
      {editingItem && (
        <Card className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-santa">Edit Item</h2>
            <Button
              onClick={resetForm}
              className="bg-gray-500 hover:bg-gray-600 text-sm"
            >
              <FaTimes className="mr-1" />
              Cancel
            </Button>
          </div>
          <CatalogItemForm
            formData={formData}
            onSubmit={handleUpdateSubmit}
            loading={isSubmitting}
            submitLabel="Update Item"
            includeBrandLogoUpload={true}
          />
        </Card>
      )}

      {/* Bulk Upload Form */}
      {bulkMode && (
        <Card className="mb-8">
          <h2 className="text-2xl font-bold text-santa mb-4">Bulk Upload Items</h2>
          <BulkItemForm
            items={bulkItems}
            setItems={setBulkItems}
            onSubmit={createBulkItems}
            loading={loading}
          />
        </Card>
      )}

      {/* Search and Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            />
          </div>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          >
            <option value="all">All Genders</option>
            <option value="boy">Boys</option>
            <option value="girl">Girls</option>
            <option value="neutral">Neutral</option>
          </select>
        </div>
        {/* Item Count Display */}
        {!loading && (
          <div className="mt-4 text-sm text-gray-600">
            Showing {items.length} items
            {stats && stats.totalItems > items.length && (
              <span className="text-santa ml-1">
                (of {stats.totalItems} total - increase limit if needed)
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Items List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No items found</div>
        ) : (
          items.map((item) => (
            <Card key={item._id?.toString()} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row gap-4">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full md:w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {item.brand && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {item.brand}
                      </span>
                    )}
                    {item.brandLogoUrl && ( // NEW: Show brand logo indicator
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded flex items-center gap-1">
                        <FaImage className="text-xs" /> Logo
                      </span>
                    )}
                    <span className="px-2 py-1 bg-blueberry/10 text-blueberry text-xs rounded capitalize">
                      {item.gender}
                    </span>
                    {item.price && (
                      <span className="px-2 py-1 bg-evergreen/10 text-evergreen text-xs rounded">
                        ${item.price}
                      </span>
                    )}
                    {!item.isActive && (
                      <span className="px-2 py-1 bg-santa/10 text-santa text-xs rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.description}</p>
                  )}
                </div>
                <div className="flex md:flex-col gap-2">
                  <Button
                    onClick={() => {
                      setEditingItem(item);
                      setShowAddForm(false);
                      setBulkMode(false);
                      setShowToyRequests(false);
                    }}
                    className="bg-blueberry hover:bg-blue-600 text-sm px-3 py-2"
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    onClick={() => deleteItem(item._id!.toString())}
                    className="bg-santa hover:bg-red-600 text-sm px-3 py-2"
                  >
                    <FaTrash />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Container>
  );
}

// Bulk Item Form Component
function BulkItemForm({
  items,
  setItems,
  onSubmit,
  loading
}: {
  items: FormData[];
  setItems: (items: FormData[]) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  const addItem = () => {
    setItems([...items, { ...emptyCatalogFormData }]); // FIX: Use emptyCatalogFormData instead of emptyFormData
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof FormData, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  return (
    <div className="space-y-6 h-[80vh] overflow-y-auto pr-1">
      {items.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Item {index + 1}</h3>
            {items.length > 1 && (
              <Button
                onClick={() => removeItem(index)}
                className="bg-santa hover:bg-red-600 text-xs px-2 py-1"
              >
                <FaTimes />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <input
                type="text"
                placeholder="Title *"
                value={item.title}
                onChange={(e) => updateItem(index, "title", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Brand"
                value={item.brand}
                onChange={(e) => updateItem(index, "brand", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
              />
            </div>
            <div>
              <select
                value={item.gender}
                onChange={(e) => updateItem(index, "gender", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
              >
                <option value="neutral">Neutral</option>
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
              </select>
            </div>
            <div>
              <input
                type="number"
                placeholder="Price"
                value={item.price}
                onChange={(e) =>
                  updateItem(index, "price", e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
                min="0"
                step="0.01"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="url"
                placeholder="Product URL *"
                value={item.productUrl}
                onChange={(e) => updateItem(index, "productUrl", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-4">
        <Button onClick={addItem} className="bg-blueberry hover:bg-blue-600">
          <FaPlus className="mr-2" />
          Add Another Item
        </Button>
        <Button onClick={onSubmit} disabled={loading} className="bg-evergreen hover:bg-green-600">
          <FaSave className="mr-2" />
          {loading ? "Creating Items..." : "Create All Items"}
        </Button>
      </div>
    </div>
  );
}
