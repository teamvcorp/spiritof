'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ImageUpload from '@/components/ui/ImageUpload';
import { MasterCatalogItem, CatalogGender } from '@/models/MasterCatalog';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUpload, FaSave, FaTimes, FaImage } from 'react-icons/fa';
import Container from '@/components/ui/Container';

const ADMIN_PASSWORD = 'admin123'; // In production, this should be from env or secure auth

interface CatalogStats {
  totalItems: number;
  activeItems: number;
  categories: string[];
}

interface FormData {
  title: string;
  brand: string;
  category: string;
  gender: CatalogGender;
  ageMin: number | '';
  ageMax: number | '';
  price: number | '';
  retailer: string;
  productUrl: string;
  imageUrl: string;
  sku: string;
  tags: string;
  popularity: number | '';
  sourceType: 'manual' | 'curated' | 'live_search' | 'trending';
  isActive: boolean;
}

const emptyFormData: FormData = {
  title: '',
  brand: '',
  category: '',
  gender: 'neutral',
  ageMin: '',
  ageMax: '',
  price: '',
  retailer: '',
  productUrl: '',
  imageUrl: '',
  sku: '',
  tags: '',
  popularity: '',
  sourceType: 'manual',
  isActive: true,
};

export default function CatalogManagerPage() {
  const [items, setItems] = useState<MasterCatalogItem[]>([]);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterCatalogItem | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkItems, setBulkItems] = useState<FormData[]>([emptyFormData]);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/catalog-manager', {
        headers: { 'X-Admin-Password': ADMIN_PASSWORD },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (genderFilter !== 'all') params.append('gender', genderFilter);
      params.append('limit', '200');

      const response = await fetch(`/api/admin/catalog-manager/items?${params}`, {
        headers: { 'X-Admin-Password': ADMIN_PASSWORD },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
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
    category: form.category || undefined,
    gender: form.gender,
    ageMin: form.ageMin === '' ? undefined : Number(form.ageMin),
    ageMax: form.ageMax === '' ? undefined : Number(form.ageMax),
    price: form.price === '' ? undefined : Number(form.price),
    retailer: form.retailer || undefined,
    productUrl: form.productUrl,
    imageUrl: form.imageUrl || undefined,
    sku: form.sku || undefined,
    tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
    popularity: form.popularity === '' ? undefined : Number(form.popularity),
    sourceType: form.sourceType,
    isActive: form.isActive,
  });

  // Create single item
  const createItem = async (formData: FormData) => {
    try {
      const response = await fetch('/api/admin/catalog-manager/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': ADMIN_PASSWORD,
        },
        body: JSON.stringify(formToApiData(formData)),
      });

      if (response.ok) {
        await fetchItems();
        await fetchStats();
        return true;
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error creating item:', error);
      alert('Failed to create item');
      return false;
    }
  };

  // Update item
  const updateItem = async (id: string, formData: FormData) => {
    try {
      const response = await fetch(`/api/admin/catalog-manager/items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': ADMIN_PASSWORD,
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
      console.error('Error updating item:', error);
      alert('Failed to update item');
      return false;
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/admin/catalog-manager/items/${id}`, {
        method: 'DELETE',
        headers: { 'X-Admin-Password': ADMIN_PASSWORD },
      });

      if (response.ok) {
        await fetchItems();
        await fetchStats();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-green-50 p-4">
      <Container className="">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-paytone-one text-evergreen mb-2">
            Master Catalog Manager
          </h1>
          <p className="text-gray-600">
            Manually manage the gift catalog that children can search and request from
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-evergreen">{stats.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-blueberry">{stats.activeItems}</div>
              <div className="text-sm text-gray-600">Active Items</div>
            </Card>
            <Card className="text-center p-4">
              <div className="text-2xl font-bold text-santa">{stats.categories.length}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </Card>
          </div>
        )}

        {/* Controls */}
        <Card className="p-4 mb-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent"
                />
              </div>

              {/* Gender Filter */}
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen focus:border-transparent"
              >
                <option value="all">All Genders</option>
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowAddForm(true);
                  setBulkMode(false);
                }}
                className="bg-evergreen hover:bg-green-600"
              >
                <FaPlus className="mr-2" />
                Add Item
              </Button>
              <Button
                onClick={() => {
                  setBulkMode(true);
                  setShowAddForm(true);
                }}
                className="bg-blueberry hover:bg-blue-600"
              >
                <FaUpload className="mr-2" />
                Bulk Add
              </Button>
            </div>
          </div>
        </Card>

        {/* Add/Edit Forms */}
        {showAddForm && (
          <Card className="p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {bulkMode ? 'Bulk Add Items' : 'Add New Item'}
              </h2>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setBulkMode(false);
                  setBulkItems([emptyFormData]);
                }}
                className="bg-gray-500 hover:bg-gray-600"
              >
                <FaTimes />
              </Button>
            </div>

            {bulkMode ? (
              <BulkItemForm
                items={bulkItems}
                setItems={setBulkItems}
                onSubmit={createBulkItems}
                loading={loading}
              />
            ) : (
              <SingleItemForm
                formData={emptyFormData}
                onSubmit={(data) => {
                  createItem(data).then((success) => {
                    if (success) setShowAddForm(false);
                  });
                }}
                loading={loading}
              />
            )}
          </Card>
        )}

        {/* Edit Form */}
        {editingItem && (
          <Card className="p-6 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Item</h2>
              <Button
                onClick={() => setEditingItem(null)}
                className="bg-gray-500 hover:bg-gray-600"
              >
                <FaTimes />
              </Button>
            </div>
            <SingleItemForm
              formData={{
                title: editingItem.title,
                brand: editingItem.brand || '',
                category: editingItem.category || '',
                gender: editingItem.gender,
                ageMin: editingItem.ageMin || '',
                ageMax: editingItem.ageMax || '',
                price: editingItem.price || '',
                retailer: editingItem.retailer || '',
                productUrl: editingItem.productUrl,
                imageUrl: editingItem.imageUrl || '',
                sku: editingItem.sku || '',
                tags: editingItem.tags?.join(', ') || '',
                popularity: editingItem.popularity || '',
                sourceType: editingItem.sourceType,
                isActive: editingItem.isActive,
              }}
              onSubmit={(data) => updateItem(editingItem._id!.toString(), data)}
              loading={loading}
            />
          </Card>
        )}

        {/* Items Table */}
        <Container>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Catalog Items ({items.length})</h2>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No items found. {searchTerm || genderFilter !== 'all' ? 'Try adjusting your filters.' : 'Add some items to get started.'}
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left p-2 font-semibold text-gray-700 bg-gray-100 w-16">Image</th>
                      <th className="text-left p-2 font-semibold text-gray-700 bg-gray-100">Title</th>
                      <th className="text-left p-2 font-semibold text-gray-700 bg-gray-100 w-20">Gender</th>
                      <th className="text-left p-2 font-semibold text-gray-700 bg-gray-100 w-20">Price</th>
                      <th className="text-left p-2 font-semibold text-gray-700 bg-gray-100 w-20">Status</th>
                      <th className="text-left p-2 font-semibold text-gray-700 bg-gray-100 w-20">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item._id?.toString()} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                        <td className="p-2">
                          {item.imageUrl || item.blobUrl ? (
                            <img
                              src={item.blobUrl || item.imageUrl}
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded-lg shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                              <FaImage className="text-gray-400 text-sm" />
                            </div>
                          )}
                        </td>
                        <td className="p-2">
                          <div className="font-medium text-gray-900">
                            <div className="truncate max-w-[300px]" title={item.title}>{item.title}</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {item.brand && <span>Brand: {item.brand}</span>}
                            {item.brand && item.category && <span> • </span>}
                            {item.category && <span>Cat: {item.category}</span>}
                          </div>
                          {item.sku && (
                            <div className="text-xs text-gray-400">SKU: {item.sku}</div>
                          )}
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.gender === 'boy' ? 'bg-blue-100 text-blue-800' :
                              item.gender === 'girl' ? 'bg-pink-100 text-pink-800' :
                                'bg-gray-100 text-gray-800'
                            }`}>
                            {item.gender}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="font-medium text-gray-900">
                            {item.price ? `$${item.price.toFixed(2)}` : '-'}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="bg-blueberry hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-colors"
                              title="Edit Item"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteItem(item._id!.toString())}
                              className="bg-santa hover:bg-red-600 text-white text-xs px-2 py-1 rounded transition-colors"
                              title="Delete Item"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Container>
      </Container>
    </div>
  );
}

// Single Item Form Component
function SingleItemForm({
  formData,
  onSubmit,
  loading
}: {
  formData: FormData;
  onSubmit: (data: FormData) => void;
  loading: boolean;
}) {
  const [data, setData] = useState<FormData>(formData);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'X-Admin-Password': ADMIN_PASSWORD,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setData(prev => ({ ...prev, imageUrl: result.url }));
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.title || !data.productUrl) {
      alert('Title and Product URL are required');
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            value={data.title}
            onChange={(e) => setData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Brand</label>
          <input
            type="text"
            value={data.brand}
            onChange={(e) => setData(prev => ({ ...prev, brand: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            type="text"
            value={data.category}
            onChange={(e) => setData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Gender *</label>
          <select
            value={data.gender}
            onChange={(e) => setData(prev => ({ ...prev, gender: e.target.value as CatalogGender }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          >
            <option value="neutral">Neutral</option>
            <option value="boy">Boy</option>
            <option value="girl">Girl</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Age Min</label>
          <input
            type="number"
            value={data.ageMin}
            onChange={(e) => setData(prev => ({ ...prev, ageMin: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            min="0"
            max="18"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Age Max</label>
          <input
            type="number"
            value={data.ageMax}
            onChange={(e) => setData(prev => ({ ...prev, ageMax: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            min="0"
            max="18"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price ($)</label>
          <input
            type="number"
            value={data.price}
            onChange={(e) => setData(prev => ({ ...prev, price: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Retailer</label>
          <input
            type="text"
            value={data.retailer}
            onChange={(e) => setData(prev => ({ ...prev, retailer: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">SKU</label>
          <input
            type="text"
            value={data.sku}
            onChange={(e) => setData(prev => ({ ...prev, sku: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Popularity (0-100)</label>
          <input
            type="number"
            value={data.popularity}
            onChange={(e) => setData(prev => ({ ...prev, popularity: e.target.value === '' ? '' : Number(e.target.value) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
            min="0"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Source Type</label>
          <select
            value={data.sourceType}
            onChange={(e) => setData(prev => ({ ...prev, sourceType: e.target.value as FormData['sourceType'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          >
            <option value="manual">Manual</option>
            <option value="curated">Curated</option>
            <option value="live_search">Live Search</option>
            <option value="trending">Trending</option>
          </select>
        </div>

        <div className="flex items-center">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={data.isActive}
              onChange={(e) => setData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="form-checkbox text-evergreen"
            />
            <span className="text-sm font-medium">Active</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Product URL *</label>
        <input
          type="url"
          value={data.productUrl}
          onChange={(e) => setData(prev => ({ ...prev, productUrl: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Image</label>
        <div className="space-y-2">
          <input
            type="url"
            value={data.imageUrl}
            onChange={(e) => setData(prev => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="Image URL or upload below..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
          />
          <ImageUpload
            onUpload={handleImageUpload}
            uploading={uploadingImage}
            currentImage={data.imageUrl}
            isAdminMode={true}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={data.tags}
          onChange={(e) => setData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="toy, educational, electronic"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading || uploadingImage}
          className="bg-evergreen hover:bg-green-600"
        >
          <FaSave className="mr-2" />
          {loading ? 'Saving...' : 'Save Item'}
        </Button>
      </div>
    </form>
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
    setItems([...items, { ...emptyFormData }]);
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
                onChange={(e) => updateItem(index, 'title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Brand"
                value={item.brand}
                onChange={(e) => updateItem(index, 'brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-evergreen"
              />
            </div>
            <div>
              <select
                value={item.gender}
                onChange={(e) => updateItem(index, 'gender', e.target.value)}
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
                  updateItem(index, 'price', e.target.value === '' ? '' : Number(e.target.value))
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
                onChange={(e) => updateItem(index, 'productUrl', e.target.value)}
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
          {loading ? 'Creating Items...' : 'Create All Items'}
        </Button>
      </div>
    </div>
  );

}
