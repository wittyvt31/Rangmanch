"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import MuxUploader from "@mux/mux-uploader-react";
import { Loader2, Plus, X, ArrowRight, ArrowLeft, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/features/studio/components/ImageUpload";
import { createFilm, updateFilm, updateFilmMuxData, addCredit, getUnfinishedDraft } from "@/features/studio/actions";
import { getCoins, consumeCoin } from "@/features/payments/actions";
import { PaymentModal } from "@/features/payments/components/PaymentModal";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const filmSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  duration_mins: z
    .union([z.number(), z.string(), z.undefined()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === "" || val === null) return undefined;
      const num = typeof val === "string" ? Number(val) : val;
      if (isNaN(num) || num <= 0) return undefined;
      return num;
    })
    .pipe(z.number().positive("Duration must be positive").optional()),
  poster_url: z.string().url().optional().or(z.literal("")),
  credits: z
    .array(
      z.object({
        role: z.string().min(1, "Role is required"),
        email: z.string().email("Invalid email address"),
      })
    )
    .optional(),
});

type FilmFormData = {
  title: string;
  description?: string;
  duration_mins?: string | number;
  poster_url?: string;
  credits?: { role: string; email: string }[];
};

const steps = [
  { id: 1, name: "Basic Info" },
  { id: 2, name: "Poster" },
  { id: 3, name: "Video" },
  { id: 4, name: "Credits" },
];

export function UploadForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filmId, setFilmId] = useState<string | null>(null);
  const [coins, setCoins] = useState<number | null>(null);
  const [isCheckingCoins, setIsCheckingCoins] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [foundDraft, setFoundDraft] = useState<{
    id: string;
    title: string;
    description: string | null;
    poster_url: string | null;
    duration_mins: number | null;
  } | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FilmFormData>({
    resolver: zodResolver(filmSchema),
    defaultValues: {
      credits: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "credits",
  });

  const posterUrl = watch("poster_url");

  // Check coins and unfinished drafts on mount
  useEffect(() => {
    const checkCoinsAndDrafts = async () => {
      setIsCheckingCoins(true);
      
      // Check for unfinished drafts first
      const draftResult = await getUnfinishedDraft();
      if (draftResult.success && draftResult.data) {
        setFoundDraft(draftResult.data);
        setShowResumeDialog(true);
      }
      
      // Check coins
      const result = await getCoins();
      if (result.success) {
        setCoins(result.data);
        if (result.data === 0) {
          setIsPaymentModalOpen(true);
        }
      } else {
        toast.error(result.error);
      }
      setIsCheckingCoins(false);
    };
    checkCoinsAndDrafts();
  }, []);

  const handlePaymentSuccess = async () => {
    const result = await getCoins();
    if (result.success) {
      setCoins(result.data);
      setIsPaymentModalOpen(false);
    }
  };

  // Handle resume draft
  const handleResumeDraft = async () => {
    if (!foundDraft) return;

    setShowResumeDialog(false);
    setIsResuming(true);
    setFilmId(foundDraft.id);

    // Populate form with draft data
    setValue("title", foundDraft.title);
    setValue("description", foundDraft.description || "");
    setValue("duration_mins", foundDraft.duration_mins || undefined);
    if (foundDraft.poster_url) {
      setValue("poster_url", foundDraft.poster_url);
    }

    // Get Mux upload URL and go directly to step 3
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: false, filmId: foundDraft.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadId: id, url } = await response.json();
      setUploadId(id);
      setUploadUrl(url);
      setCurrentStep(3); // Skip to video upload step
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to initialize upload");
      setIsResuming(false);
    }
  };

  // Handle start new upload
  const handleStartNew = () => {
    setShowResumeDialog(false);
    setFoundDraft(null);
    setIsResuming(false);
  };

  // Step 1: Get Mux upload URL and create film record
  const handleStep1Submit = async (data: FilmFormData) => {
    // If resuming, skip coin consumption and update existing film
    if (isResuming && filmId) {
      try {
        // Update existing film with new data
        const updateResult = await updateFilm(filmId, {
          title: data.title,
          description: data.description || "",
          duration_mins: data.duration_mins ? (typeof data.duration_mins === "string" ? Number(data.duration_mins) : data.duration_mins) : null,
          poster_url: posterUrl || null,
        });

        if (!updateResult.success) {
          toast.error(updateResult.error);
          return;
        }

        // Get Mux upload URL
        const response = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: false, filmId: filmId }),
        });

        if (!response.ok) {
          throw new Error("Failed to get upload URL");
        }

        const { uploadId: id, url } = await response.json();
        setUploadId(id);
        setUploadUrl(url);
        setCurrentStep(2);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to initialize upload");
      }
      return;
    }

    // New upload flow - check and consume coin
    if (coins === null || coins <= 0) {
      setIsPaymentModalOpen(true);
      return;
    }

    // Consume 1 coin
    const consumeResult = await consumeCoin();
    if (!consumeResult.success) {
      toast.error(consumeResult.error || "Failed to consume coin");
      return;
    }

    // Update local coins state
    setCoins((prev) => (prev !== null ? prev - 1 : 0));

    try {
      // Create film record first (idempotent)
      const result = await createFilm({
        title: data.title,
        description: data.description || "",
        duration_mins: data.duration_mins ? (typeof data.duration_mins === "string" ? Number(data.duration_mins) : data.duration_mins) : null,
        poster_url: posterUrl || null,
        mux_asset_id: null,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setFilmId(result.data.id);

      // Get Mux upload URL
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: false, filmId: result.data.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadId: id, url } = await response.json();
      setUploadId(id);
      setUploadUrl(url);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to initialize upload");
    }
  };

  // Step 2: Handle poster upload (already handled by ImageUpload component)
  const handleStep2Next = () => {
    if (currentStep === 2) {
      setCurrentStep(3);
    }
  };

  // Step 3: Handle video upload completion
  const handleUploadSuccess = async () => {
    if (!filmId || !uploadId) {
      toast.error("Missing required data");
      return;
    }

    setIsUploading(true);
    
    // Poll for asset status (Mux processes the upload asynchronously)
    const pollForAsset = async (): Promise<{ assetId: string; playbackId: string } | null> => {
      try {
        const response = await fetch(`/api/upload/${uploadId}/status`);
        
        if (!response.ok) {
          throw new Error("Failed to get upload status");
        }

        const { assetId, playbackId } = await response.json();

        if (assetId && playbackId) {
          return { assetId, playbackId };
        }

        // Asset not ready yet, poll again after 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return pollForAsset();
      } catch (error) {
        console.error("Polling error:", error);
        return null;
      }
    };

    try {
      const assetData = await pollForAsset();

      if (!assetData) {
        toast.error("Upload completed but asset processing failed");
        return;
      }

      const result = await updateFilmMuxData(
        filmId,
        assetData.assetId,
        assetData.playbackId
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Video uploaded successfully!");
      setCurrentStep(4);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update film. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Step 4: Submit credits
  const handleFinalSubmit = async (data: FilmFormData) => {
    if (!filmId) {
      toast.error("Film ID missing");
      return;
    }

    try {
      // Add all credits
      if (data.credits && data.credits.length > 0) {
        for (const credit of data.credits) {
          const result = await addCredit(filmId, credit);
          if (!result.success) {
            toast.error(`Failed to add credit: ${result.error}`);
            return;
          }
        }
      }

      toast.success("Film uploaded successfully!");
      router.push("/studio");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to complete upload");
    }
  };

  // Show payment modal if no coins
  if (isCheckingCoins) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Only show "No Coins Available" screen if:
  // 1. No coins available AND
  // 2. No active upload in progress (no filmId) AND
  // 3. Not resuming a draft
  if (coins === 0 && !filmId && !isResuming) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-none border border-border bg-surface p-8 text-center">
          <Coins className="mx-auto h-12 w-12 text-accent mb-4" />
          <h2 className="font-serif text-2xl text-primary mb-2">
            No Coins Available
          </h2>
          <p className="text-primary/70 mb-6">
            You need at least 1 coin to upload a film. Purchase a coin to
            get started.
          </p>
          <Button
            onClick={() => setIsPaymentModalOpen(true)}
            className="rounded-none"
          >
            Buy Coin (₹199)
          </Button>
        </div>
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-none border-2 ${
                  currentStep >= step.id
                    ? "border-primary bg-primary text-background"
                    : "border-border text-primary/50"
                }`}
              >
                {currentStep > step.id ? (
                  <div className="h-2 w-2 rounded-full bg-background" />
                ) : (
                  step.id
                )}
              </div>
              <span
                className={`mt-2 text-xs ${
                  currentStep >= step.id ? "text-primary" : "text-primary/50"
                }`}
              >
                {step.name}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 ${
                  currentStep > step.id ? "bg-primary" : "bg-border"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit(currentStep === 1 ? handleStep1Submit : handleFinalSubmit)}>
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  className="mt-2"
                  placeholder="Enter film title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  className="mt-2"
                  placeholder="Enter film description"
                  rows={6}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="duration_mins">Duration (minutes)</Label>
                <Input
                  id="duration_mins"
                  type="number"
                  {...register("duration_mins")}
                  className="mt-2"
                  placeholder="e.g., 120"
                />
                {errors.duration_mins && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.duration_mins.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Next: Poster
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label>Poster Image</Label>
                <div className="mt-2">
                  <ImageUpload
                    onUploadComplete={(url) => setValue("poster_url", url)}
                    currentUrl={posterUrl || undefined}
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="button" onClick={handleStep2Next}>
                  Next: Video
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && uploadUrl && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label>Video Upload</Label>
                <div className="mt-2">
                  <MuxUploader
                    endpoint={uploadUrl}
                    onSuccess={handleUploadSuccess}
                    style={{ height: "400px" }}
                  />
                </div>
                {isUploading && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-primary/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing video...
                  </div>
                )}
              </div>

              <div className="flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  disabled={isUploading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <Label>Credits (Optional)</Label>
                <p className="mt-1 text-sm text-primary/70">
                  Add team members who worked on this film
                </p>

                <div className="mt-4 space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex gap-4 rounded-none border border-border bg-surface p-4"
                    >
                      <div className="flex-1">
                        <Input
                          placeholder="Role (e.g., Director, DOP)"
                          {...register(`credits.${index}.role`)}
                        />
                        {errors.credits?.[index]?.role && (
                          <p className="mt-1 text-xs text-destructive">
                            {errors.credits[index]?.role?.message}
                          </p>
                        )}
                      </div>
                      <div className="flex-1">
                        <Input
                          type="email"
                          placeholder="Email"
                          {...register(`credits.${index}.email`)}
                        />
                        {errors.credits?.[index]?.email && (
                          <p className="mt-1 text-xs text-destructive">
                            {errors.credits[index]?.email?.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => append({ role: "", email: "" })}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Credit
                  </Button>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(3)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Complete Upload"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
      <PaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        onSuccess={handlePaymentSuccess}
      />
      
      {/* Resume Draft Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unfinished Upload Found</DialogTitle>
            <DialogDescription>
              You have an unfinished film &quot;{foundDraft?.title}&quot;. Would you like to resume it?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleStartNew}
              className="w-full sm:w-auto"
            >
              Start New (Consumes Coin)
            </Button>
            <Button
              type="button"
              onClick={handleResumeDraft}
              className="w-full sm:w-auto"
            >
              Resume (Free)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

