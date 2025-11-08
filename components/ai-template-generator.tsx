"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";

interface AITemplateGeneratorProps {
  onGenerate: (subject: string, content: string) => void;
  type: "SMS" | "EMAIL";
  currentContent?: string;
  currentSubject?: string;
}

const categories = [
  "BIRTHDAY",
  "ANNIVERSARY",
  "WEDDING_ANNIVERSARY",
  "WELCOME",
  "EVENT_REMINDER",
  "THANK_YOU",
  "APPRECIATION",
  "PRAYER_REQUEST",
  "FOLLOW_UP",
  "GENERAL",
];

const tones = [
  "Warm and friendly",
  "Professional",
  "Casual",
  "Formal",
  "Encouraging",
  "Celebratory",
];

export function AITemplateGenerator({
  onGenerate,
  type,
  currentContent,
  currentSubject,
}: AITemplateGeneratorProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("BIRTHDAY");
  const [tone, setTone] = useState("Warm and friendly");
  const [context, setContext] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [eventDetails, setEventDetails] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const contextData: any = {};
      if (eventDetails) {
        contextData.eventDetails = eventDetails;
      }
      if (currentContent) {
        contextData.existingContent = currentContent;
      }

      const recipientInfo: any = {};
      if (recipientName) {
        recipientInfo.name = recipientName;
      }

      const requestBody = {
        category,
        type,
        tone,
        context: Object.keys(contextData).length > 0 ? contextData : undefined,
        recipientInfo: Object.keys(recipientInfo).length > 0 ? recipientInfo : undefined,
      };
      console.log("Sending AI generation request:", requestBody);

      const res = await fetch("/api/ai/generate-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", res.status, res.statusText);
      console.log("Response ok:", res.ok);

      if (!res.ok) {
        let errorMessage = "Failed to generate template";
        try {
          const contentType = res.headers.get("content-type");
          console.log("Response content-type:", contentType);
          
          if (contentType && contentType.includes("application/json")) {
            const errorText = await res.text();
            console.log("Error response text:", errorText);
            
            if (errorText) {
              try {
                const error = JSON.parse(errorText);
                errorMessage = error.error || error.message || errorMessage;
                console.error("API Error (parsed):", error);
              } catch (parseError) {
                console.error("Failed to parse error JSON:", parseError);
                errorMessage = errorText || errorMessage;
              }
            } else {
              errorMessage = `HTTP ${res.status}: ${res.statusText}`;
            }
          } else {
            const text = await res.text();
            errorMessage = text || errorMessage;
            console.error("API Error (non-JSON):", text);
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const responseText = await res.text();
      console.log("Response text:", responseText);
      
      if (!responseText) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response JSON:", parseError);
        throw new Error("Invalid response format from server");
      }
      
      console.log("Parsed response data:", data);
      
      if (!data.content && !data.subject) {
        throw new Error("Generated template is empty. Please try again.");
      }
      
      onGenerate(data.subject || "", data.content || "");
      setOpen(false);
      alert("Template generated successfully!");
    } catch (error: any) {
      console.error("Error generating template:", error);
      alert(error.message || "Failed to generate template. Please check the console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" type="button" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Template Generator
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="category">Message Type</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tones.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {category === "BIRTHDAY" || category === "ANNIVERSARY" || category === "WEDDING_ANNIVERSARY" ? (
            <div>
              <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
              <Input
                id="recipientName"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="e.g., John Doe"
                className="mt-1"
              />
            </div>
          ) : null}

          {category === "EVENT_REMINDER" ? (
            <div>
              <Label htmlFor="eventDetails">Event Details (Optional)</Label>
              <Textarea
                id="eventDetails"
                value={eventDetails}
                onChange={(e) => setEventDetails(e.target.value)}
                placeholder="e.g., Sunday Service, Dec 25, 10:00 AM, Main Sanctuary"
                className="mt-1"
                rows={3}
              />
            </div>
          ) : null}

          <div>
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Any additional information or specific requirements..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Generate Template
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

