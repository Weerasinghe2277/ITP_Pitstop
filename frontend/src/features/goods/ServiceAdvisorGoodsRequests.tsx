// src/features/goods/ServiceAdvisorGoodsRequests.tsx
import { useEffect, useState } from "react";
import { http } from "../../lib/http";
import { Link } from "react-router-dom";

export default function ServiceAdvisorGoodsRequests() {
  const [rows, setRows] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [jobIdFilter, setJobIdFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  async function loadJobs() {
    try {
      const response = await http.get('/jobs');
      setJobs(response.data?.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  }

  async function load() {
    setIsLoading(true);
    setMsg({ text: "", type: "" });
    try {
      const params = new URLSearchParams();
      if (jobIdFilter && jobIdFilter !== 'all') params.set("jobId", jobIdFilter);

      // Get all inventory items - we'll use existing inventory endpoint for now
      const response = await http.get(`/goods-requests/my-requests?${params.toString()}`);
      console.log(response.data);
      setRows(response.data?.goodsRequests || response.data || []);
    } catch (error: any) {
      setMsg({ text: error.message || "Failed to load inventory items", type: "error" });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    load();
  }, [jobIdFilter]);

  const filteredRows = rows.filter((item: any) => {
    // console.log(item);
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        item.item.name?.toLowerCase().includes(searchLower) ||
        item.item.itemId?.toLowerCase().includes(searchLower) ||
        item.job.jobId?.toLowerCase().includes(searchLower)
      );
      if (!matchesSearch) return false;
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
      case "in_stock": return { bg: "#d1fae5", text: "#10b981" };
      case "allocated":
      case "low_stock": return { bg: "#fef3c7", text: "#d97706" };
      case "used":
      case "out_of_stock": return { bg: "#fee2e2", text: "#ef4444" };
      case "reserved": return { bg: "#e0e7ff", text: "#6366f1" };
      default: return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  // Styles
  const wrap = {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "20px",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  };

  const card = {
    background: "white",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
    border: "1px solid #e5e7eb",
    marginBottom: "24px",
  };

  return (
    <div style={wrap}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#1f2937",
          margin: 0
        }}>
          Inventory Items
        </h1>

        <div style={{
          display: "flex",
          gap: "12px",
          alignItems: "center"
        }}>
          <div style={{
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: 500
          }}>
            {filteredRows.length} Total Items
          </div>
        </div>
      </div>

      {/* Message */}
      {msg.text && (
        <div style={{
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "16px",
          backgroundColor: msg.type === "error" ? "#fee2e2" : "#d1fae5",
          color: msg.type === "error" ? "#dc2626" : "#065f46",
          border: `1px solid ${msg.type === "error" ? "#fca5a5" : "#a7f3d0"}`
        }}>
          {msg.text}
        </div>
      )}

      {/* Filters */}
      <div style={card}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "16px"
        }}>
          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "6px"
            }}>
              Search Items
            </label>
            <input
              type="text"
              placeholder="Search by item name, item ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px"
              }}
            />
          </div>

          <div>
            <label style={{
              display: "block",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              marginBottom: "6px"
            }}>
              Filter by Job ID
            </label>
            <select
              value={jobIdFilter}
              onChange={(e) => setJobIdFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "white",
                cursor: "pointer"
              }}
            >
              <option value="">All Jobs</option>
              {jobs.map((job: any) => (
                <option key={job._id} value={job.jobId}>
                  {job.jobId} - {job.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={card}>
        {isLoading ? (
          <div style={{
            padding: "60px",
            textAlign: "center",
            color: "#6b7280"
          }}>
            Loading inventory items...
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={{
            padding: "60px",
            textAlign: "center",
            color: "#6b7280"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📦</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 600 }}>
              No Items Found
            </h3>
            <p style={{ margin: 0, fontSize: "14px", marginBottom: "16px" }}>
              No inventory items match your current filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setJobIdFilter("");
                load(); // Reload data with cleared filters
              }}
              style={{
                padding: "10px 16px",
                backgroundColor: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 500
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse"
            }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{
                    padding: "12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "14px",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    Item ID
                  </th>
                  <th style={{
                    padding: "12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "14px",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    Item Name
                  </th>
                  <th style={{
                    padding: "12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "14px",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    Job ID
                  </th>
                  <th style={{
                    padding: "12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "14px",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    Status
                  </th>
                  <th style={{
                    padding: "12px",
                    textAlign: "left",
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "14px",
                    borderBottom: "1px solid #e5e7eb"
                  }}>
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item: any) => {
                  // console.log(item);
                  const statusColor = getStatusColor(item.status);
                  console.log(item);

                  return (
                    <tr key={item._id || item.itemId} style={{
                      borderBottom: "1px solid #e5e7eb"
                    }}>
                      <td style={{
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "#1f2937"
                      }}>
                        {item.item.itemId || 'N/A'}
                      </td>
                      <td style={{
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: 500
                      }}>
                        {item.item.name || 'N/A'}
                      </td>
                      <td style={{
                        padding: "12px",
                        fontSize: "14px",
                        color: "#6b7280"
                      }}>
                        {item.job.jobId || '-'}
                      </td>
                      <td style={{
                        padding: "12px",
                        fontSize: "14px"
                      }}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 500,
                          backgroundColor: statusColor.bg,
                          color: statusColor.text
                        }}>
                          {item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Available'}
                        </span>
                      </td>
                      <td style={{
                        padding: "12px",
                        fontSize: "14px",
                        color: "#374151"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 500 }}>
                            {item.quantity || item.stockLevel || 0}
                          </span>
                          {item.unit && (
                            <span style={{ fontSize: "12px", color: "#6b7280" }}>
                              {item.unit}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}