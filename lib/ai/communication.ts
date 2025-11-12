/**
 * AI Communication Service
 * Generates personalized follow-up content using AI
 */

interface GenerateFollowUpContentOptions {
  guestName: string;
  guestFirstName?: string;
  guestLastName?: string;
  type: string; // FollowUpType
  method: string; // FollowUpMethod
  context?: {
    visitDate?: string;
    eventName?: string;
    previousFollowUps?: number;
    notes?: string;
  };
  tone?: "friendly" | "professional" | "warm" | "casual";
  length?: "short" | "medium" | "long";
}

interface AISettings {
  enabled: boolean;
  provider?: "openai" | "anthropic" | "custom";
  apiKey?: string;
  model?: string;
  temperature?: number;
}

/**
 * Get AI settings from database
 */
export async function getAISettings(): Promise<AISettings> {
  try {
    const response = await fetch("/api/settings");
    if (response.ok) {
      const data = await response.json();
      const settings = data.settings || {};
      return {
        enabled: settings.aiCommunication?.enabled || false,
        provider: settings.aiCommunication?.provider || "openai",
        apiKey: settings.aiCommunication?.apiKey,
        model: settings.aiCommunication?.model || "gpt-3.5-turbo",
        temperature: settings.aiCommunication?.temperature || 0.7,
      };
    }
  } catch (error) {
    console.error("Error fetching AI settings:", error);
  }
  return { enabled: false };
}

/**
 * Generate follow-up content using AI
 */
export async function generateFollowUpContent(
  options: GenerateFollowUpContentOptions
): Promise<{ subject?: string; content: string }> {
  const aiSettings = await getAISettings();

  if (!aiSettings.enabled) {
    throw new Error("AI communication is disabled. Please enable it in settings.");
  }

  if (!aiSettings.apiKey) {
    throw new Error("AI API key is not configured. Please configure it in settings.");
  }

  const prompt = buildPrompt(options);

  try {
    if (aiSettings.provider === "openai" || !aiSettings.provider) {
      return await generateWithOpenAI(prompt, aiSettings);
    } else if (aiSettings.provider === "anthropic") {
      return await generateWithAnthropic(prompt, aiSettings);
    } else {
      throw new Error(`Unsupported AI provider: ${aiSettings.provider}`);
    }
  } catch (error: any) {
    console.error("Error generating AI content:", error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
}

function buildPrompt(options: GenerateFollowUpContentOptions): string {
  const {
    guestName,
    guestFirstName,
    guestLastName,
    type,
    method,
    context,
    tone = "friendly",
    length = "medium",
  } = options;

  const typeDescriptions: Record<string, string> = {
    WELCOME: "a warm welcome message for a new guest",
    THANK_YOU: "a thank you message for visiting",
    INVITATION: "an invitation to an upcoming event or service",
    CHECK_IN: "a check-in message to see how they're doing",
    PRAYER_REQUEST: "a message acknowledging their prayer request",
    CONNECTION: "a message about connecting them with a group or ministry",
    BAPTISM: "information about baptism",
    OTHER: "a general follow-up message",
  };

  const methodDescriptions: Record<string, string> = {
    EMAIL: "email format",
    SMS: "SMS/text message format (concise, under 160 characters)",
    PHONE_CALL: "phone call script/notes",
    IN_PERSON: "in-person conversation talking points",
    LETTER: "letter format",
    OTHER: "general communication",
  };

  let prompt = `Generate ${typeDescriptions[type] || "a follow-up message"} in ${methodDescriptions[method] || "communication format"} for a guest named ${guestName}`;

  if (guestFirstName) {
    prompt += ` (first name: ${guestFirstName})`;
  }

  prompt += `.\n\n`;
  prompt += `Tone: ${tone}\n`;
  prompt += `Length: ${length}\n\n`;

  if (context) {
    if (context.visitDate) {
      prompt += `They visited on ${context.visitDate}.\n`;
    }
    if (context.eventName) {
      prompt += `They attended: ${context.eventName}.\n`;
    }
    if (context.previousFollowUps) {
      prompt += `This is follow-up #${context.previousFollowUps + 1}.\n`;
    }
    if (context.notes) {
      prompt += `Additional context: ${context.notes}\n`;
    }
  }

  prompt += `\nMake it personal, warm, and appropriate for a church context. `;
  
  if (method === "SMS") {
    prompt += `Keep it very concise (under 160 characters).`;
  } else if (method === "EMAIL") {
    prompt += `Include a subject line.`;
  } else if (method === "PHONE_CALL") {
    prompt += `Provide talking points and key things to mention.`;
  }

  return prompt;
}

async function generateWithOpenAI(
  prompt: string,
  settings: AISettings
): Promise<{ subject?: string; content: string }> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify({
      model: settings.model || "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates personalized church communication content. Be warm, friendly, and appropriate for a church context.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: settings.temperature || 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to generate content");
  }

  const data = await response.json();
  const generatedText = data.choices[0]?.message?.content || "";

  // Try to extract subject if it's an email
  if (prompt.includes("email")) {
    const lines = generatedText.split("\n");
    if (lines[0].toLowerCase().includes("subject:")) {
      return {
        subject: lines[0].replace(/^subject:\s*/i, "").trim(),
        content: lines.slice(1).join("\n").trim(),
      };
    }
  }

  return { content: generatedText.trim() };
}

async function generateWithAnthropic(
  prompt: string,
  settings: AISettings
): Promise<{ subject?: string; content: string }> {
  // Anthropic Claude API implementation
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.apiKey!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: settings.model || "claude-3-sonnet-20240229",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      system:
        "You are a helpful assistant that generates personalized church communication content. Be warm, friendly, and appropriate for a church context.",
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Failed to generate content");
  }

  const data = await response.json();
  const generatedText = data.content[0]?.text || "";

  // Try to extract subject if it's an email
  if (prompt.includes("email")) {
    const lines = generatedText.split("\n");
    if (lines[0].toLowerCase().includes("subject:")) {
      return {
        subject: lines[0].replace(/^subject:\s*/i, "").trim(),
        content: lines.slice(1).join("\n").trim(),
      };
    }
  }

  return { content: generatedText.trim() };
}

/**
 * Replace template variables with actual values
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  }
  return result;
}

