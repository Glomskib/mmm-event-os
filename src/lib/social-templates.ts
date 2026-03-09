/**
 * Deterministic social post template generator.
 * Creates 3 variants: hype, informative, and vulnerability/update.
 * No external LLM calls — pure string templates.
 */

export interface TemplateInput {
  eventName?: string;
  date?: string;
  distance?: string;
  registrationUrl?: string;
  topic?: string;
}

export interface GeneratedDraft {
  variant: "hype" | "informative" | "update";
  label: string;
  text: string;
}

export function generateSocialDrafts(input: TemplateInput): GeneratedDraft[] {
  const event = input.eventName || "our next event";
  const date = input.date || "soon";
  const distance = input.distance || "all distances";
  const regUrl = input.registrationUrl || "makingmilesmatter.com";
  const topic = input.topic || "Making Miles Matter";

  return [
    {
      variant: "hype",
      label: "Hype",
      text: [
        `LET'S GOOO! ${event} is coming ${date} and we are PUMPED!`,
        ``,
        `Whether you're riding ${distance} or just vibing at the finish line, this is going to be one for the books.`,
        ``,
        `Spots are filling up — grab yours before they're gone!`,
        `Register now: ${regUrl}`,
        ``,
        `#MakingMilesMatter #RideForACause #CommunityRide`,
      ].join("\n"),
    },
    {
      variant: "informative",
      label: "Informative",
      text: [
        `${topic} — ${event}`,
        ``,
        `Date: ${date}`,
        `Distances: ${distance}`,
        ``,
        `Join our community ride supporting local causes. Every mile counts, every rider matters.`,
        ``,
        `What's included:`,
        `- Fully supported course`,
        `- Post-ride celebration`,
        `- Raffle prizes for participants`,
        ``,
        `Register: ${regUrl}`,
      ].join("\n"),
    },
    {
      variant: "update",
      label: "Update / Personal",
      text: [
        `Quick update from the ${topic} team —`,
        ``,
        `We've been working hard behind the scenes to make ${event} something special. Here's what's new:`,
        ``,
        `- Route finalized for ${distance}`,
        `- New rest stops confirmed`,
        `- Referral program is live (invite friends, earn raffle tickets!)`,
        ``,
        `We do this because community matters. See you out there.`,
        ``,
        `Details & registration: ${regUrl}`,
      ].join("\n"),
    },
  ];
}
