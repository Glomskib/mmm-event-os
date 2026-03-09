/**
 * Email template library for campaigns.
 * Each template returns HTML string with {{placeholder}} tokens
 * that get replaced at send-time.
 */

const BRAND = {
  navy: "#0E2A47",
  orange: "#F5A623",
  ice: "#EAF4FF",
};

function layout(content: string, appUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:${BRAND.ice};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">
  <!-- Header -->
  <div style="background:${BRAND.navy};border-radius:12px 12px 0 0;padding:24px 32px;text-align:center">
    <h1 style="margin:0;color:white;font-size:20px;letter-spacing:1px">Making Miles Matter</h1>
  </div>
  <!-- Body -->
  <div style="background:white;padding:32px;border-radius:0 0 12px 12px">
    ${content}
  </div>
  <!-- Footer -->
  <div style="padding:24px;text-align:center;font-size:12px;color:#999">
    <p>Making Miles Matter Inc. &middot; 501(c)(3) &middot; Findlay, OH</p>
    <p><a href="${appUrl}" style="color:${BRAND.orange}">makingmilesmatter.com</a></p>
    <p><a href="${appUrl}/api/newsletter/unsubscribe?email={{email}}" style="color:#999">Unsubscribe</a></p>
  </div>
</div>
</body>
</html>`;
}

/**
 * Wrap arbitrary HTML content in the branded email layout.
 * Used by campaign sends to ensure consistent branding.
 */
export function wrapInBrandLayout(bodyHtml: string, appUrl: string): string {
  return layout(bodyHtml, appUrl);
}

export const EMAIL_TEMPLATES = {
  eventAnnouncement: (vars: {
    eventName: string;
    eventDate: string;
    eventDescription: string;
    registerUrl: string;
    appUrl: string;
  }) =>
    layout(
      `
    <h2 style="color:${BRAND.navy};margin-top:0">${vars.eventName} is Live!</h2>
    <p style="color:#333;line-height:1.6">Registration is now open for <strong>${vars.eventName}</strong>.</p>
    <p style="color:#333;line-height:1.6">${vars.eventDescription}</p>
    <p style="color:#666;font-size:14px"><strong>Date:</strong> ${vars.eventDate}</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${vars.registerUrl}" style="background:${BRAND.orange};color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Register Now</a>
    </div>
    <p style="color:#666;font-size:14px">Share with friends — every rider helps support families in Hancock County.</p>
  `,
      vars.appUrl
    ),

  eventReminder: (vars: {
    eventName: string;
    daysUntil: number;
    eventDate: string;
    registerUrl: string;
    appUrl: string;
  }) =>
    layout(
      `
    <h2 style="color:${BRAND.navy};margin-top:0">${vars.daysUntil} Days Until ${vars.eventName}!</h2>
    <p style="color:#333;line-height:1.6">The countdown is on. <strong>${vars.eventName}</strong> is ${vars.daysUntil === 1 ? "tomorrow" : `in ${vars.daysUntil} days`}.</p>
    <p style="color:#666;font-size:14px"><strong>Date:</strong> ${vars.eventDate}</p>
    <h3 style="color:${BRAND.navy}">Quick Checklist</h3>
    <ul style="color:#333;line-height:1.8">
      <li>Bike tuned up and tires inflated</li>
      <li>Helmet — mandatory</li>
      <li>Water bottles filled</li>
      <li>Spare tube + tire levers + mini pump</li>
      <li>Sunscreen and nutrition</li>
      <li>Phone charged (for check-ins)</li>
    </ul>
    <div style="text-align:center;margin:24px 0">
      <a href="${vars.registerUrl}" style="background:${BRAND.orange};color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Event Details</a>
    </div>
  `,
      vars.appUrl
    ),

  postEvent: (vars: {
    eventName: string;
    ridersCount: number;
    fundsRaised: string;
    photosUrl: string;
    surveyUrl: string;
    appUrl: string;
  }) =>
    layout(
      `
    <h2 style="color:${BRAND.navy};margin-top:0">Thank You, Rider!</h2>
    <p style="color:#333;line-height:1.6">${vars.eventName} is in the books, and it was incredible.</p>
    <div style="background:${BRAND.ice};border-radius:8px;padding:20px;margin:20px 0;text-align:center">
      <div style="display:inline-block;margin:0 20px;text-align:center">
        <div style="font-size:28px;font-weight:bold;color:${BRAND.navy}">${vars.ridersCount}</div>
        <div style="font-size:12px;color:#666">Riders</div>
      </div>
      <div style="display:inline-block;margin:0 20px;text-align:center">
        <div style="font-size:28px;font-weight:bold;color:${BRAND.navy}">${vars.fundsRaised}</div>
        <div style="font-size:12px;color:#666">Raised</div>
      </div>
    </div>
    <p style="color:#333;line-height:1.6">Every mile you rode directly supports families in Hancock County. That's real impact.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${vars.photosUrl}" style="background:${BRAND.orange};color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin:4px">See Photos</a>
      <a href="${vars.surveyUrl}" style="background:${BRAND.navy};color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin:4px">Take Survey</a>
    </div>
  `,
      vars.appUrl
    ),

  newsletter: (vars: {
    preheader: string;
    sections: { title: string; body: string; ctaText?: string; ctaUrl?: string }[];
    appUrl: string;
  }) =>
    layout(
      `
    <p style="color:#666;font-size:14px;margin-top:0">${vars.preheader}</p>
    ${vars.sections
      .map(
        (s) => `
      <h2 style="color:${BRAND.navy};border-bottom:2px solid ${BRAND.ice};padding-bottom:8px">${s.title}</h2>
      <p style="color:#333;line-height:1.6">${s.body}</p>
      ${
        s.ctaText && s.ctaUrl
          ? `<p><a href="${s.ctaUrl}" style="color:${BRAND.orange};font-weight:bold;text-decoration:none">${s.ctaText} &rarr;</a></p>`
          : ""
      }
    `
      )
      .join("")}
  `,
      vars.appUrl
    ),
};
