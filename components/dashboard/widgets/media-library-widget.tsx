"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, ArrowRight, Upload, FileImage, Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface MediaLibraryWidgetProps {
  widgetId: string;
}

export function MediaLibraryWidget({ widgetId }: MediaLibraryWidgetProps) {
  const [data, setData] = useState<{
    totalFiles: number;
    images: number;
    videos: number;
    recentUploads: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard/widgets/media-library");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching media library data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-cyan-50/30">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-100/20 rounded-full blur-3xl -mr-20 -mt-20" />
        <CardHeader className="relative z-10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-cyan-100/80 backdrop-blur-sm">
              <Image className="w-5 h-5 text-cyan-600" />
            </div>
            Media Library
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <Skeleton className="h-32 mb-4" />
          <Skeleton className="h-10" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-white to-cyan-50/30">
      <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-100/30 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-cyan-100/40 transition-colors duration-300" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-300" />
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <div className="p-2 rounded-lg bg-cyan-100/80 backdrop-blur-sm group-hover:bg-cyan-100 group-hover:scale-110 transition-all duration-300 shadow-sm">
            <Image className="w-5 h-5 text-cyan-600" />
          </div>
          Media Library
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="mb-4">
          <div className="p-4 rounded-lg bg-white/60 backdrop-blur-sm border border-cyan-100 mb-4">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-2">Total Files</p>
            <p className="text-3xl font-bold text-gray-900">{data.totalFiles}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-cyan-100 text-center">
              <FileImage className="w-4 h-4 text-cyan-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600 mb-1">Images</p>
              <p className="text-lg font-bold text-gray-900">{data.images}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-purple-100 text-center">
              <Video className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600 mb-1">Videos</p>
              <p className="text-lg font-bold text-gray-900">{data.videos}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/60 backdrop-blur-sm border border-amber-100 text-center">
              <Upload className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600 mb-1">Recent</p>
              <p className="text-lg font-bold text-gray-900">{data.recentUploads}</p>
            </div>
          </div>
          <Link href="/dashboard/media/upload">
            <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white mb-2">
              <Upload className="w-4 h-4 mr-2" />
              Upload Media
            </Button>
          </Link>
        </div>
        <Link href="/dashboard/media" className="block">
          <Button 
            variant="outline" 
            className="w-full border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 group/btn transition-all duration-200"
          >
            Browse Library
            <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

