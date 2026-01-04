"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { FilmFormData, CreditFormData } from "./types";
import { resend } from "@/lib/resend";
import { InviteEmail } from "@/features/auth/emails/InviteEmail";
import { render } from "@react-email/render";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createFilm(
  formData: FilmFormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Create film record with 'processing' status (idempotent)
    const { data, error } = await supabase
      .from("films")
      .insert({
        uploader_id: user.id,
        title: formData.title,
        description: formData.description || null,
        duration: formData.duration || null,
        poster_url: formData.poster_url || null,
        mux_asset_id: formData.mux_asset_id || null,
        status: "processing",
        submission_fee_paid: false,
        views: 0,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating film:", error);
      return { success: false, error: "Failed to create film record" };
    }

    revalidatePath("/studio");
    return { success: true, data: { id: data.id } };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function updateFilmMuxData(
  filmId: string,
  muxAssetId: string,
  muxPlaybackId: string
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify ownership
    const { data: film, error: fetchError } = await supabase
      .from("films")
      .select("uploader_id")
      .eq("id", filmId)
      .single();

    if (fetchError || !film) {
      return { success: false, error: "Film not found" };
    }

    if (film.uploader_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Update Mux data and set status to 'live'
    const { error: updateError } = await supabase
      .from("films")
      .update({
        mux_asset_id: muxAssetId,
        mux_playback_id: muxPlaybackId,
        status: "live",
      })
      .eq("id", filmId);

    if (updateError) {
      console.error("Error updating film:", updateError);
      return { success: false, error: "Failed to update film" };
    }

    revalidatePath("/studio");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

export async function addCredit(
  filmId: string,
  creditData: CreditFormData
): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify film ownership and get film title
    const { data: film, error: fetchError } = await supabase
      .from("films")
      .select("uploader_id, title")
      .eq("id", filmId)
      .single();

    if (fetchError || !film) {
      return { success: false, error: "Film not found" };
    }

    if (film.uploader_id !== user.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Get director name (current user's profile)
    const { data: directorProfile } = await supabase
      .from("profiles")
      .select("email, username")
      .eq("id", user.id)
      .single();

    const directorName =
      directorProfile?.username ||
      directorProfile?.email ||
      "Director";

    // Check if user exists with this email
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", creditData.email)
      .single();

    // Insert credit
    const { error: insertError } = await supabase.from("credits").insert({
      film_id: filmId,
      profile_id: profile?.id || null,
      invited_email: profile ? null : creditData.email,
      role: creditData.role,
      is_confirmed: !!profile,
    });

    if (insertError) {
      console.error("Error adding credit:", insertError);
      return { success: false, error: "Failed to add credit" };
    }

    // If profile doesn't exist, send invite email via Resend
    if (!profile) {
      try {
        const inviteUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://rangmanch.com";
        const emailHtml = render(
          InviteEmail({
            directorName,
            filmName: film.title,
            role: creditData.role,
            inviteUrl: `${inviteUrl}/auth`,
          })
        );

        await resend.emails.send({
          from: "RangManch <noreply@rangmanch.com>",
          to: creditData.email,
          subject: `You have been credited in ${film.title}`,
          html: emailHtml,
        });
      } catch (emailError) {
        // Log error but don't fail the credit addition
        console.error("Error sending invite email:", emailError);
      }
    }

    revalidatePath("/studio");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

