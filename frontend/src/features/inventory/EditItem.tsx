// src/features/inventory/EditItem.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { http } from "../../lib/http";
import { Enums } from "../../lib/validators";

export default function EditItem() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: Enums.InventoryCategory[0],
    unitPrice: 0,
    unit: Enums.InventoryUnit[0],
    minimumStock: 0,
    currentStock: 0,
    notes: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItem, setIsLoadingItem] = useState(true);

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    setIsLoadingItem(true);
    try {
      const response = await http.get(`/inventory/${id}`);
      const item = response.data?.item;
      console.log(item);
      if (item) {
        setForm({
          name: item.name || "",
          category: item.category || Enums.InventoryCategory[0],
          unitPrice: item.unitPrice || 0,
          unit: item.unit || Enums.InventoryUnit[0],
          minimumStock: item.minimumStock || 0,
          currentStock: item.currentStock || 0,
          notes: item.notes || "",
        });
      }
    } catch (error) {
      console.error("Failed to load item:", error);
      setMessage({ text: "Failed to load item details", type: "error" });
    } finally {
      setIsLoadingItem(false);
    }
  }

  function update(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    if (!form.name.trim()) return "Name is required";
    if (!form.category?.trim()) return "Category is required";
    if (form.unitPrice < 0) return "Unit price must be >= 0";
    if (!form.unit?.trim()) return "Unit is required";
    if (form.minimumStock < 0) return "Reorder level must be >= 0";
    if (form.currentStock < 0) return "Stock must be >= 0";
    return "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setMessage({ text: v, type: "error" });
      return;
    }
    setIsLoading(true);
    setMessage({ text: "", type: "" });
    try {
      await http.patch(`/inventory/${id}`, {
        name: form.name,
        category: form.category,
        unitPrice: form.unitPrice,
        unit: form.unit,
        minimumStock: form.minimumStock,
        currentStock: form.currentStock,
        notes: form.notes,
      });
      setMessage({ text: "✅ Item updated successfully!", type: "success" });
      setTimeout(() => navigate(`/inventory/${id}`), 1500);
    } catch (e: any) {
      console.error("Update failed:", e);
      const msg = e.response?.data?.message || e.message || "Update failed";
      setMessage({ text: `❌ Error: ${msg}`, type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoadingItem) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>
            Loading item details...
          </p>
        </div>
      </div>
    );
  }

  // Professional styling variables
  const containerStyle = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: '#f8fafc',
    minHeight: '100vh'
  };

  const headerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '30px',
    boxShadow: '0 20px 40px -12px rgba(16, 185, 129, 0.25)',
    textAlign: 'center'
  };

  const cardStyle = {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    border: '1px solid #f1f5f9'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 20px',
    fontSize: '16px',
    border: '2px solid #e2e8f0',
    borderRadius: '16px',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const submitBtnStyle = {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '16px',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
    marginRight: '12px'
  };

  const cancelBtnStyle = {
    background: '#f8fafc',
    color: '#6b7280',
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    border: '2px solid #e2e8f0',
    borderRadius: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    display: 'inline-block'
  };

  const messageStyle = {
    padding: '16px 20px',
    borderRadius: '12px',
    marginBottom: '24px',
    fontSize: '14px',
    fontWeight: '500',
    backgroundColor: message.type === "error" ? '#fee2e2' : '#dcfce7',
    color: message.type === "error" ? '#dc2626' : '#166534',
    border: `1px solid ${message.type === "error" ? '#fecaca' : '#bbf7d0'}`
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#ffffff',
          margin: '0 0 12px'
        }}>
          Edit Inventory Item
        </h1>
        <p style={{
          color: '#d1fae5',
          fontSize: '16px',
          margin: 0
        }}>
          Update item details and stock information
        </p>
      </div>

      {/* Form Card */}
      <div style={cardStyle}>
        {message.text && <div style={messageStyle}>{message.text}</div>}

        <form onSubmit={submit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {/* Item Name */}
            <div>
              <label style={labelStyle}>Item Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="Enter item name"
                style={inputStyle}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label style={labelStyle}>Category *</label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                style={inputStyle}
                required
              >
                {Enums.InventoryCategory.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Price */}
            <div>
              <label style={labelStyle}>Unit Price (Rs.) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.unitPrice}
                onChange={(e) => update("unitPrice", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                style={inputStyle}
                required
              />
            </div>

            {/* Unit */}
            <div>
              <label style={labelStyle}>Unit *</label>
              <select
                value={form.unit}
                onChange={(e) => update("unit", e.target.value)}
                style={inputStyle}
                required
              >
                {Enums.InventoryUnit.map(unit => (
                  <option key={unit} value={unit}>
                    {unit.charAt(0).toUpperCase() + unit.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Stock */}
            <div>
              <label style={labelStyle}>Current Stock *</label>
              <input
                type="number"
                min="0"
                value={form.currentStock}
                onChange={(e) => update("currentStock", parseInt(e.target.value) || 0)}
                placeholder="0"
                style={inputStyle}
                required
              />
            </div>

            {/* Reorder Level */}
            <div>
              <label style={labelStyle}>Reorder Level *</label>
              <input
                type="number"
                min="0"
                value={form.minimumStock}
                onChange={(e) => update("minimumStock", parseInt(e.target.value) || 0)}
                placeholder="0"
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Additional notes about this item..."
              style={{
                ...inputStyle,
                minHeight: '120px',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              onClick={() => navigate(`/inventory/${id}`)}
              style={cancelBtnStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={submitBtnStyle}
            >
              {isLoading ? "Updating..." : "Update Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}