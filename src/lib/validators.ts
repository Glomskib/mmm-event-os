import { createAdminClient } from "@/lib/supabase/admin";
import { getDistances } from "@/lib/pricing";

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateEmail(email: string): ValidationError | null {
  if (!email || typeof email !== "string") {
    return { field: "email", message: "Email is required" };
  }
  // Basic format check — not exhaustive, just catches obvious issues
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return { field: "email", message: "Invalid email format" };
  }
  return null;
}

export function validatePhone(phone: string): ValidationError | null {
  if (!phone || typeof phone !== "string") {
    return { field: "phone", message: "Phone number is required" };
  }
  // Strip common formatting
  const digits = phone.replace(/[\s\-().+]/g, "");
  if (digits.length < 7 || digits.length > 15) {
    return {
      field: "phone",
      message: "Phone number must be 7-15 digits",
    };
  }
  return null;
}

export function validateDistance(
  eventTitle: string,
  distance: string
): ValidationError | null {
  if (!distance || typeof distance !== "string") {
    return { field: "distance", message: "Distance is required" };
  }
  const available = getDistances(eventTitle);
  // If event has defined distances, validate against them
  if (available.length > 0) {
    const allowed = available.map((d) => d.distance);
    if (!allowed.includes(distance)) {
      return {
        field: "distance",
        message: `Invalid distance. Allowed: ${allowed.join(", ")}`,
      };
    }
  }
  return null;
}

export async function validateEventExists(
  eventId: string
): Promise<ValidationError | null> {
  if (!eventId || typeof eventId !== "string") {
    return { field: "event_id", message: "Event ID is required" };
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("events")
    .select("id, status")
    .eq("id", eventId)
    .single();

  if (!data) {
    return { field: "event_id", message: "Event not found" };
  }
  if (data.status === "cancelled") {
    return { field: "event_id", message: "Event has been cancelled" };
  }
  return null;
}

export function collectErrors(
  ...results: (ValidationError | null)[]
): ValidationResult {
  const errors = results.filter(
    (e): e is ValidationError => e !== null
  );
  return { valid: errors.length === 0, errors };
}
