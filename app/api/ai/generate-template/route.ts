import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    console.log("AI template generation request received");
    const session = await getServerSession(authOptions);
    if (!session) {
      console.error("Unauthorized request - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log("Request body:", body);
    const { category, type, context, tone, recipientInfo } = body;

    if (!category || !type) {
      console.error("Missing required fields:", { category, type });
      return NextResponse.json(
        { error: "Category and type are required" },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error("OpenAI API key not configured");
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables." },
        { status: 500 }
      );
    }
    
    console.log("OpenAI API key found, length:", openaiApiKey.length);

    // Build the prompt based on category and context
    const prompt = buildPrompt(category, type, context, tone, recipientInfo);
    console.log("Generated prompt length:", prompt.length);

    // Call OpenAI API
    console.log("Calling OpenAI API...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Using the cheaper model
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates professional, warm, and appropriate message templates for a church management system. Generate messages that are respectful, clear, and suitable for the context.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      let errorMessage = "Failed to generate template. Please try again.";
      try {
        const error = await response.json();
        console.error("OpenAI API error:", error);
        errorMessage = error.error?.message || error.message || errorMessage;
        
        // Handle specific OpenAI errors
        if (error.error?.type === "invalid_request_error") {
          errorMessage = `Invalid request: ${error.error.message}`;
        } else if (error.error?.type === "authentication_error") {
          errorMessage = "OpenAI API authentication failed. Please check your API key.";
        } else if (error.error?.type === "rate_limit_error") {
          errorMessage = "OpenAI API rate limit exceeded. Please try again later.";
        }
      } catch (parseError) {
        console.error("Error parsing OpenAI error response:", parseError);
        errorMessage = `OpenAI API returned status ${response.status}: ${response.statusText}`;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content || "";

    if (!generatedText) {
      console.error("OpenAI returned empty response:", data);
      return NextResponse.json(
        { error: "OpenAI returned an empty response. Please try again." },
        { status: 500 }
      );
    }

    // Parse the response to extract subject and content
    const { subject, content } = parseGeneratedText(generatedText, type);

    return NextResponse.json({
      subject,
      content,
      raw: generatedText,
    });
  } catch (error: any) {
    console.error("Error generating template:", error);
    console.error("Error stack:", error?.stack);
    const errorMessage = error?.message || "Failed to generate template";
    const errorDetails = {
      error: errorMessage,
      type: error?.name || "UnknownError",
      code: error?.code,
    };
    console.error("Returning error response:", errorDetails);
    return NextResponse.json(
      errorDetails,
      { status: 500 }
    );
  }
}

function buildPrompt(
  category: string,
  type: string,
  context?: any,
  tone?: string,
  recipientInfo?: any
): string {
  const categoryDescriptions: Record<string, string> = {
    BIRTHDAY: "a birthday message",
    ANNIVERSARY: "an anniversary message",
    WEDDING_ANNIVERSARY: "a wedding anniversary message",
    WELCOME: "a welcome message for new members",
    EVENT_REMINDER: "an event reminder message",
    THANK_YOU: "a thank you message",
    APPRECIATION: "an appreciation message",
    PRAYER_REQUEST: "a prayer request message",
    FOLLOW_UP: "a follow-up message",
    PAYMENT_CONFIRMATION: "a payment confirmation message",
    DONATION_RECEIPT: "a donation receipt message",
    GENERAL: "a general message",
  };

  let prompt = `Generate ${categoryDescriptions[category] || "a message"} for a church. `;
  
  if (type === "SMS") {
    prompt += "This is an SMS message, so it must be concise (under 160 characters). ";
  } else if (type === "EMAIL") {
    prompt += "This is an email message. Include a subject line and body content. ";
  }

  if (tone) {
    prompt += `Tone: ${tone}. `;
  } else {
    prompt += "Tone: warm, friendly, and professional. ";
  }

  if (context) {
    prompt += `Context: ${JSON.stringify(context)}. `;
  }

  if (recipientInfo) {
    prompt += `Recipient information: ${JSON.stringify(recipientInfo)}. `;
  }

  // Add specific instructions based on category
  switch (category) {
    case "BIRTHDAY":
      prompt += "Make it personal and celebratory. Include a blessing or prayer. ";
      if (recipientInfo?.name) {
        prompt += `Address the recipient as ${recipientInfo.name}. `;
      }
      break;
    case "WEDDING_ANNIVERSARY":
      prompt += "Make it warm and congratulatory. Include a blessing for their marriage. ";
      break;
    case "WELCOME":
      prompt += "Make it welcoming and encouraging. Mention that they're now part of the church family. ";
      break;
    case "EVENT_REMINDER":
      prompt += "Include event details, date, time, and location if provided. Make it clear and actionable. ";
      break;
    case "THANK_YOU":
    case "APPRECIATION":
      prompt += "Express genuine gratitude. Be specific about what you're thanking them for. ";
      break;
  }

  if (type === "EMAIL") {
    prompt += "\n\nFormat your response as:\nSUBJECT: [subject line]\n\nCONTENT:\n[email body content]";
  } else {
    prompt += "\n\nProvide only the message content (no subject line needed for SMS).";
  }

  return prompt;
}

function parseGeneratedText(text: string, type: string): { subject: string; content: string } {
  if (type === "SMS") {
    // For SMS, just return the text as content
    return { subject: "", content: text.trim() };
  }

  // For EMAIL, try to extract subject and content
  const subjectMatch = text.match(/SUBJECT:\s*(.+?)(?:\n|$)/i);
  const contentMatch = text.match(/CONTENT:\s*([\s\S]+)/i);

  if (subjectMatch && contentMatch) {
    return {
      subject: subjectMatch[1].trim(),
      content: contentMatch[1].trim(),
    };
  }

  // Fallback: if no clear structure, use first line as subject, rest as content
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length > 1) {
    return {
      subject: lines[0].replace(/^SUBJECT:\s*/i, "").trim(),
      content: lines.slice(1).join("\n").trim(),
    };
  }

  // Last resort: use entire text as content
  return {
    subject: "",
    content: text.trim(),
  };
}

