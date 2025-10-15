// src/features/invoices/PrintableInvoice.tsx
import React from 'react';

interface Invoice {
    _id: string;
    invoiceId?: string;
    booking?: any;
    job?: any;
    customer?: {
        _id: string;
        name?: string;
        email?: string;
        phone?: string;
        profile?: {
            firstName?: string;
            lastName?: string;
        };
    };
    items?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
        type?: string;
        note?: string;
    }>;
    laborCharges?: number;
    subtotal?: number;
    tax?: number;
    discount?: number;
    total: number;
    paymentMethod?: string;
    status?: string;
    paymentStatus?: string;
    createdAt?: string;
    updatedAt?: string;
}

interface PrintableInvoiceProps {
    invoice: Invoice;
    booking?: any;
    job?: any;
}

const PrintableInvoice: React.FC<PrintableInvoiceProps> = ({ invoice, booking, job }) => {
    function toMoney(n: number) {
        if (typeof n !== "number" || !Number.isFinite(n)) return "—";
        try {
            return n.toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 });
        } catch {
            return `LKR ${n.toFixed(2)}`;
        }
    }

    function formatDate(dateString?: string) {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString('en-LK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    const statusBadgeStyle = (status?: string) => {
        const statusColors: any = {
            paid: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
            pending: { bg: '#fff3cd', text: '#856404', border: '#ffeaa7' },
            draft: { bg: '#e2e3e5', text: '#383d41', border: '#d6d8db' },
            cancelled: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
        };

        const colors = statusColors[status?.toLowerCase() || 'draft'] || statusColors.draft;

        return {
            display: "inline-block",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            backgroundColor: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
            marginBottom: "8px"
        };
    };

    return (
        <div style={{
            padding: '20px',
            fontFamily: '"Helvetica Neue", Arial, sans-serif',
            maxWidth: '210mm',
            margin: '0 auto',
            backgroundColor: 'white',
            color: '#000'
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "30px",
                paddingBottom: "20px",
                borderBottom: "2px solid #000"
            }}>
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#2c5530", margin: "0 0 8px 0" }}>
                        AutoCare Center
                    </h1>
                    <p style={{ fontSize: "14px", color: "#666", margin: "0 0 4px 0" }}>
                        Professional Automotive Services
                    </p>
                    <div style={{ fontSize: "13px", color: "#666", lineHeight: "1.4" }}>
                        <div>123 Garage Lane, Colombo 05</div>
                        <div>Sri Lanka</div>
                        <div>Phone: +94 11 234 5678</div>
                        <div>Email: info@autocare.lk</div>
                        <div>VAT: GB123456789</div>
                    </div>
                </div>

                <div style={{ textAlign: 'right', flex: 1 }}>
                    <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#1a365d", margin: "0 0 8px 0" }}>
                        INVOICE
                    </h2>
                    <div style={statusBadgeStyle(invoice.status)}>
                        {invoice.status?.toUpperCase() || 'DRAFT'}
                    </div>
                    <div style={{ fontSize: "14px", color: "#666", lineHeight: "1.6" }}>
                        <div><strong>Invoice No:</strong> {invoice.invoiceId || invoice._id}</div>
                        <div><strong>Date Issued:</strong> {formatDate(invoice.createdAt)}</div>
                        <div><strong>Due Date:</strong> {formatDate(invoice.createdAt)}</div>
                    </div>
                </div>
            </div>

            {/* Bill To / Service Details */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "30px",
                marginBottom: "25px"
            }}>
                <div>
                    <h3 style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#2d3748",
                        margin: "0 0 12px 0",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #e2e8f0"
                    }}>
                        Bill To
                    </h3>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: "8px 16px",
                        alignItems: "center"
                    }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>
              Customer:
            </span>
                        <span style={{ fontSize: "14px", fontWeight: 600 }}>
              {invoice.customer?.profile?.firstName || invoice.customer?.name || "N/A"}
            </span>

                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>
              Email:
            </span>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{invoice.customer?.email || "N/A"}</span>

                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>
              Phone:
            </span>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{invoice.customer?.phone || "N/A"}</span>
                    </div>
                </div>

                <div>
                    <h3 style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "#2d3748",
                        margin: "0 0 12px 0",
                        paddingBottom: "8px",
                        borderBottom: "1px solid #e2e8f0"
                    }}>
                        Service Details
                    </h3>
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: "auto 1fr",
                        gap: "8px 16px",
                        alignItems: "center"
                    }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>
              Booking ID:
            </span>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{booking?.bookingId || "N/A"}</span>

                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>
              Job ID:
            </span>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{job?.jobId || "N/A"}</span>

                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>
              Service Type:
            </span>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{booking?.serviceType || "N/A"}</span>

                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>
              Payment Method:
            </span>
                        <span style={{ fontSize: "14px", fontWeight: 500, textTransform: 'capitalize' }}>
              {invoice.paymentMethod || "N/A"}
            </span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: "25px" }}>
                <h3 style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#2d3748",
                    margin: "0 0 12px 0",
                    paddingBottom: "8px",
                    borderBottom: "1px solid #e2e8f0"
                }}>
                    Invoice Items
                </h3>
                <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
                    <thead>
                    <tr>
                        <th style={{
                            textAlign: "left",
                            padding: "12px 8px",
                            fontSize: "12px",
                            color: "#718096",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: "#f7fafc",
                            borderBottom: "2px solid #e2e8f0",
                            fontWeight: 700
                        }}>Description</th>
                        <th style={{
                            textAlign: 'center',
                            padding: "12px 8px",
                            fontSize: "12px",
                            color: "#718096",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: "#f7fafc",
                            borderBottom: "2px solid #e2e8f0",
                            fontWeight: 700,
                            width: '80px'
                        }}>Qty</th>
                        <th style={{
                            textAlign: 'right',
                            padding: "12px 8px",
                            fontSize: "12px",
                            color: "#718096",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: "#f7fafc",
                            borderBottom: "2px solid #e2e8f0",
                            fontWeight: 700,
                            width: '120px'
                        }}>Unit Price</th>
                        <th style={{
                            textAlign: 'right',
                            padding: "12px 8px",
                            fontSize: "12px",
                            color: "#718096",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: "#f7fafc",
                            borderBottom: "2px solid #e2e8f0",
                            fontWeight: 700,
                            width: '120px'
                        }}>Amount</th>
                    </tr>
                    </thead>
                    <tbody>
                    {invoice.items?.map((item, index) => (
                        <tr key={index}>
                            <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf2f7", fontSize: "13px", verticalAlign: "top" }}>
                                <div style={{ fontWeight: 500 }}>{item.description}</div>
                                {item.note && (
                                    <div style={{ fontSize: "11px", color: "#718096", marginTop: "2px" }}>
                                        {item.note}
                                    </div>
                                )}
                            </td>
                            <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf2f7", fontSize: "13px", verticalAlign: "top", textAlign: 'center' }}>
                                {item.quantity}
                            </td>
                            <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf2f7", fontSize: "13px", verticalAlign: "top", textAlign: 'right' }}>
                                {toMoney(item.unitPrice)}
                            </td>
                            <td style={{ padding: "12px 8px", borderBottom: "1px solid #edf2f7", fontSize: "13px", verticalAlign: "top", textAlign: 'right', fontWeight: 600 }}>
                                {toMoney(item.total)}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div style={{ width: "300px", marginLeft: "auto", marginTop: "20px" }}>
                {(invoice.subtotal && invoice.subtotal > 0) && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>Subtotal:</span>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{toMoney(invoice.subtotal)}</span>
                    </div>
                )}

                {invoice.laborCharges && invoice.laborCharges > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>Labor Charges:</span>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{toMoney(invoice.laborCharges)}</span>
                    </div>
                )}

                {invoice.tax && invoice.tax > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>Tax:</span>
                        <span style={{ fontSize: "14px", fontWeight: 500 }}>{toMoney(invoice.tax)}</span>
                    </div>
                )}

                {invoice.discount && invoice.discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#718096", textTransform: 'uppercase' }}>Discount:</span>
                        <span style={{ fontSize: "14px", fontWeight: 500, color: '#e53e3e' }}>-{toMoney(invoice.discount)}</span>
                    </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderTop: "2px solid #2d3748", borderBottom: "none" }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#2d3748" }}>TOTAL:</span>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "#2d3748" }}>
            {toMoney(invoice.total)}
          </span>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e2e8f0", fontSize: "12px", color: "#718096" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px" }}>
                    <div style={{ textAlign: 'center' }}>
                        <strong>Terms & Conditions:</strong>
                        <div>All repairs are guaranteed for 90 days.</div>
                        <div>Payment due upon receipt.</div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: "20px", fontStyle: 'italic' }}>
                    Thank you for your business!
                </div>
            </div>

            {/* Signature Area */}
            <div style={{ marginTop: "60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: "1px solid #000", width: "200px", marginBottom: "8px" }}></div>
                    <div style={{ fontSize: "12px", color: "#718096" }}>Customer Signature</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: "1px solid #000", width: "200px", marginBottom: "8px" }}></div>
                    <div style={{ fontSize: "12px", color: "#718096" }}>Authorized Signature</div>
                </div>
            </div>
        </div>
    );
};

export default PrintableInvoice;