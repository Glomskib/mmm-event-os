import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, createUntypedAdminClient } from "@/lib/supabase/admin";
import { getPrice } from "@/lib/pricing";
import {
  waiverVersion,
  waiverHash,
  waiverText,
} from "@/content/waiver/mmm_waiver_2026_v1";
import { generateWaiverPdf } from "@/lib/waiver-pdf";
import { sendWaiverEmail } from "@/lib/resend";
import { applyEarlyBonusForRegistration } from "@/lib/incentives";

export async function POST(request: Request) {
  const requestId = randomUUID().slice(0, 8);

  try {
  return await handlePost(request, requestId);
  } catch (err) {
    console.error("[waiver/accept]", requestId, "unhandled_error", err);
    return NextResponse.json(
      { error: "An unexpected server error occurred.", requestId },
      { status: 500 }
    );
  }
}

async function handlePost(request: Request, requestId: string) {
  const supabase = await createClient();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body.", requestId },
      { status: 400 }
    );
  }

  const {
    event_id,
    distance,
    referralCode,
    participant_name,
    participant_email,
    emergency_contact_name,
    emergency_contact_phone,
    shirt_size,
    medical_info,
    dietary_restrictions,
    skill_level,
  } = body as {
    event_id?: string;
    distance?: string;
    referralCode?: string;
    participant_name?: string;
    participant_email?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    shirt_size?: string;
    medical_info?: string;
    dietary_restrictions?: string;
    skill_level?: string;
  };

  console.log("[waiver/accept]", requestId, "start", { event_id, distance: distance ?? null });

  if (!event_id || !distance) {
    return NextResponse.json(
      { error: "event_id and distance are required.", requestId },
      { status: 400 }
    );
  }

  // Validate participant + emergency fields
  if (
    !participant_name?.trim() ||
    !participant_email?.trim() ||
    !emergency_contact_name?.trim() ||
    !emergency_contact_phone?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "Participant name, email, emergency contact name, and phone are required.",
        requestId,
      },
      { status: 400 }
    );
  }

  // Look up the event
  console.log("[waiver/accept]", requestId, "lookup_event");
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, org_id, title, status")
    .eq("id", event_id)
    .single();

  if (eventError || !event) {
    console.error("[waiver/accept]", requestId, "event_not_found", eventError?.message);
    return NextResponse.json({ error: "Event not found.", requestId }, { status: 404 });
  }

  if (event.status !== "published") {
    return NextResponse.json(
      { error: "Event is not open for registration.", requestId },
      { status: 400 }
    );
  }

  // Get current user (optional — guest checkout allowed)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Capture waiver metadata from request headers
  const waiverIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const waiverUserAgent = request.headers.get("user-agent") || "unknown";
  const waiverAcceptedAt = new Date().toISOString();

  const price = getPrice(event.title, distance);
  const isFree = price === 0;

  const admin = createAdminClient();

  const db = createUntypedAdminClient();
  const { data: reg, error: regError } = await db
    .from("registrations")
    .insert({
      org_id: event.org_id,
      event_id: event.id,
      user_id: user?.id || null,
      distance,
      amount: price,
      status: isFree ? "free" : "pending",
      referral_code: referralCode || null,
      email: user?.email || null,
      waiver_accepted: true,
      waiver_accepted_at: waiverAcceptedAt,
      waiver_ip: waiverIp,
      waiver_user_agent: waiverUserAgent,
      waiver_version: waiverVersion,
      waiver_text_hash: waiverHash,
      waiver_snapshot_text: waiverText,
      participant_name: participant_name.trim(),
      participant_email: participant_email.trim(),
      emergency_contact_name: emergency_contact_name.trim(),
      emergency_contact_phone: emergency_contact_phone.trim(),
      shirt_size: shirt_size || null,
      medical_info: medical_info?.trim() || null,
      dietary_restrictions: dietary_restrictions?.trim() || null,
      skill_level: skill_level || null,
    })
    .select("id")
    .single();

  if (regError || !reg) {
    console.error("[waiver/accept]", requestId, "reg_insert_failed", regError?.message, regError?.code);
    return NextResponse.json(
      { error: "Failed to create registration.", requestId },
      { status: 500 }
    );
  }
  console.log("[waiver/accept]", requestId, "reg_created", reg.id);

  // Generate waiver PDF and upload to storage
  try {
    const pdfBuffer = await generateWaiverPdf({
      participantName: participant_name.trim(),
      participantEmail: participant_email.trim(),
      emergencyContactName: emergency_contact_name.trim(),
      emergencyContactPhone: emergency_contact_phone.trim(),
      waiverText,
      waiverVersion,
      signedAt: waiverAcceptedAt,
      ip: waiverIp,
    });

    const storagePath = `${event.id}/${reg.id}.pdf`;

    const { error: uploadError } = await admin.storage
      .from("waivers")
      .upload(storagePath, pdfBuffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Failed to upload waiver PDF:", uploadError);
    } else {
      await admin
        .from("registrations")
        .update({ waiver_pdf_url: storagePath })
        .eq("id", reg.id);
    }
  } catch (pdfErr) {
    // PDF generation failure should not block registration
    console.error("Waiver PDF generation failed:", pdfErr);
  }

  // Send waiver email for free registrations
  if (isFree) {
    try {
      const { data: signedUrl } = await admin.storage
        .from("waivers")
        .createSignedUrl(`${event.id}/${reg.id}.pdf`, 60 * 60 * 24 * 7);

      if (signedUrl?.signedUrl) {
        await sendWaiverEmail(participant_email.trim(), {
          participantName: participant_name.trim(),
          eventTitle: event.title,
          distance,
          signedAt: waiverAcceptedAt,
          pdfUrl: signedUrl.signedUrl,
          registrationId: reg.id,
        });
      }
    } catch (emailErr) {
      console.error("Failed to send waiver email (free):", emailErr);
    }
  }

  // Apply early-bird bonus for free registrations (idempotent, fire-and-forget)
  if (isFree) {
    applyEarlyBonusForRegistration(reg.id).catch((err) =>
      console.error("[waiver] applyEarlyBonus failed:", err)
    );
  }

  console.log("[waiver/accept]", requestId, "done", { is_free: isFree });
  return NextResponse.json({
    registration_id: reg.id,
    is_free: isFree,
  });
}
