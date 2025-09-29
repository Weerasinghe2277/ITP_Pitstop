// src/features/invoices/InvoiceDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../../lib/http";
import PrintableInvoice from "./PrintableInvoice";
import { PDFGenerator } from "../../utils/pdfGenerator";

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

export default function InvoiceDetail() {
    const { id } = useParams<{ id: string }>();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [booking, setBooking] = useState<any>(null);
    const [job, setJob] = useState<any>(null);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [showPrintView, setShowPrintView] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

    useEffect(() => {
        let ignore = false;
        async function load() {
            setIsLoading(true);
            setMessage({ text: "", type: "" });
            try {
                const response = await http.get(`/invoices/${id}`);
                if (!ignore) {
                    const invoiceData = response.data?.invoice || null;
                    setInvoice(invoiceData);

                    if (invoiceData) {
                        await loadAdditionalData(invoiceData);
                    }
                }
            } catch (e: any) {
                if (!ignore) setMessage({ text: e.message || "Failed to load invoice", type: "error" });
            } finally {
                if (!ignore) setIsLoading(false);
            }
        }
        load();
        return () => { ignore = true; };
    }, [id]);

    async function loadAdditionalData(invoiceData: Invoice) {
        try {
            if (invoiceData.booking) {
                const bookingResponse = await http.get(`/bookings/${invoiceData.booking}`);
                setBooking(bookingResponse.data?.booking || null);
            }

            if (invoiceData.job) {
                const jobResponse = await http.get(`/jobs/${invoiceData.job}`);
                setJob(jobResponse.data?.job || null);
            }
        } catch (error) {
            console.warn("Failed to load additional data:", error);
        }
    }

    function handlePrint() {
        setShowPrintView(true);
        setTimeout(() => {
            window.print();
            // Return to normal view after printing
            setTimeout(() => setShowPrintView(false), 500);
        }, 500);
    }

    async function handleDownloadPDF() {
        if (!invoice) return;

        setIsGeneratingPDF(true);
        setMessage({ text: "", type: "" });

        try {
            await PDFGenerator.generateInvoicePDF(invoice, booking, job, {
                filename: `invoice-${invoice.invoiceId || invoice._id}.pdf`,
                orientation: 'portrait',
                format: 'a4',
                quality: 1
            });

            // Show success message
            setMessage({
                text: 'PDF downloaded successfully!',
                type: 'success'
            });

            // Clear message after 3 seconds
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);

        } catch (error: any) {
            console.error('PDF generation error:', error);
            setMessage({
                text: error.message || 'Failed to generate PDF. Please try again.',
                type: 'error'
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    }

    // Alternative method: Download PDF from current visible element
    async function handleDownloadPDFFromElement() {
        if (!invoice) return;

        setIsGeneratingPDF(true);
        setMessage({ text: "", type: "" });

        try {
            const element = document.getElementById('printable-invoice');
            if (element) {
                await PDFGenerator.generateFromElement(element, {
                    filename: `invoice-${invoice.invoiceId || invoice._id}.pdf`,
                    orientation: 'portrait',
                    format: 'a4',
                    quality: 1
                });

                setMessage({
                    text: 'PDF downloaded successfully!',
                    type: 'success'
                });
                setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            } else {
                throw new Error('Could not find invoice element');
            }
        } catch (error: any) {
            setMessage({
                text: error.message || 'Failed to generate PDF. Please try again.',
                type: 'error'
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    }

    // Print-specific styles
    const printStyles = `
    @media print {
      @page {
        margin: 0.5in;
        size: A4;
      }
      
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background: white !important;
      }
      
      .no-print {
        display: none !important;
      }
      
      .print-only {
        display: block !important;
      }
      
      .invoice-print-container {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }
    }
    
    @media screen {
      .print-only {
        display: none !important;
      }
    }
  `;

    const containerStyle = {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "20px",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f8fafc',
        minHeight: '100vh'
    };

    const actionButtonStyle = {
        padding: "12px 20px",
        backgroundColor: "white",
        color: "#475569",
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        fontSize: "14px",
        fontWeight: 600,
        textDecoration: "none",
        cursor: "pointer",
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        marginRight: '12px'
    };

    const loadingContainerStyle = {
        background: "white",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        color: "#64748b",
        fontSize: '16px'
    };

    const messageStyle = {
        padding: "16px 20px",
        borderRadius: "12px",
        marginBottom: "20px",
        fontWeight: 500,
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
    };

    // If we're showing print view, render the printable component
    if (showPrintView && invoice) {
        return (
            <div className="print-only invoice-print-container">
                <style>{printStyles}</style>
                <PrintableInvoice invoice={invoice} booking={booking} job={job} />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={containerStyle}>
                <div style={loadingContainerStyle}>
                    <div style={{
                        width: 20,
                        height: 20,
                        border: "2px solid #e2e8f0",
                        borderTop: "2px solid #3b82f6",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite"
                    }} />
                    <span>Loading invoice details...</span>
                </div>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div style={containerStyle}>
                <div style={{
                    ...messageStyle,
                    backgroundColor: "#fef2f2",
                    color: "#991b1b",
                    border: "2px solid #fecaca"
                }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: "#ef4444",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        !
                    </div>
                    {message.text || "Invoice not found"}
                </div>
                <Link to="/invoices" style={{
                    ...actionButtonStyle,
                    backgroundColor: "#3b82f6",
                    color: "white",
                    borderColor: "#2563eb"
                }}>
                    ← Back to Invoices
                </Link>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <style>{printStyles}</style>

            {/* Action Buttons - Hidden in print */}
            <div className="no-print" style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginBottom: "20px",
                flexWrap: "wrap"
            }}>
                <Link
                    to="/invoices"
                    style={actionButtonStyle}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'white';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                >
                    ← Back to List
                </Link>
                <button
                    onClick={handlePrint}
                    style={{
                        ...actionButtonStyle,
                        backgroundColor: "#10b981",
                        color: "white",
                        borderColor: "#059669"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#059669';
                        e.currentTarget.style.borderColor = '#047857';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#10b981';
                        e.currentTarget.style.borderColor = '#059669';
                    }}
                >
                    🖨️ Print Invoice
                </button>
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    style={{
                        ...actionButtonStyle,
                        backgroundColor: isGeneratingPDF ? "#9ca3af" : "#ef4444",
                        color: "white",
                        borderColor: isGeneratingPDF ? "#6b7280" : "#dc2626",
                        cursor: isGeneratingPDF ? 'not-allowed' : 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        if (!isGeneratingPDF) {
                            e.currentTarget.style.backgroundColor = '#dc2626';
                            e.currentTarget.style.borderColor = '#b91c1c';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isGeneratingPDF) {
                            e.currentTarget.style.backgroundColor = '#ef4444';
                            e.currentTarget.style.borderColor = '#dc2626';
                        }
                    }}
                >
                    {isGeneratingPDF ? (
                        <>
                            <div style={{
                                width: 16,
                                height: 16,
                                border: "2px solid transparent",
                                borderTop: "2px solid white",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                            }} />
                            Generating PDF...
                        </>
                    ) : (
                        '📄 Download PDF'
                    )}
                </button>
            </div>

            {/* Message */}
            {message.text && (
                <div style={{
                    ...messageStyle,
                    backgroundColor: message.type === "error" ? "#fef2f2" : "#f0fdf4",
                    color: message.type === "error" ? "#991b1b" : "#166534",
                    border: `2px solid ${message.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                }}>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: message.type === "error" ? "#ef4444" : "#10b981",
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        {message.type === "error" ? '!' : '✓'}
                    </div>
                    {message.text}
                </div>
            )}

            {/* Regular invoice view for screen */}
            <div
                id="printable-invoice"
                className="no-print"
                style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "24px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    border: "1px solid #e2e8f0",
                    marginBottom: "24px",
                }}
            >
                <PrintableInvoice invoice={invoice} booking={booking} job={job} />
            </div>

            {/* Removed the bottom action buttons section */}

            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .no-print {
            flex-direction: column;
            align-items: stretch;
          }
          
          .no-print button, .no-print a {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
        </div>
    );
}