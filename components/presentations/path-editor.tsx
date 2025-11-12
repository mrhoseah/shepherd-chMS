"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Route, X, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Slide {
  id: string;
  title: string;
  x: number;
  y: number;
}

interface PathEditorProps {
  slides: Slide[];
  path: string[]; // Array of slide IDs in presentation order
  onPathChange: (newPath: string[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PathEditor({
  slides,
  path,
  onPathChange,
  open,
  onOpenChange,
}: PathEditorProps) {
  const [localPath, setLocalPath] = useState<string[]>(path);

  const handleAddSlide = (slideId: string) => {
    if (!localPath.includes(slideId)) {
      setLocalPath([...localPath, slideId]);
    }
  };

  const handleRemoveSlide = (index: number) => {
    setLocalPath(localPath.filter((_, i) => i !== index));
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newPath = [...localPath];
      [newPath[index - 1], newPath[index]] = [newPath[index], newPath[index - 1]];
      setLocalPath(newPath);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < localPath.length - 1) {
      const newPath = [...localPath];
      [newPath[index], newPath[index + 1]] = [newPath[index + 1], newPath[index]];
      setLocalPath(newPath);
    }
  };

  const handleSave = () => {
    onPathChange(localPath);
    onOpenChange(false);
  };

  const availableSlides = slides.filter((slide) => !localPath.includes(slide.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Edit Presentation Path
          </DialogTitle>
          <DialogDescription>
            Define the order in which slides appear during presentation. Drag to reorder or use arrows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Path */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Presentation Path</h3>
            <div className="space-y-2">
              {localPath.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No slides in path. Add slides below.</p>
              ) : (
                localPath.map((slideId, index) => {
                  const slide = slides.find((s) => s.id === slideId);
                  if (!slide) return null;
                  return (
                    <div
                      key={slideId}
                      className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{slide.title}</p>
                        <p className="text-xs text-gray-500">ID: {slideId.slice(0, 8)}...</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === localPath.length - 1}
                          className="h-8 w-8 p-0"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSlide(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Available Slides */}
          {availableSlides.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Available Slides</h3>
              <div className="grid grid-cols-2 gap-2">
                {availableSlides.map((slide) => (
                  <Button
                    key={slide.id}
                    variant="outline"
                    onClick={() => handleAddSlide(slide.id)}
                    className="justify-start h-auto p-3"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    <div className="text-left">
                      <p className="font-medium text-sm">{slide.title}</p>
                      <p className="text-xs text-gray-500">Add to path</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Path</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

