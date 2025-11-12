import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir, unlink, readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Helper function to extract text from XML using multiple methods
function extractTextFromXml(xml: string): string[] {
  const texts: string[] = [];
  
  // Method 1: Extract from <a:t> tags (most common in PowerPoint)
  // Handle both with and without namespace prefixes
  const textPatterns = [
    /<a:t[^>]*>([^<]*)<\/a:t>/gi,
    /<[^:]*:t[^>]*>([^<]*)<\/[^:]*:t>/gi,
    /<t[^>]*>([^<]*)<\/t>/gi,
  ];
  
  for (const pattern of textPatterns) {
    const matches = xml.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 0) {
        let text = match[1];
        // Decode XML entities
        text = text
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
          .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
        if (text.trim().length > 0 && !texts.includes(text)) {
          texts.push(text.trim());
        }
      }
    }
  }
  
  // Method 2: Extract from paragraph structures
  if (texts.length === 0) {
    const paraPatterns = [
      /<a:p[^>]*>([\s\S]*?)<\/a:p>/gi,
      /<[^:]*:p[^>]*>([\s\S]*?)<\/[^:]*:p>/gi,
    ];
    
    for (const pattern of paraPatterns) {
      const paraMatches = xml.matchAll(pattern);
      for (const paraMatch of paraMatches) {
        if (paraMatch[1]) {
          const paraTexts = extractTextFromXml(paraMatch[1]);
          paraTexts.forEach((text) => {
            if (!texts.includes(text)) {
              texts.push(text);
            }
          });
        }
      }
    }
  }
  
  // Method 3: Extract any text content between tags (fallback)
  if (texts.length === 0) {
    const allTextMatches = xml.match(/>([^<]+)</g) || [];
    for (const match of allTextMatches) {
      const textMatch = match.match(/>([^<]+)</);
      if (textMatch && textMatch[1]) {
        let text = textMatch[1].trim();
        // Skip if it's just whitespace or XML-like content
        if (text.length > 0 && !text.startsWith("<?") && !text.startsWith("<!") && !texts.includes(text)) {
          text = text
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
          if (text.trim().length > 0) {
            texts.push(text.trim());
          }
        }
      }
    }
  }
  
  return [...new Set(texts)].filter((t) => t.trim().length > 0);
}

// Manual PPTX parser using JSZip
async function parsePptxFileManual(filePath: string): Promise<any> {
  try {
    console.log("Loading JSZip library...");
    const JSZip = (await import("jszip")).default;
    console.log("Reading file:", filePath);
    const fileBuffer = await readFile(filePath);
    console.log("File size:", fileBuffer.length, "bytes");
    
    console.log("Loading ZIP archive...");
    const zip = await JSZip.loadAsync(fileBuffer);
    console.log("ZIP loaded successfully");
    
    const slides: any[] = [];
    
    // Get all slide files (ppt/slides/slide1.xml, slide2.xml, etc.)
    const allFiles = Object.keys(zip.files);
    console.log("Total files in ZIP:", allFiles.length);
    console.log("Sample files:", allFiles.slice(0, 10));
    
    const slideFiles = allFiles.filter(
      (name) => name.startsWith("ppt/slides/slide") && name.endsWith(".xml")
    );
    
    console.log("Found slide files:", slideFiles.length, slideFiles);
    
    // If no slides found in ppt/slides/, try alternative paths
    if (slideFiles.length === 0) {
      // Try alternative paths
      const altSlideFiles = allFiles.filter(
        (name) => name.includes("slide") && name.endsWith(".xml")
      );
      console.log("Trying alternative paths, found:", altSlideFiles.length, altSlideFiles);
      if (altSlideFiles.length > 0) {
        slideFiles.push(...altSlideFiles);
      }
    }
    
    if (slideFiles.length === 0) {
      throw new Error("No slide files found in PowerPoint archive");
    }
    
    // Sort slides by number
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || "0");
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || "0");
      return numA - numB;
    });
    
    console.log("Processing", slideFiles.length, "slides...");
    
    for (let i = 0; i < slideFiles.length; i++) {
      const slideFile = slideFiles[i];
      try {
        console.log(`Processing slide ${i + 1}/${slideFiles.length}: ${slideFile}`);
        const slideXml = await zip.files[slideFile].async("string");
        console.log(`Slide XML length: ${slideXml.length} characters`);
        
        // Extract text using improved extraction function
        const texts = extractTextFromXml(slideXml);
        console.log(`Found ${texts.length} text elements in slide ${i + 1}`);
        
        if (texts.length > 0) {
          // First text element is usually the title, rest is content
          const title = texts[0].substring(0, 100) || `Slide ${slides.length + 1}`;
          const content = texts.slice(1).join("\n").substring(0, 2000) || "";
          
          slides.push({
            title: title.trim() || `Slide ${slides.length + 1}`,
            content: content.trim() || "",
            text: texts,
          });
          console.log(`Successfully extracted slide ${i + 1}: "${title.trim() || `Slide ${slides.length + 1}`}"`);
        } else {
          // If no text found, create a placeholder slide but still count it as a slide
          console.log(`No text found in slide ${i + 1}, creating placeholder`);
          slides.push({
            title: `Slide ${slides.length + 1}`,
            content: "",
            text: [],
          });
        }
      } catch (slideError: any) {
        console.error(`Error parsing slide ${slideFile}:`, slideError);
        console.error("Slide error details:", {
          message: slideError.message,
          stack: slideError.stack,
        });
        // Create a placeholder slide even if parsing fails
        slides.push({
          title: `Slide ${slides.length + 1}`,
          content: "Error extracting content from this slide",
          text: [],
        });
      }
    }
    
    console.log(`Successfully parsed ${slides.length} slides total`);
    
    // Always return at least one slide
    if (slides.length === 0) {
      slides.push({
        title: "Imported Presentation",
        content: "The PowerPoint file was uploaded but no content could be extracted. Please add your slides manually.",
        text: [],
      });
    }
    
    return { slides };
  } catch (error: any) {
    console.error("Manual PPTX parsing error:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    throw error;
  }
}

// Dynamic import for PowerPoint parsers
async function parsePptxFile(filePath: string): Promise<any> {
  // First try manual parsing (most reliable)
  try {
    console.log("Attempting manual PPTX parsing...");
    return await parsePptxFileManual(filePath);
  } catch (manualError) {
    console.log("Manual parsing failed, trying libraries:", manualError);
  }

  // Try pptxtojson
  try {
    const pptxtojson = await import("pptxtojson");
    const parser = pptxtojson.default || pptxtojson;
    if (typeof parser === "function") {
      return await parser(filePath);
    } else if (parser && typeof parser.parse === "function") {
      return await parser.parse(filePath);
    }
  } catch (error1) {
    console.log("pptxtojson failed, trying pptx2json:", error1);
  }

  // Fallback to pptx2json
  try {
    let parser: any;
    try {
      const module = await import("pptx2json");
      parser = module.default || module;
    } catch (importError) {
      console.log("ES module import failed, trying require:", importError);
      try {
        const pptx2jsonModule = eval('require')("pptx2json");
        parser = pptx2jsonModule.default || pptx2jsonModule;
      } catch (requireError) {
        console.error("Both import methods failed:", requireError);
        throw new Error("Could not load PowerPoint parser library");
      }
    }

    if (!parser) {
      throw new Error("Parser is undefined");
    }

    if (typeof parser === "function") {
      return await parser(filePath);
    } else if (parser && typeof parser.parse === "function") {
      return await parser.parse(filePath);
    } else if (parser && typeof parser.parseFile === "function") {
      return await parser.parseFile(filePath);
    } else if (parser && typeof parser.default === "function") {
      return await parser.default(filePath);
    } else {
      throw new Error("Parser does not have a recognized interface");
    }
  } catch (error: any) {
    console.error("Error parsing PPTX with all methods:", error);
    throw new Error(`Failed to parse PowerPoint file: ${error.message || "Unknown error"}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string || "Imported Presentation";

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    // Check if it's a PowerPoint file
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pptx") && !fileName.endsWith(".ppt")) {
      return NextResponse.json(
        { error: "Only .pptx and .ppt files are supported" },
        { status: 400 }
      );
    }

    // Get user's church - get from user's campus or find first active church
    let churchId: string;
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { 
          campusId: true, 
          campus: { 
            select: { 
              churchId: true 
            } 
          } 
        },
      });

      if (user?.campus?.churchId) {
        churchId = user.campus.churchId;
      } else {
        // Fallback: get first active church
        const church = await prisma.church.findFirst({
          where: { isActive: true },
          select: { id: true },
        });
        if (church?.id) {
          churchId = church.id;
        } else {
          // Create a default church if none exists to satisfy FK
          const created = await prisma.church.create({
            data: {
              name: "Default Church",
              isActive: true,
              timezone: "UTC",
              language: "en",
              currency: "USD",
            },
            select: { id: true },
          });
          churchId = created.id;
        }
      }
    } catch (error) {
      // If error, try to get or create a church
      try {
        const church = await prisma.church.findFirst({ select: { id: true } });
        if (church?.id) {
          churchId = church.id;
        } else {
          const created = await prisma.church.create({
            data: {
              name: "Default Church",
              isActive: true,
              timezone: "UTC",
              language: "en",
              currency: "USD",
            },
            select: { id: true },
          });
          churchId = created.id;
        }
      } catch (e) {
        console.error("Failed to get or create church:", e);
        throw new Error("Unable to resolve church for presentation import");
      }
    }

    // Save file temporarily
    const tempDir = join(process.cwd(), "tmp");
    if (!existsSync(tempDir)) {
      await mkdir(tempDir, { recursive: true });
    }

    // Sanitize filename to prevent illegal path characters
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const tempFilePath = join(tempDir, `pptx-${Date.now()}-${sanitizedFileName}`);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(tempFilePath, buffer);

    try {
      // Parse PowerPoint file
      let slidesData: any[] = [];

      if (fileName.endsWith(".pptx")) {
        // For .pptx files, try parsing
        try {
          console.log("Starting PPTX parsing for file:", fileName);
          const result = await parsePptxFile(tempFilePath);
          console.log("Parsing result structure:", {
            isArray: Array.isArray(result),
            hasSlides: !!(result && result.slides),
            hasSlide: !!(result && Array.isArray(result.slide)),
            keys: result ? Object.keys(result) : [],
          });
          
          // Handle different possible response structures
          if (Array.isArray(result)) {
            slidesData = result;
            console.log(`Extracted ${slidesData.length} slides from array`);
          } else if (result && result.slides) {
            slidesData = Array.isArray(result.slides) ? result.slides : [];
            console.log(`Extracted ${slidesData.length} slides from result.slides`);
          } else if (result && Array.isArray(result.slide)) {
            slidesData = result.slide;
            console.log(`Extracted ${slidesData.length} slides from result.slide`);
          } else {
            console.warn("Unexpected PPTX parse result structure:", {
              result,
              type: typeof result,
              keys: result ? Object.keys(result) : [],
            });
            slidesData = [];
          }
          
          if (slidesData.length === 0) {
            console.warn("No slides extracted from PowerPoint file");
          }
        } catch (parseError: any) {
          console.error("PPTX parsing error:", parseError);
          console.error("Parse error details:", {
            message: parseError.message,
            stack: parseError.stack,
            name: parseError.name,
            code: parseError.code,
          });
          // If parsing fails, throw the error so we can return a proper response
          throw parseError;
        }
      } else {
        // For .ppt files (older format), we might need a different approach
        // For now, return an error
        return NextResponse.json(
          { error: ".ppt files are not supported. Please convert to .pptx format." },
          { status: 400 }
        );
      }

      // Convert slides to our format
      const slides = slidesData.map((slide: any, index: number) => {
        // Extract text from slide
        let slideText = "";
        let slideTitle = `Slide ${index + 1}`;

        // If slide already has title and content (from manual parser), use them directly
        if (slide.title && slide.content !== undefined) {
          slideTitle = slide.title;
          slideText = slide.content || "";
        } else {
          // Try to extract text from various possible structures
          if (slide.text) {
            if (Array.isArray(slide.text)) {
              slideText = slide.text.join("\n");
            } else if (typeof slide.text === "string") {
              slideText = slide.text;
            }
          }

          // Try to get title from first line or shape
          if (slide.shapes && Array.isArray(slide.shapes)) {
            const firstShape = slide.shapes[0];
            if (firstShape?.text) {
              const firstLine = Array.isArray(firstShape.text)
                ? firstShape.text[0]
                : firstShape.text.split("\n")[0];
              slideTitle = firstLine || slideTitle;
              slideText = Array.isArray(firstShape.text)
                ? firstShape.text.slice(1).join("\n")
                : firstShape.text.split("\n").slice(1).join("\n");
            }
          }

          // If we have text, try to extract title from first line
          if (slideText && !slideTitle.includes("Slide")) {
            const lines = slideText.split("\n").filter((l: string) => l.trim());
            if (lines.length > 0) {
              slideTitle = lines[0].substring(0, 50); // Limit title length
              slideText = lines.slice(1).join("\n");
            }
          }
        }

        // Calculate dimensions based on content length
        // Base dimensions: 640x360 (16:9 aspect ratio, 2x the old size)
        let width = 640;
        let height = 360;
        
        // Adjust dimensions based on content length
        const contentLength = slideText.length;
        const lineCount = slideText.split('\n').filter(l => l.trim()).length;
        
        // If content is very long, make slide taller
        if (contentLength > 500 || lineCount > 10) {
          height = 480; // Taller for more content
          width = 640; // Keep width the same
        } else if (contentLength > 200 || lineCount > 5) {
          height = 420; // Medium height
          width = 640;
        }
        
        // If content is extremely long, make it even larger
        if (contentLength > 1000 || lineCount > 20) {
          height = 600;
          width = 800;
        }

        // Random position on canvas (1000x1000), but spread out more for larger slides
        const x = 100 + (index % 3) * 350;
        const y = 100 + Math.floor(index / 3) * 400;

        return {
          title: slideTitle || `Slide ${index + 1}`,
          content: slideText || "",
          x,
          y,
          width,
          height,
          order: index,
          backgroundColor: null,
          textColor: null,
        };
      });
      
      console.log(`Converted ${slides.length} slides to presentation format`);

      // If no slides were extracted, create a default slide
      if (slides.length === 0) {
        console.warn("No slides extracted from PowerPoint, creating default slide");
        slides.push({
          title: title || file.name.replace(/\.(pptx|ppt)$/i, ""),
          content: "The PowerPoint file was uploaded successfully. Please add your content using the editor.",
          x: 100,
          y: 100,
          width: 320,
          height: 192,
          order: 0,
          backgroundColor: null,
          textColor: null,
        });
      }
      
      console.log(`Final slides array length: ${slides.length}`);

      // Create presentation with slides
      const presentation = await prisma.presentation.create({
        data: {
          title: title || file.name.replace(/\.(pptx|ppt)$/i, ""),
          description: `Imported from ${file.name}`,
          isPublic: false,
          presenterUserId: session.user.id,
          createdById: session.user.id,
          churchId,
          currentSlideId: null,
          slides: {
            create: slides,
          },
        },
        include: {
          slides: {
            orderBy: { order: "asc" },
          },
        },
      });

      // Set first slide as current
      if (presentation.slides.length > 0) {
        await prisma.presentation.update({
          where: { id: presentation.id },
          data: { currentSlideId: presentation.slides[0].id },
        });
        presentation.currentSlideId = presentation.slides[0].id;
      }

        return NextResponse.json(
          {
            presentation,
            message: `Successfully imported ${slides.length} slide(s) from PowerPoint!`,
            imported: true,
          },
          { status: 201 }
        );
    } catch (parseError: any) {
      console.error("Error parsing PowerPoint file:", parseError);
      console.error("Full error:", {
        message: parseError.message,
        stack: parseError.stack,
        name: parseError.name,
      });
      
      // Create a presentation with a single placeholder slide as fallback
      try {
        console.log("Creating fallback presentation due to parsing error");
        const fallbackSlides = [{
          title: title || file.name.replace(/\.(pptx|ppt)$/i, ""),
          content: "PowerPoint file uploaded but content could not be automatically extracted. Please add your slides manually using the editor.",
          x: 100,
          y: 100,
          width: 320,
          height: 192,
          order: 0,
          backgroundColor: null,
          textColor: null,
        }];

        const presentation = await prisma.presentation.create({
          data: {
            title: title || file.name.replace(/\.(pptx|ppt)$/i, ""),
            description: `Imported from ${file.name} (parsing failed - manual entry required)`,
            isPublic: false,
            presenterUserId: session.user.id,
            createdById: session.user.id,
            churchId,
            currentSlideId: null,
            slides: {
              create: fallbackSlides,
            },
          },
          include: {
            slides: {
              orderBy: { order: "asc" },
            },
          },
        });

        // Set first slide as current
        if (presentation.slides.length > 0) {
          await prisma.presentation.update({
            where: { id: presentation.id },
            data: { currentSlideId: presentation.slides[0].id },
          });
          presentation.currentSlideId = presentation.slides[0].id;
        }

        return NextResponse.json(
          {
            presentation,
            message: `Presentation created successfully! ${fallbackSlides.length} placeholder slide(s) added. You can now edit and add your content using the editor.`,
            warning: parseError.message || "PowerPoint parsing failed - manual entry required",
            imported: false,
          },
          { status: 201 }
        );
      } catch (fallbackError: any) {
        console.error("Error creating fallback presentation:", fallbackError);
        // Return error if fallback also fails
        return NextResponse.json(
          {
            error: "Failed to parse PowerPoint file and create fallback presentation",
            details: parseError.message || "Unknown parsing error. The file may be corrupted or in an unsupported format.",
            prisma: {
              code: (fallbackError as any)?.code,
              meta: (fallbackError as any)?.meta,
            },
          },
          { status: 500 }
        );
      }
    } finally {
      // Clean up temp file
      try {
        await unlink(tempFilePath);
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError);
      }
    }
  } catch (error: any) {
    console.error("Error uploading PowerPoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload PowerPoint file" },
      { status: 500 }
    );
  }
}

