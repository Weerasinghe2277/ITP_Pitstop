// src/utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFOptions {
    filename?: string;
    orientation?: 'portrait' | 'landscape';
    format?: 'a4' | 'letter';
    quality?: number;
}

export class PDFGenerator {
    static async generateFromElement(
        element: HTMLElement,
        options: PDFOptions = {}
    ): Promise<void> {
        const {
            filename = `invoice-${Date.now()}.pdf`,
            orientation = 'portrait',
            format = 'a4',
            quality = 0.95
        } = options;

        try {
            console.log('Starting PDF generation...');

            // Ensure element is visible and properly sized
            const originalDisplay = element.style.display;
            const originalPosition = element.style.position;
            const originalLeft = element.style.left;

            // Make element visible for rendering
            element.style.display = 'block';
            element.style.position = 'absolute';
            element.style.left = '0px';
            element.style.top = '0px';
            element.style.zIndex = '9999';
            element.style.background = 'white';

            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                allowTaint: false, // Set to false to avoid tainting canvas
                backgroundColor: '#ffffff',
                logging: false, // Disable logging for better performance
                removeContainer: true,
                width: element.scrollWidth,
                height: element.scrollHeight,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
                onclone: (clonedDoc, element) => {
                    // Ensure all fonts and styles are loaded
                    const clonedElement = element as HTMLElement;
                    clonedElement.style.fontFamily = 'Arial, sans-serif';
                    clonedElement.style.background = 'white';
                    clonedElement.style.color = 'black';
                }
            });

            // Restore original styles
            element.style.display = originalDisplay;
            element.style.position = originalPosition;
            element.style.left = originalLeft;
            element.style.zIndex = '';
            element.style.background = '';

            console.log('Canvas created, generating PDF...');

            const imgData = canvas.toDataURL('image/jpeg', quality);

            const pdf = new jsPDF({
                orientation,
                unit: 'mm',
                format
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = imgHeight / imgWidth;

            let imgPDFWidth = pdfWidth;
            let imgPDFHeight = imgPDFWidth * ratio;

            // If the image height is larger than the PDF height, scale down
            if (imgPDFHeight > pdfHeight) {
                imgPDFHeight = pdfHeight;
                imgPDFWidth = imgPDFHeight / ratio;
            }

            const x = (pdfWidth - imgPDFWidth) / 2;
            const y = (pdfHeight - imgPDFHeight) / 2;

            pdf.addImage(imgData, 'JPEG', x, y, imgPDFWidth, imgPDFHeight);
            pdf.save(filename);

            console.log('PDF generated successfully');

        } catch (error) {
            console.error('Error generating PDF:', error);
            throw new Error('Failed to generate PDF. Please try the print function instead.');
        }
    }

    static async generateInvoicePDF(
        invoiceData: any,
        bookingData: any,
        jobData: any,
        options: PDFOptions = {}
    ): Promise<void> {
        try {
            // Try to use the visible element first
            const visibleElement = document.getElementById('printable-invoice');
            if (visibleElement) {
                await this.generateFromElement(visibleElement, options);
                return;
            }

            // Fallback: create temporary element
            await this.generateFromHTML(invoiceData, bookingData, jobData, options);
        } catch (error) {
            console.error('Error in generateInvoicePDF:', error);
            throw error;
        }
    }

    private static async generateFromHTML(
        invoiceData: any,
        bookingData: any,
        jobData: any,
        options: PDFOptions
    ): Promise<void> {
        // Create a temporary container
        const tempContainer = document.createElement('div');
        tempContainer.id = 'temp-pdf-container';
        tempContainer.innerHTML = this.generateInvoiceHTML(invoiceData, bookingData, jobData);

        // Style the container for PDF generation
        tempContainer.style.width = '210mm';
        tempContainer.style.minHeight = '297mm';
        tempContainer.style.padding = '20mm';
        tempContainer.style.background = 'white';
        tempContainer.style.color = 'black';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '0';
        tempContainer.style.top = '0';
        tempContainer.style.zIndex = '9999';

        document.body.appendChild(tempContainer);

        try {
            await this.generateFromElement(tempContainer, options);
        } finally {
            // Clean up
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
        }
    }

    private static generateInvoiceHTML(invoice: any, booking: any, job: any): string {
        const formatMoney = (n: number) => {
            if (typeof n !== "number" || !Number.isFinite(n)) return "—";
            try {
                return n.toLocaleString("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 2 });
            } catch {
                return `LKR ${n.toFixed(2)}`;
            }
        };

        const formatDate = (dateString?: string) => {
            if (!dateString) return "—";
            return new Date(dateString).toLocaleDateString('en-LK', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        };

        return `
      <div style="font-family: Arial, sans-serif; color: black; background: white; padding: 20px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid black;">
          <div style="flex: 1;">
            <h1 style="font-size: 24px; font-weight: bold; color: #2c5530; margin: 0 0 8px 0;">AutoCare Center</h1>
            <p style="font-size: 14px; color: #666; margin: 0 0 4px 0;">Professional Automotive Services</p>
            <div style="font-size: 12px; color: #666; line-height: 1.4;">
              <div>123 Garage Lane, Colombo 05</div>
              <div>Sri Lanka</div>
              <div>Phone: +94 11 234 5678</div>
              <div>Email: info@autocare.lk</div>
            </div>
          </div>
          
          <div style="text-align: right; flex: 1;">
            <h2 style="font-size: 28px; font-weight: bold; color: #1a365d; margin: 0 0 8px 0;">INVOICE</h2>
            <div style="font-size: 14px; color: #666; line-height: 1.6;">
              <div><strong>Invoice No:</strong> ${invoice.invoiceId || invoice._id}</div>
              <div><strong>Date Issued:</strong> ${formatDate(invoice.createdAt)}</div>
              <div><strong>Status:</strong> ${invoice.status || 'DRAFT'}</div>
            </div>
          </div>
        </div>

        <!-- Customer & Service Details -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px;">
          <div>
            <h3 style="font-size: 16px; font-weight: bold; color: #2d3748; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #ccc;">Bill To</h3>
            <div style="font-size: 14px; line-height: 1.6;">
              <div><strong>Name:</strong> ${invoice.customer?.profile?.firstName || invoice.customer?.name || "N/A"}</div>
              <div><strong>Email:</strong> ${invoice.customer?.email || "N/A"}</div>
              <div><strong>Phone:</strong> ${invoice.customer?.phone || "N/A"}</div>
            </div>
          </div>
          
          <div>
            <h3 style="font-size: 16px; font-weight: bold; color: #2d3748; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #ccc;">Service Details</h3>
            <div style="font-size: 14px; line-height: 1.6;">
              <div><strong>Booking ID:</strong> ${booking?.bookingId || "N/A"}</div>
              <div><strong>Job ID:</strong> ${job?.jobId || "N/A"}</div>
              <div><strong>Service Type:</strong> ${booking?.serviceType || "N/A"}</div>
              <div><strong>Payment Method:</strong> ${invoice.paymentMethod || "N/A"}</div>
            </div>
          </div>
        </div>

        <!-- Items Table -->
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 16px; font-weight: bold; color: #2d3748; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #ccc;">Invoice Items</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="text-align: left; padding: 10px; border-bottom: 2px solid #ccc; font-weight: bold;">Description</th>
                <th style="text-align: center; padding: 10px; border-bottom: 2px solid #ccc; font-weight: bold; width: 60px;">Qty</th>
                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ccc; font-weight: bold; width: 100px;">Unit Price</th>
                <th style="text-align: right; padding: 10px; border-bottom: 2px solid #ccc; font-weight: bold; width: 100px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(invoice.items || []).map((item: any) => `
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; vertical-align: top;">
                    <div style="font-weight: 500;">${item.description}</div>
                    ${item.note ? `<div style="color: #666; margin-top: 2px; font-size: 11px;">${item.note}</div>` : ''}
                  </td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(item.unitPrice)}</td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${formatMoney(item.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totals -->
        <div style="width: 300px; margin-left: auto; margin-top: 20px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ccc;">
            <span style="font-weight: bold;">Subtotal:</span>
            <span>${formatMoney(invoice.subtotal || 0)}</span>
          </div>
          
          ${invoice.laborCharges && invoice.laborCharges > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ccc;">
              <span style="font-weight: bold;">Labor Charges:</span>
              <span>${formatMoney(invoice.laborCharges)}</span>
            </div>
          ` : ''}
          
          ${invoice.tax && invoice.tax > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ccc;">
              <span style="font-weight: bold;">Tax:</span>
              <span>${formatMoney(invoice.tax)}</span>
            </div>
          ` : ''}
          
          ${invoice.discount && invoice.discount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ccc;">
              <span style="font-weight: bold;">Discount:</span>
              <span style="color: #e53e3e;">-${formatMoney(invoice.discount)}</span>
            </div>
          ` : ''}
          
          <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #000; font-size: 16px; font-weight: bold;">
            <span>TOTAL:</span>
            <span>${formatMoney(invoice.total)}</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 11px; color: #666;">
          <div style="text-align: center; margin-top: 20px; font-style: italic;">
            Thank you for your business!
          </div>
        </div>
      </div>
    `;
    }
}