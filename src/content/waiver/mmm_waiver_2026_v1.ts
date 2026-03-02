/**
 * MMM Event OS — Canonical Waiver Text (2026-v1)
 *
 * To version: copy this file, bump waiverVersion, edit waiverText,
 * then recompute the hash:
 *   node -e "const c=require('crypto');const{waiverText}=require('./mmm_waiver_2026_v1');console.log(c.createHash('sha256').update(waiverText).digest('hex'))"
 */

export const waiverVersion = "2026-v1";

export const waiverText = `
MAKING MILES MATTER (MMM) — RIDER WAIVER, RELEASE OF LIABILITY, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT
Version: 2026-v1

PLEASE READ CAREFULLY. THIS IS A LEGAL DOCUMENT. BY SIGNING, YOU GIVE UP CERTAIN LEGAL RIGHTS.

This Rider Waiver ("Agreement") applies to any paid event, ride, ride series, fundraiser, group ride, training ride, film ride, holiday ride, or other cycling-related activity (each an "Event") organized, hosted, produced, sponsored, or promoted by Making Miles Matter ("MMM"), Hancock Horizontal Hundred ("HHH"), Findlay Further Fondo ("FFF"), and/or their directors, officers, volunteers, affiliates, partners, sponsors, and agents (collectively, the "Released Parties"). This Agreement applies whether the Event occurs on public roads, trails, private property, or any other location.

1) ACKNOWLEDGEMENT OF INHERENT RISKS
I understand and acknowledge that cycling and Event participation are inherently dangerous. Risks include, but are not limited to:
\u2022 collisions with vehicles, cyclists, pedestrians, animals, or fixed objects;
\u2022 road hazards such as potholes, gravel, debris, railroad tracks, drainage grates, loose surfaces, construction zones, and unpredictable terrain;
\u2022 weather conditions including heat, cold, rain, wind, fog, lightning, and poor visibility;
\u2022 equipment failure or improper maintenance (including brakes, tires, drivetrain, helmet, lights);
\u2022 dehydration, heat illness, hypothermia, fainting, cardiac events, overexertion, cramps, or other medical emergencies;
\u2022 negligent or intentional acts of other participants, spectators, motorists, or third parties;
\u2022 limited medical response times or availability of emergency services;
\u2022 theft or loss of personal property.
I voluntarily choose to participate with full knowledge of these risks.

2) ASSUMPTION OF RISK
I voluntarily assume all risks of injury, illness, death, and property damage arising from or related to my participation, including risks caused by the negligence of the Released Parties to the fullest extent permitted by law.

3) RELEASE OF LIABILITY AND COVENANT NOT TO SUE
To the fullest extent permitted by law, I hereby release, waive, discharge, and covenant not to sue the Released Parties from any and all claims, demands, damages, losses, liabilities, costs, or causes of action of any kind arising out of or related to my participation in an Event, including those arising from the negligence of the Released Parties.
This release includes claims for personal injury, disability, death, property damage, or any other loss, whether arising before, during, or after the Event.

4) INDEMNIFICATION
I agree to indemnify, defend, and hold harmless the Released Parties from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorney's fees) arising out of or related to:
(a) my participation in the Event,
(b) my acts or omissions,
(c) my breach of this Agreement, or
(d) claims brought by third parties arising from my conduct.

5) RULES OF PARTICIPATION / RIDER RESPONSIBILITIES
I agree:
\u2022 to obey all traffic laws and ride responsibly, predictably, and safely;
\u2022 to ride with proper lighting/visibility equipment when conditions require;
\u2022 to wear a properly fitted helmet at all times while riding (MMM strongly recommends helmet use at all Events);
\u2022 to ensure my bicycle is in safe operating condition and to remove myself from participation if equipment is unsafe;
\u2022 to ride within my abilities and to stop if I feel unwell or unsafe;
\u2022 to stay on the Event route (if provided) and respect private property;
\u2022 to treat volunteers, staff, participants, and the public with respect;
\u2022 that I am responsible for route navigation; any provided route files (RideWithGPS, Strava, Wahoo, etc.) are optional aids and are not guaranteed to be accurate.
I understand MMM may remove me from the Event for unsafe or disruptive behavior, and no refund is required in that case.

6) MEDICAL FITNESS AND CONSENT TO EMERGENCY CARE
I certify that I am medically and physically able to participate. I understand MMM does not provide medical advice or guarantee medical support.
If I require emergency medical treatment, I authorize the Released Parties to obtain or provide emergency care on my behalf, and I accept responsibility for all costs of such care, transport, and treatment.

7) MINORS
If the participant is under 18, a parent or legal guardian must sign this Agreement. By signing, the parent/guardian accepts all terms on behalf of the minor and agrees to indemnify and hold harmless the Released Parties for claims arising from the minor's participation.

8) PHOTO/VIDEO RELEASE
I grant MMM and the Released Parties the right to photograph, record, and use my name, image, likeness, voice, and statements for Event documentation, promotion, marketing, social media, fundraising, and other lawful purposes, without compensation. I understand this media may be edited and used in perpetuity.

9) REFUNDS / TRANSFERS
I understand that Event fees may be non-refundable and that policies may vary by Event and will be posted on the Event registration page. I agree to follow MMM's posted refund/transfer policies.

10) FORCE MAJEURE / WEATHER / CANCELLATION
I understand that an Event may be delayed, shortened, rerouted, or cancelled due to weather, natural disaster, public health emergency, government order, road closure, or other circumstances beyond MMM's reasonable control. In any such case, the refund policy posted on the Event registration page at the time of my registration shall apply. MMM is not liable for travel, lodging, or other expenses incurred by participants.

11) SEVERABILITY / GOVERNING LAW / VENUE
If any provision of this Agreement is found unenforceable, the remaining provisions will remain in full force and effect.
This Agreement will be governed by the laws of the State of Ohio, without regard to conflict of law principles. Any dispute shall be brought in a court of competent jurisdiction in the county where the Event is primarily hosted, unless otherwise required by law.

12) ENTIRE AGREEMENT
This Agreement is the entire understanding between me and the Released Parties regarding Event participation and supersedes all prior discussions or representations. I acknowledge I have read this Agreement, understand it, and sign it voluntarily.

BY CHECKING "I AGREE" AND CONTINUING, I CONFIRM THAT I:
\u2022 have read and understood this Agreement,
\u2022 understand I am waiving legal rights,
\u2022 accept full responsibility for the risks involved,
\u2022 agree to be bound by all terms above.

Participant Name: __________________________
Participant Email: __________________________
Date: __________________________
`;

/**
 * Pre-computed SHA-256 hash of waiverText.
 * Recompute after any edit — see instructions at top of file.
 */
export const waiverHash = "dbfb5e75819beb734c99a112afcca00d402fceff1c921f0c7adb977fb8c7f2be";
