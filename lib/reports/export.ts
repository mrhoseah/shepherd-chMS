import * as XLSX from "xlsx";

interface ExportData {
  headers: string[];
  rows: (string | number)[][];
  title?: string;
}

/**
 * Export HTML element to PDF using jsreport
 */
export async function exportToPDF(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Element not found");
  }

  try {
    // Clone the element to avoid modifying the original
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // Extract and inline styles
    inlineStyles(clonedElement);
    
    // Get the HTML content
    const html = clonedElement.outerHTML;

    // Show loading indicator
    const loadingMessage = document.createElement("div");
    loadingMessage.id = "pdf-export-loading";
    loadingMessage.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px 40px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      font-family: Arial, sans-serif;
    `;
    loadingMessage.textContent = "Generating PDF...";
    document.body.appendChild(loadingMessage);

    // Call API to generate PDF using jsreport
    const response = await fetch("/api/reports/export-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        filename,
        options: {},
      }),
    });

    // Remove loading indicator
    document.body.removeChild(loadingMessage);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate PDF");
    }

    const data = await response.json();

    // Convert base64 to blob and download
    const byteCharacters = atob(data.pdf);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.filename || `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error: any) {
    // Remove loading indicator if it exists
    const loading = document.getElementById("pdf-export-loading");
    if (loading) {
      document.body.removeChild(loading);
    }
    console.error("Error generating PDF:", error);
    
    // Show user-friendly error message
    const errorMsg = error.message || "Failed to generate PDF";
    if (errorMsg.includes("Chrome/Chromium") || errorMsg.includes("browser process")) {
      alert("PDF generation is currently unavailable. Please use Excel or CSV export instead, or contact your administrator to install required system dependencies.");
    } else {
      alert(errorMsg);
    }
    throw new Error(errorMsg);
  }
}

/**
 * Inline computed styles into elements for better PDF rendering
 */
function inlineStyles(element: HTMLElement) {
  const allElements = element.querySelectorAll("*");
  
  // Process all elements
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlEl);
    
    // Get important style properties
    const importantStyles = [
      "color",
      "backgroundColor",
      "fontSize",
      "fontFamily",
      "fontWeight",
      "padding",
      "margin",
      "border",
      "borderColor",
      "textAlign",
      "display",
      "width",
      "height",
    ];
    
    const inlineStyles: string[] = [];
    importantStyles.forEach((prop) => {
      const value = computedStyle.getPropertyValue(prop);
      if (value) {
        const cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
        inlineStyles.push(`${cssProp}: ${value}`);
      }
    });
    
    if (inlineStyles.length > 0) {
      htmlEl.setAttribute("style", inlineStyles.join("; "));
    }
  });
}


export function exportToCSV(data: ExportData) {
  const headers = data.headers.join(",");
  const rows = data.rows.map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${data.title || "report"}-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToExcel(data: ExportData) {
  const worksheet = XLSX.utils.aoa_to_sheet([data.headers, ...data.rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, data.title || "Sheet1");
  XLSX.writeFile(
    workbook,
    `${data.title || "report"}-${new Date().toISOString().split("T")[0]}.xlsx`
  );
}

