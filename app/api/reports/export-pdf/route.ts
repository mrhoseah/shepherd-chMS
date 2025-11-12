import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getJsReportInstance } from "@/lib/reports/jsreport";

/**
 * POST /api/reports/export-pdf
 * Convert HTML content to PDF using jsreport
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { html, filename, options } = body;

    if (!html) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    const jsr = await getJsReportInstance();

    // Generate a unique template name for this export
    const templateName = `export-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create complete HTML document
    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #333;
      background: #fff;
      padding: 20px;
      line-height: 1.6;
    }
    ${options?.styles || ""}
    
    /* Ensure tables render properly */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: #f3f4f6;
      font-weight: 600;
    }
    
    /* Chart containers */
    .recharts-wrapper {
      page-break-inside: avoid;
    }
    
    /* Page breaks */
    @media print {
      .page-break {
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>
    `;

    // Render PDF directly from HTML using chrome-pdf recipe
    const result = await jsr.render({
      template: {
        content: fullHtml,
        engine: "none", // No templating engine, just render HTML
        recipe: "chrome-pdf",
        chrome: {
          landscape: false,
          format: "A4",
          printBackground: true,
          marginTop: options?.marginTop || "20mm",
          marginBottom: options?.marginBottom || "20mm",
          marginLeft: options?.marginLeft || "15mm",
          marginRight: options?.marginRight || "15mm",
          displayHeaderFooter: false,
        },
      },
    });

    // Return PDF as base64
    const pdfBase64 = (result.content as Buffer).toString("base64");

    return NextResponse.json({
      success: true,
      pdf: pdfBase64,
      filename: filename || `report-${new Date().toISOString().split("T")[0]}.pdf`,
    });
  } catch (error: any) {
    console.error("Error generating PDF with jsreport:", error);
    
    // If Chrome/Chromium is not available, return a helpful error message
    if (error.message?.includes("Failed to launch") || error.message?.includes("browser process")) {
      return NextResponse.json(
        { 
          error: "PDF generation requires Chrome/Chromium. Please install required system dependencies or use Excel/CSV export instead.",
          details: "Install dependencies with: sudo apt-get install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 libcairo2"
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

