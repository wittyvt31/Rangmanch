"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateProfile, type UpdateProfileFormData } from "@/features/auth/actions";
import { toast } from "sonner";

interface SettingsFormProps {
  initialData: {
    full_name: string;
    bio: string;
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const data: UpdateProfileFormData = {
      full_name: formData.get("full_name") as string,
      bio: (formData.get("bio") as string) || undefined,
    };
    
    const result = await updateProfile(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Profile updated successfully");
    } else {
      toast.error(result.error || "Failed to update profile");
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={initialData.full_name}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={initialData.bio}
          rows={4}
          placeholder="Tell us about yourself..."
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}

