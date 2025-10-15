// src/features/inventory/InventoryList.jsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";

interface InventoryItem {
    _id: string;
    itemId: string;
    name: string;
    category: string;
    unitPrice: number;
    currentStock: number;
    minimumStock: number;
    unit: string;
    status: string;
}

interface Stats {
    total: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
}

export default function InventoryList() {
    const [rows, setRows] = useState<InventoryItem[]>([]);
    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [stockFilter, setStockFilter] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [msg, setMsg] = useState({ text: "", type: "" });
    const [stats, setStats] = useState<Stats>({
        total: 0,
        lowStock: 0,
        outOfStock: 0,
        totalValue: 0
    });

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [totalItems, setTotalItems] = useState(0);

    // Debounce search input
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 400);
        return () => clearTimeout(t);
    }, [q]);

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedQ, selectedCategory, stockFilter]);

    // Fetch data when filters or page change
    useEffect(() => {
        let isCancelled = false;
        async function load() {
            setIsLoading(true);
            setMsg({ text: "", type: "" });
            try {
                const params = new URLSearchParams();
                if (debouncedQ) params.set('search', debouncedQ);
                if (selectedCategory) params.set('category', selectedCategory);
                if (stockFilter === 'low') params.set('lowStock', 'true');

                // Add pagination params - request a large limit to get all items
                params.set('limit', '1000'); // Request up to 1000 items
                params.set('page', '1');

                const path = debouncedQ
                    ? `/inventory/search?q=${encodeURIComponent(debouncedQ)}&${params.toString()}`
                    : `/inventory?${params.toString()}`;

                const r = await http.get(path);
                if (!isCancelled) {
                    const items = r.data?.items || [];

                    // Apply client-side filtering
                    let filteredItems = items;
                    if (stockFilter === 'out') {
                        filteredItems = items.filter((item: InventoryItem) => item.currentStock === 0);
                    } else if (stockFilter === 'low') {
                        filteredItems = items.filter((item: InventoryItem) =>
                            item.currentStock > 0 && item.currentStock <= (item.minimumStock || 10)
                        );
                    }

                    // Calculate stats from all items
                    const totalItemsCount = items.length;
                    const lowStock = items.filter((item: InventoryItem) =>
                        item.currentStock > 0 && item.currentStock <= (item.minimumStock || 10)
                    ).length;
                    const outOfStock = items.filter((item: InventoryItem) => item.currentStock === 0).length;
                    const totalValue = items.reduce((sum: number, item: InventoryItem) =>
                        sum + (item.currentStock * item.unitPrice || 0), 0
                    );

                    setStats({ total: totalItemsCount, lowStock, outOfStock, totalValue });
                    setTotalItems(filteredItems.length);

                    // Apply client-side pagination
                    const startIdx = (currentPage - 1) * itemsPerPage;
                    const endIdx = startIdx + itemsPerPage;
                    const paginatedItems = filteredItems.slice(startIdx, endIdx);

                    setRows(paginatedItems);
                }
            } catch (e: any) {
                if (!isCancelled) setMsg({ text: e.message || "Failed to load inventory", type: "error" });
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        }
        load();
        return () => {
            isCancelled = true;
        };
    }, [debouncedQ, selectedCategory, stockFilter, currentPage, itemsPerPage]);

    // Delete item function
    async function handleDelete(id: string) {
        if (!window.confirm("Are you sure you want to delete this item?")) return;
        setIsLoading(true);
        setMsg({ text: "", type: "" });
        try {
            await http.delete(`/inventory/${id}`);
            setRows((prev: any[]) => prev.filter((item) => item._id !== id));
            setTotalItems(prev => prev - 1);
            setMsg({ text: "Item deleted successfully", type: "success" });
        } catch (e: any) {
            setMsg({ text: e.message || "Failed to delete item", type: "error" });
        } finally {
            setIsLoading(false);
        }
    }

    // Get stock status for an item
    function getStockStatus(item: any) {
        if (item.currentStock === 0) return { status: 'out', label: 'Out of Stock', color: 'danger' };
        if (item.currentStock <= (item.minimumStock || 10)) return { status: 'low', label: 'Low Stock', color: 'warning' };
        return { status: 'good', label: 'In Stock', color: 'success' };
    }

    // Helper functions
    function fmtCurrency(n: any) {
        if (typeof n !== "number") return "—";
        try {
            return n.toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 });
        } catch {
            return `LKR ${n.toFixed(2)}`;
        }
    }

    // Pagination calculations
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    // Categories for filter buttons
    const categories = ['parts', 'fluids', 'tools', 'consumables'];

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
                {/* Header with Stats */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '24px',
                        flexWrap: 'wrap' as const,
                        gap: '16px'
                    }}>
                        <div>
                            <h1 style={{
                                fontSize: '32px',
                                fontWeight: 700,
                                color: '#1f2937',
                                margin: 0,
                                marginBottom: '8px'
                            }}>
                                📦 Inventory Management
                            </h1>
                            <p style={{ color: '#6b7280', margin: 0, fontSize: '16px' }}>
                                Manage your inventory items and track stock levels
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                            <Link
                                to="/inventory/new"
                                style={{
                                    padding: '12px 20px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ➕ Add Item
                            </Link>
                            <Link
                                to="/inventory/low"
                                style={{
                                    padding: '12px 20px',
                                    backgroundColor: '#f59e0b',
                                    color: 'white',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                ⚠️ Low Stock
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            padding: '20px',
                            borderRadius: '12px',
                            color: 'white',
                            textAlign: 'center' as const
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                                {stats.total}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Items</div>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            padding: '20px',
                            borderRadius: '12px',
                            color: 'white',
                            textAlign: 'center' as const
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                                {stats.lowStock}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Low Stock</div>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            padding: '20px',
                            borderRadius: '12px',
                            color: 'white',
                            textAlign: 'center' as const
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                                {stats.outOfStock}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Out of Stock</div>
                        </div>
                        <div style={{
                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                            padding: '20px',
                            borderRadius: '12px',
                            color: 'white',
                            textAlign: 'center' as const
                        }}>
                            <div style={{ fontSize: '28px', fontWeight: 700, marginBottom: '4px' }}>
                                {fmtCurrency(stats.totalValue)}
                            </div>
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>Total Value</div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}>
                    {/* Search */}
                    <div style={{ marginBottom: '20px' }}>
                        <input
                            placeholder="🔍 Search items, categories, or IDs..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px 20px',
                                border: '2px solid #e5e7eb',
                                borderRadius: '12px',
                                fontSize: '16px',
                                backgroundColor: '#f9fafb',
                                transition: 'all 0.2s',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Category Filters */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#374151'
                        }}>
                            Filter by Category:
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                            <button
                                onClick={() => setSelectedCategory("")}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    backgroundColor: selectedCategory === "" ? '#3b82f6' : '#f3f4f6',
                                    color: selectedCategory === "" ? 'white' : '#374151',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                All
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        backgroundColor: selectedCategory === cat ? '#3b82f6' : '#f3f4f6',
                                        color: selectedCategory === cat ? 'white' : '#374151',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        textTransform: 'capitalize' as const
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stock Filters */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#374151'
                        }}>
                            Filter by Stock Status:
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                            {[
                                { value: "", label: "All Stock", icon: "📦" },
                                { value: "low", label: "Low Stock", icon: "⚠️" },
                                { value: "out", label: "Out of Stock", icon: "❌" }
                            ].map(filter => (
                                <button
                                    key={filter.value}
                                    onClick={() => setStockFilter(filter.value)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: 'none',
                                        backgroundColor: stockFilter === filter.value ? '#3b82f6' : '#f3f4f6',
                                        color: stockFilter === filter.value ? 'white' : '#374151',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    {filter.icon} {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Items per page selector */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '16px',
                        borderTop: '1px solid #e5e7eb'
                    }}>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            Showing {startItem}-{endItem} of {totalItems} items
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '14px', color: '#6b7280' }}>Items per page:</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: '2px solid #e5e7eb',
                                    fontSize: '14px',
                                    backgroundColor: 'white',
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value={6}>6</option>
                                <option value={12}>12</option>
                                <option value={24}>24</option>
                                <option value={48}>48</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Loading indicator */}
                {isLoading && (
                    <div style={{
                        textAlign: 'center' as const,
                        padding: '40px',
                        background: 'white',
                        borderRadius: '16px',
                        marginBottom: '24px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            display: 'inline-block',
                            width: '40px',
                            height: '40px',
                            border: '4px solid #f3f4f6',
                            borderTop: '4px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: '12px'
                        }} />
                        <div style={{ color: '#6b7280', fontSize: '16px' }}>Loading inventory...</div>
                    </div>
                )}

                {/* Message */}
                {msg.text && (
                    <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        marginBottom: '24px',
                        backgroundColor: msg.type === "error" ? '#fef2f2' : '#f0fdf4',
                        color: msg.type === "error" ? '#991b1b' : '#166534',
                        border: `2px solid ${msg.type === "error" ? '#fecaca' : '#bbf7d0'}`,
                        fontSize: '14px',
                        fontWeight: 500
                    }}>
                        {msg.type === "success" ? "✅" : "❌"} {msg.text}
                    </div>
                )}

                {/* Items Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '20px',
                    marginBottom: '24px'
                }}>
                    {rows.length === 0 && !isLoading && (
                        <div style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center' as const,
                            padding: '60px',
                            background: 'white',
                            borderRadius: '16px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                            <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '8px' }}>
                                No inventory items found
                            </div>
                            <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                                Try adjusting your search or filters
                            </div>
                        </div>
                    )}

                    {rows.map((item) => {
                        const stockStatus = getStockStatus(item);
                        return (
                            <div key={item._id} style={{
                                background: 'white',
                                borderRadius: '16px',
                                padding: '20px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                                border: '1px solid #f3f4f6',
                                transition: 'all 0.2s',
                                position: 'relative' as const
                            }}>
                                {/* Stock Status Badge */}
                                <div style={{ position: 'absolute' as const, top: '16px', right: '16px' }}>
                                    <StatusBadge value={stockStatus.status} size="small" title={stockStatus.label} />
                                </div>

                                {/* Item Header */}
                                <div style={{ marginBottom: '16px', paddingRight: '60px' }}>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '18px',
                                        fontWeight: 700,
                                        color: '#111827',
                                        marginBottom: '4px',
                                        lineHeight: '1.3'
                                    }}>
                                        {item.name}
                                    </h3>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '14px',
                                        color: '#6b7280'
                                    }}>
                                        <span style={{
                                            backgroundColor: '#f3f4f6',
                                            padding: '2px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}>
                                            {item.itemId}
                                        </span>
                                        <span>•</span>
                                        <span style={{ textTransform: 'capitalize' as const }}>
                                            {item.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Item Details */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '16px',
                                    marginBottom: '20px'
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            textTransform: 'uppercase' as const,
                                            letterSpacing: '0.05em',
                                            marginBottom: '4px'
                                        }}>
                                            Price per {item.unit}
                                        </div>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            color: '#111827'
                                        }}>
                                            {fmtCurrency(item.unitPrice)}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#6b7280',
                                            textTransform: 'uppercase' as const,
                                            letterSpacing: '0.05em',
                                            marginBottom: '4px'
                                        }}>
                                            Current Stock
                                        </div>
                                        <div style={{
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            color: stockStatus.status === 'out_of_stock' ? '#ef4444' :
                                                stockStatus.status === 'low_stock' ? '#f59e0b' : '#10b981'
                                        }}>
                                            {item.currentStock} {item.unit}
                                        </div>
                                    </div>
                                </div>

                                {/* Stock Level Bar */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{
                                        height: '6px',
                                        backgroundColor: '#f3f4f6',
                                        borderRadius: '3px',
                                        overflow: 'hidden' as const
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            backgroundColor:
                                                stockStatus.status === 'out_of_stock' ? '#ef4444' :
                                                    stockStatus.status === 'low_stock' ? '#f59e0b' : '#10b981',
                                            width: `${Math.min(100, (item.currentStock / Math.max(item.minimumStock || 10, 1)) * 100)}%`,
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        marginTop: '4px',
                                        textAlign: 'right' as const
                                    }}>
                                        Min: {item.minimumStock || 10} {item.unit}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const }}>
                                    <Link
                                        to={`/inventory/${item._id}`}
                                        style={{
                                            flex: 1,
                                            padding: '10px 16px',
                                            backgroundColor: '#3b82f6',
                                            color: 'white',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            textAlign: 'center' as const,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        👁️ View
                                    </Link>
                                    <Link
                                        to={`/inventory/${item._id}/edit`}
                                        style={{
                                            flex: 1,
                                            padding: '10px 16px',
                                            backgroundColor: '#f59e0b',
                                            color: 'white',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            textAlign: 'center' as const,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        ✏️ Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        disabled={isLoading}
                                        style={{
                                            padding: '10px 12px',
                                            backgroundColor: '#ef4444',
                                            color: 'white',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            opacity: isLoading ? 0.5 : 1
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap' as const
                    }}>
                        {/* Previous Button */}
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: currentPage === 1 ? '#f3f4f6' : '#3b82f6',
                                color: currentPage === 1 ? '#9ca3af' : 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            ◀ Previous
                        </button>

                        {/* Page Numbers */}
                        {getPageNumbers().map((page, idx) => {
                            if (page === '...') {
                                return (
                                    <span key={`ellipsis-${idx}`} style={{
                                        padding: '10px 12px',
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        fontWeight: 600
                                    }}>
                                        ...
                                    </span>
                                );
                            }

                            return (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page as number)}
                                    style={{
                                        padding: '10px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        backgroundColor: currentPage === page ? '#3b82f6' : '#f3f4f6',
                                        color: currentPage === page ? 'white' : '#374151',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        minWidth: '44px'
                                    }}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        {/* Next Button */}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: currentPage === totalPages ? '#f3f4f6' : '#3b82f6',
                                color: currentPage === totalPages ? '#9ca3af' : 'white',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            Next ▶
                        </button>
                    </div>
                )}

                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        
                        button:hover:not(:disabled), a:hover {
                            transform: translateY(-1px);
                            box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
                        }
                        
                        button:disabled {
                            cursor: not-allowed;
                        }
                        
                        input:focus, select:focus {
                            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
                            border-color: #3b82f6 !important;
                        }
                    `}
                </style>
            </div>
        </div>
    );
}