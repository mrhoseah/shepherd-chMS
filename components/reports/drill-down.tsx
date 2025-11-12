"use client";

import { useState, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ZoomIn } from "lucide-react";

interface DrillDownProps {
  title: string;
  children: ReactNode;
  onBack?: () => void;
  level?: number;
}

export function DrillDown({ title, children, onBack, level = 0 }: DrillDownProps) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            {level > 0 && onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {title}
          </CardTitle>
          {level > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <ZoomIn className="w-3 h-3" />
              Level {level}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function useDrillDown<T = any>() {
  const [drillStack, setDrillStack] = useState<Array<{ title: string; data: T }>>([]);

  const drillDown = (title: string, data: T) => {
    setDrillStack((prev) => [...prev, { title, data }]);
  };

  const drillUp = () => {
    setDrillStack((prev) => prev.slice(0, -1));
  };

  const reset = () => {
    setDrillStack([]);
  };

  const currentLevel = drillStack.length;
  const currentData = drillStack[currentLevel - 1]?.data;
  const currentTitle = drillStack[currentLevel - 1]?.title;

  return {
    drillDown,
    drillUp,
    reset,
    currentLevel,
    currentData,
    currentTitle,
    isDrilled: currentLevel > 0,
  };
}

