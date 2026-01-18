"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface OnboardingFormData {
  username: string;
  full_name: string;
  phone?: string;
}

export async function completeOnboarding(
  formData: OnboardingFormData
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if username is unique
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", formData.username)
      .single();

    if (existingProfile && existingProfile.id !== user.id) {
      return { success: false, error: "Username is already taken" };
    }

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username: formData.username,
        full_name: formData.full_name,
        phone: formData.phone || null,
        role: "filmmaker",
      })
      .eq("id", user.id);

    if (updateError) {
      // Handle unique constraint violation
      // Database constraint is the final referee for race conditions
      if (updateError.code === "23505") {
        return { success: false, error: "Username is already claimed." };
      }
      console.error("Error updating profile:", updateError);
      return { success: false, error: "Failed to update profile" };
    }

    revalidatePath("/");
    revalidatePath("/studio");
    revalidatePath("/onboarding");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function checkUsernameAvailability(
  username: string
): Promise<ActionResult<{ available: boolean }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if username is taken by another user
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .single();

    // If it exists and belongs to current user, it's available (they can keep it)
    if (existingProfile && existingProfile.id === user.id) {
      return { success: true, data: { available: true } };
    }

    // If it exists and belongs to someone else, it's not available
    if (existingProfile) {
      return { success: true, data: { available: false } };
    }

    // If it doesn't exist, it's available
    return { success: true, data: { available: true } };
  } catch (error) {
    // If error is "not found", username is available
    return { success: true, data: { available: true } };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export interface UpdateProfileFormData {
  full_name: string;
  bio?: string;
}

export async function updateProfile(
  formData: UpdateProfileFormData
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Update profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        bio: formData.bio || null,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return { success: false, error: "Failed to update profile" };
    }

    revalidatePath("/studio/settings");
    revalidatePath("/");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

