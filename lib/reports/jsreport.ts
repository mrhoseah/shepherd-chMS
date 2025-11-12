// Use dynamic imports to avoid bundling issues
let jsreportInstance: any = null;
let jsreportModule: any = null;
let chromePdfModule: any = null;
let handlebarsModule: any = null;

/**
 * Initialize jsreport instance
 * This can be used in server-side code
 */
export async function getJsReportInstance() {
  // Ensure we're on the server
  if (typeof window !== "undefined") {
    throw new Error("jsreport can only be used on the server side");
  }

  if (jsreportInstance) {
    return jsreportInstance;
  }

  try {
    // Dynamically import jsreport modules
    if (!jsreportModule) {
      jsreportModule = await import("@jsreport/jsreport-core");
    }
    if (!chromePdfModule) {
      chromePdfModule = await import("@jsreport/jsreport-chrome-pdf");
    }
    if (!handlebarsModule) {
      handlebarsModule = await import("@jsreport/jsreport-handlebars");
    }

    // Initialize jsreport with in-memory store (no file system needed for inline rendering)
    const jsreport = jsreportModule.default || jsreportModule;
    jsreportInstance = jsreport();

    // Add extensions
    const chromePdf = chromePdfModule.default || chromePdfModule;
    const handlebars = handlebarsModule.default || handlebarsModule;
    
    // Configure Chrome PDF with options that work better in headless environments
    jsreportInstance.use(chromePdf({
      launchOptions: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      },
    }));
    jsreportInstance.use(handlebars());

    await jsreportInstance.init();

    return jsreportInstance;
  } catch (error) {
    console.error("Failed to initialize jsreport:", error);
    throw error;
  }
}

/**
 * Generate PDF report from template
 */
export async function generatePDFReport(
  templateName: string,
  data: any,
  options?: {
    templateContent?: string;
    templateEngine?: string;
  }
): Promise<Buffer> {
  const jsr = await getJsReportInstance();

  try {
    // Check if template exists, if not create it
    let template;
    try {
      template = await jsr.documentStore.collection("templates").findOne({
        name: templateName,
      });
    } catch (e) {
      // Template doesn't exist, will create below
    }

    // If template doesn't exist and templateContent is provided, create it
    if (!template && options?.templateContent) {
      template = await jsr.documentStore.collection("templates").insert({
        name: templateName,
        content: options.templateContent,
        engine: options.templateEngine || "handlebars",
        recipe: "chrome-pdf",
        chrome: {
          landscape: false,
          format: "A4",
          printBackground: true,
          marginTop: "20mm",
          marginBottom: "20mm",
          marginLeft: "15mm",
          marginRight: "15mm",
        },
      });
    }

    if (!template) {
      throw new Error(`Template ${templateName} not found`);
    }

    // Generate report
    const result = await jsr.render({
      template: {
        name: templateName,
      },
      data,
    });

    return result.content as Buffer;
  } catch (error) {
    console.error("Error generating PDF report:", error);
    throw error;
  }
}

/**
 * Generate report and return as base64 string (for API responses)
 */
export async function generatePDFReportBase64(
  templateName: string,
  data: any,
  options?: {
    templateContent?: string;
    templateEngine?: string;
  }
): Promise<string> {
  const buffer = await generatePDFReport(templateName, data, options);
  return buffer.toString("base64");
}

