import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

// Increase timeout for this route (max 300 seconds in Next.js)
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

// POST - Generate printable QR codes in A4 format for stickers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { qrCodes, layout = "2x3" } = body; // layout: "2x3" (6 per page) or "3x4" (12 per page)

    if (!qrCodes || !Array.isArray(qrCodes) || qrCodes.length === 0) {
      return NextResponse.json(
        { error: "QR codes array is required" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    console.log(`[QR Print] Starting PDF generation for ${qrCodes.length} QR codes`);

    // Fetch QR code data from database (minimal query - include qrCodeData to reuse if available)
    const qrCodeIds = qrCodes.map((qc: any) => qc.id || qc);
    const dbQrCodes = await prisma.givingQRCode.findMany({
      where: {
        id: { in: qrCodeIds },
      },
      select: {
        id: true,
        amount: true,
        category: true,
        qrCodeUrl: true,
        qrCodeData: true, // Reuse existing QR code image if available
      },
    });

    console.log(`[QR Print] Fetched ${dbQrCodes.length} QR codes from database (${Date.now() - startTime}ms)`);

    // Generate QR code images in optimized batches
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    
    // Process QR codes in smaller batches to avoid memory issues
    const BATCH_SIZE = 15; // Increased batch size slightly
    const qrCodeData: any[] = [];
    const qrGenStartTime = Date.now();
    
    for (let i = 0; i < dbQrCodes.length; i += BATCH_SIZE) {
      const batch = dbQrCodes.slice(i, i + BATCH_SIZE);
      const batchStartTime = Date.now();
      
      const batchResults = await Promise.all(
        batch.map(async (qrCode) => {
          // Get paymentMethod - might not be in Prisma type if client is outdated
          const paymentMethod = (qrCode as any).paymentMethod || "MPESA";
          
          // Determine scan URL based on payment method
          let scanUrl: string;
          if (paymentMethod === "PAYPAL") {
            scanUrl = `${baseUrl}/give/paypal?qrCodeId=${qrCode.id}`;
          } else {
            // M-Pesa: use the stored qrCodeUrl or generate from QR code data
            const qrData = qrCode.qrCodeUrl || JSON.stringify({
              type: "mpesa_giving",
              qrCodeId: qrCode.id,
              amount: qrCode.amount,
              category: qrCode.category,
            });
            scanUrl = `${baseUrl}/give/qr?data=${encodeURIComponent(qrData)}`;
          }

          // Reuse existing QR code image if available and valid, otherwise generate new one
          let qrImage: string;
          if (qrCode.qrCodeData && qrCode.qrCodeData.startsWith('data:image')) {
            // Reuse existing QR code image - much faster than regenerating
            // The PDF renderer will handle sizing appropriately
            qrImage = qrCode.qrCodeData;
          } else {
            // Generate new QR code with optimized settings for print quality
            qrImage = await QRCode.toDataURL(scanUrl, {
              width: 300, // Higher resolution for better print quality
              margin: 2, // Adequate margin for scanning
              errorCorrectionLevel: "M", // Medium error correction for reliability
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            });
          }
          
          return {
            id: qrCode.id,
            amount: qrCode.amount ? parseFloat(qrCode.amount.toString()) : null,
            category: qrCode.category || "TITHE",
            paymentMethod,
            currency: paymentMethod === "PAYPAL" ? "$" : "KES",
            instructions: paymentMethod === "PAYPAL" ? "Scan to give via PayPal" : "Scan to give via M-Pesa",
            qrImage,
            scanUrl,
          };
        })
      );
      qrCodeData.push(...batchResults);
      console.log(`[QR Print] Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(dbQrCodes.length / BATCH_SIZE)} (${Date.now() - batchStartTime}ms)`);
    }
    
    console.log(`[QR Print] Generated all QR code images (${Date.now() - qrGenStartTime}ms)`);

    // Determine grid layout
    const [rows, cols] = layout === "3x4" ? [3, 4] : [2, 3];
    const perPage = rows * cols;

    // Split into pages
    const pages: typeof qrCodeData[] = [];
    for (let i = 0; i < qrCodeData.length; i += perPage) {
      pages.push(qrCodeData.slice(i, i + perPage));
    }

    console.log(`[QR Print] Starting PDF rendering with jspdf (${pages.length} pages)`);
    const pdfStartTime = Date.now();

    // A4 dimensions in mm (portrait)
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;
    const MARGIN = 10; // 10mm margin for better spacing
    const GAP = 5; // 5mm gap between stickers
    const USABLE_WIDTH = A4_WIDTH - (MARGIN * 2);
    const USABLE_HEIGHT = A4_HEIGHT - (MARGIN * 2);
    
    // Calculate sticker dimensions with better proportions
    const STICKER_WIDTH = (USABLE_WIDTH - (GAP * (cols - 1))) / cols;
    const STICKER_HEIGHT = (USABLE_HEIGHT - (GAP * (rows - 1))) / rows;
    
    // QR code size - optimized for better visibility and scanning
    const QR_SIZE = Math.min(STICKER_WIDTH * 0.50, STICKER_HEIGHT * 0.40);
    
    // Padding inside each sticker
    const STICKER_PADDING = 3;
    
    // Create PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Helper function to draw dashed border
    const drawDashedRect = (x: number, y: number, w: number, h: number) => {
      const dashLength = 2;
      const gapLength = 2;
      const totalLength = dashLength + gapLength;
      
      // Top and bottom
      for (let i = x; i < x + w; i += totalLength) {
        const endX = Math.min(i + dashLength, x + w);
        doc.line(i, y, endX, y);
        doc.line(i, y + h, endX, y + h);
      }
      
      // Left and right
      for (let i = y; i < y + h; i += totalLength) {
        const endY = Math.min(i + dashLength, y + h);
        doc.line(x, i, x, endY);
        doc.line(x + w, i, x + w, endY);
      }
    };

    // Process each page
    pages.forEach((page, pageIndex) => {
      if (pageIndex > 0) {
        doc.addPage();
      }

      // Draw each QR code sticker on the page
      page.forEach((qrCode, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        // Calculate position
        const x = MARGIN + (col * (STICKER_WIDTH + GAP));
        const y = MARGIN + (row * (STICKER_HEIGHT + GAP));
        
        // Draw border (dashed) - lighter gray
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        drawDashedRect(x, y, STICKER_WIDTH, STICKER_HEIGHT);
        
        // Content area (with padding)
        const contentX = x + STICKER_PADDING;
        const contentY = y + STICKER_PADDING;
        const contentWidth = STICKER_WIDTH - (STICKER_PADDING * 2);
        const contentHeight = STICKER_HEIGHT - (STICKER_PADDING * 2);
        const centerX = x + STICKER_WIDTH / 2;
        
        // Calculate vertical spacing - better balanced layout
        let currentY = contentY + 2;
        
        // Church name - smaller, subtle header
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(120, 120, 120);
        doc.text('Eastgate Chapel', centerX, currentY, { align: 'center' });
        currentY += 3.5;
        
        // Divider line - subtle separator
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.15);
        const lineY = currentY - 0.5;
        const lineWidth = Math.min(25, contentWidth * 0.6);
        doc.line(centerX - lineWidth / 2, lineY, centerX + lineWidth / 2, lineY);
        currentY += 3;
        
        // Amount - prominent and eye-catching
        doc.setFontSize(15);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        const amountText = qrCode.amount 
          ? `${qrCode.currency} ${qrCode.amount.toLocaleString()}`
          : 'Any Amount';
        doc.text(amountText, centerX, currentY, { align: 'center' });
        currentY += 5.5;
        
        // Category badge - styled label
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        const categoryText = (qrCode.category || 'TITHE').replace(/_/g, ' ');
        doc.text(categoryText.toUpperCase(), centerX, currentY, { align: 'center' });
        currentY += 5;
        
        // QR Code image - centered with white background for contrast
        const qrX = centerX - (QR_SIZE / 2);
        const qrY = currentY;
        
        // White background for QR code (ensures good contrast)
        const qrPadding = 1.5;
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.1);
        doc.rect(
          qrX - qrPadding, 
          qrY - qrPadding, 
          QR_SIZE + (qrPadding * 2), 
          QR_SIZE + (qrPadding * 2), 
          'FD'
        );
        
        // Convert base64 data URL to image data
        const imageData = qrCode.qrImage;
        if (imageData && imageData.startsWith('data:image')) {
          try {
            doc.addImage(imageData, 'PNG', qrX, qrY, QR_SIZE, QR_SIZE, undefined, 'FAST');
          } catch (error) {
            console.error(`[QR Print] Error adding image for QR code ${qrCode.id}:`, error);
          }
        }
        currentY += QR_SIZE + 3;
        
        // Instructions - smaller, at bottom, with proper wrapping
        doc.setFontSize(6);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(130, 130, 130);
        const maxInstructionsY = y + STICKER_HEIGHT - 2;
        const instructionsText = qrCode.instructions;
        
        // Split long instructions into multiple lines if needed
        const words = instructionsText.split(' ');
        let line = '';
        let instructionsY = Math.min(currentY, maxInstructionsY);
        const lineHeight = 3;
        
        words.forEach((word) => {
          const testLine = line + (line ? ' ' : '') + word;
          const testWidth = doc.getTextWidth(testLine);
          if (testWidth > contentWidth - 6 && line) {
            doc.text(line, centerX, instructionsY, { align: 'center' });
            line = word;
            instructionsY += lineHeight;
            if (instructionsY > maxInstructionsY) return;
          } else {
            line = testLine;
          }
        });
        if (line && instructionsY <= maxInstructionsY) {
          doc.text(line, centerX, instructionsY, { align: 'center' });
        }
      });
    });

    console.log(`[QR Print] PDF rendered (${Date.now() - pdfStartTime}ms)`);

    // Get PDF as base64
    const pdfBase64 = Buffer.from(doc.output('arraybuffer')).toString('base64');
    
    const totalTime = Date.now() - startTime;
    console.log(`[QR Print] Total generation time: ${totalTime}ms for ${qrCodeData.length} QR codes`);

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: `qr-codes-${new Date().toISOString().split("T")[0]}.pdf`,
      pages: pages.length,
      totalQRCodes: qrCodeData.length,
    });
  } catch (error: any) {
    console.error("Error generating printable QR codes:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate printable QR codes" },
      { status: 500 }
    );
  }
}

