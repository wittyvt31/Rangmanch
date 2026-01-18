"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  currentUrl?: string | null;
  bucket?: string;
}

export function ImageUpload({
  onUploadComplete,
  currentUrl,
  bucket = "posters",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      onUploadComplete(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onUploadComplete("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <div className="relative h-64 w-full overflow-hidden rounded-none border border-border">
            <Image
              src={preview}
              alt="Poster preview"
              fill
              className="object-cover"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2"
            onClick={handleRemove}
            disabled={uploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-none border-2 border-dashed border-border bg-background transition-colors hover:border-primary/50"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              <p className="mt-2 text-sm text-primary/70">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-primary/50" />
              <p className="mt-2 text-sm text-primary/70">
                Click to upload poster
              </p>
              <p className="mt-1 text-xs text-primary/50">
                PNG, JPG up to 5MB
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}






