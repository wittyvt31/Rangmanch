"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { completeOnboarding, checkUsernameAvailability } from "../actions";

const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "Username must be lowercase alphanumeric only."
    ),
  full_name: z.string().min(1, "Full name is required").max(100),
  phone: z.string().optional(),
  role: z.enum(["viewer", "filmmaker", "crew"], {
    required_error: "Please select a role",
  }),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export function OnboardingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
  }>({ checking: false, available: null });
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      role: undefined,
    },
  });

  const watchedUsername = watch("username");
  const watchedRole = watch("role");

  // Debounced username availability check
  useEffect(() => {
    if (!watchedUsername || watchedUsername.length < 3) {
      setUsernameStatus({ checking: false, available: null });
      return;
    }

    // Validate format first
    if (!/^[a-z0-9_]+$/.test(watchedUsername)) {
      setUsernameStatus({ checking: false, available: null });
      return;
    }

    const timeoutId = setTimeout(async () => {
      setUsernameStatus({ checking: true, available: null });
      const result = await checkUsernameAvailability(watchedUsername);
      if (result.success) {
        setUsernameStatus({ checking: false, available: result.data.available });
      } else {
        setUsernameStatus({ checking: false, available: null });
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [watchedUsername]);

  const onSubmit = async (data: OnboardingFormData) => {
    // Final check before submitting
    if (usernameStatus.available === false) {
      toast.error("Username is already taken. Please choose another.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Sanitize username to lowercase before sending
      const sanitizedData = {
        ...data,
        username: data.username.toLowerCase(),
      };
      const result = await completeOnboarding(sanitizedData);
      if (result.success) {
        toast.success("Profile completed successfully!");
        router.push("/studio");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="font-serif text-3xl">
          Claim Your Identity
        </CardTitle>
        <CardDescription>
          Complete your profile to join The Republic of Cinema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <div className="relative">
              <Input
                id="username"
                placeholder="johndoe"
                {...register("username")}
                disabled={isSubmitting}
                className="w-full"
                onChange={(e) => {
                  const lowercasedValue = e.target.value.toLowerCase();
                  setValue("username", lowercasedValue);
                  trigger("username");
                }}
              />
              {watchedUsername && watchedUsername.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameStatus.checking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary/50" />
                  ) : usernameStatus.available === true ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : usernameStatus.available === false ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : null}
                </div>
              )}
            </div>
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
            {watchedUsername &&
              watchedUsername.length >= 3 &&
              usernameStatus.available === false && (
                <p className="text-sm text-destructive">
                  Username is already taken
                </p>
              )}
            {watchedUsername &&
              watchedUsername.length >= 3 &&
              usernameStatus.available === true && (
                <p className="text-sm text-green-500">Username is available</p>
              )}
          </div>

          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              placeholder="John Doe"
              {...register("full_name")}
              disabled={isSubmitting}
              className="w-full"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Phone Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 9876543210"
              {...register("phone")}
              disabled={isSubmitting}
              className="w-full"
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={watchedRole}
              onValueChange={(value) => {
                setValue("role", value as "viewer" | "filmmaker" | "crew");
                trigger("role");
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="filmmaker">Filmmaker</SelectItem>
                <SelectItem value="crew">Crew</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isSubmitting ||
              usernameStatus.checking ||
              usernameStatus.available === false
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Profile"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

