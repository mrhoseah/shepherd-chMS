"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Image as ImageIcon, Video, Layout, Presentation } from "lucide-react";

interface SlideTemplate {
  id: string;
  name: string;
  icon: React.ReactNode;
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  width: number;
  height: number;
}

const TEMPLATES: SlideTemplate[] = [
  {
    id: "title",
    name: "Title Slide",
    icon: <FileText className="w-5 h-5" />,
    title: "Title",
    content: "<h1>Main Title</h1><p>Subtitle</p>",
    backgroundColor: "#1e40af",
    textColor: "#ffffff",
    width: 400,
    height: 300,
  },
  {
    id: "content",
    name: "Content",
    icon: <Layout className="w-5 h-5" />,
    title: "Content Slide",
    content: "<h2>Heading</h2><p>Your content here</p>",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    width: 400,
    height: 300,
  },
  {
    id: "image",
    name: "Image Focus",
    icon: <ImageIcon className="w-5 h-5" />,
    title: "Image Slide",
    content: "<h2>Image Title</h2><p>Add your image</p>",
    backgroundColor: "#f3f4f6",
    textColor: "#111827",
    width: 500,
    height: 375,
  },
  {
    id: "video",
    name: "Video",
    icon: <Video className="w-5 h-5" />,
    title: "Video Slide",
    content: "<h2>Video Title</h2><p>Add your video</p>",
    backgroundColor: "#000000",
    textColor: "#ffffff",
    width: 500,
    height: 375,
  },
  {
    id: "split",
    name: "Split Layout",
    icon: <Presentation className="w-5 h-5" />,
    title: "Split Content",
    content: "<div style='display: grid; grid-template-columns: 1fr 1fr; gap: 20px;'><div><h2>Left</h2><p>Content</p></div><div><h2>Right</h2><p>Content</p></div></div>",
    backgroundColor: "#ffffff",
    textColor: "#000000",
    width: 500,
    height: 300,
  },
];

interface SlideTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: SlideTemplate) => void;
}

export function SlideTemplates({ open, onOpenChange, onSelectTemplate }: SlideTemplatesProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Slide Templates</DialogTitle>
          <DialogDescription>
            Choose a template to quickly create a new slide
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
          {TEMPLATES.map((template) => (
            <Card
              key={template.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => {
                onSelectTemplate(template);
                onOpenChange(false);
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
                  {template.icon}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-sm">{template.name}</h3>
                </div>
                <div
                  className="w-full h-24 rounded border-2 border-gray-200 p-2 text-xs overflow-hidden"
                  style={{
                    backgroundColor: template.backgroundColor,
                    color: template.textColor,
                  }}
                  dangerouslySetInnerHTML={{ __html: template.content }}
                />
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

