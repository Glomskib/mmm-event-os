/**
 * MMM Event OS — Canonical Waiver Text (2026-v1)
 *
 * To version: copy this file, bump waiverVersion, edit waiverText,
 * then recompute the hash:
 *   node -e "const c=require('crypto');const{waiverText}=require('./mmm_waiver_2026_v1');console.log(c.createHash('sha256').update(waiverText).digest('hex'))"
 */

export const waiverVersion = "2026-v1";

export const waiverText = `ASSUMPTION OF RISK, WAIVER OF LIABILITY, AND INDEMNIFICATION AGREEMENT

Making Miles Matter INC ("Organization") — Event Participation Waiver

By accepting this waiver, I acknowledge and agree to the following:

1. ASSUMPTION OF RISK

I understand that participation in cycling, running, and other endurance events organized by Making Miles Matter INC ("Events") involves inherent risks, including but not limited to:

  a) Physical injury from falls, collisions, or contact with other participants, vehicles, equipment, or natural or man-made objects along the course;
  b) Injury or illness caused by weather conditions, including but not limited to heat, cold, wind, rain, lightning, and poor visibility;
  c) Injury or illness related to road and trail conditions, including uneven surfaces, gravel, potholes, debris, wildlife, traffic, and construction zones;
  d) Injury resulting from my own physical condition, including but not limited to cardiac events, dehydration, exhaustion, or pre-existing medical conditions;
  e) Injury or loss caused by the actions or negligence of other participants, volunteers, spectators, or third parties.

I voluntarily assume all risks associated with my participation in the Event, whether or not specifically identified above, and whether arising from ordinary negligence or otherwise.

2. WAIVER AND RELEASE OF LIABILITY

In consideration of being permitted to participate in the Event, I, on behalf of myself, my heirs, executors, administrators, and assigns, hereby RELEASE, WAIVE, DISCHARGE, AND COVENANT NOT TO SUE Making Miles Matter INC, its officers, directors, employees, volunteers, agents, sponsors, partners, and affiliates ("Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury, including death, that may be sustained by me, whether caused by the negligence of the Released Parties or otherwise, while participating in the Event, or while in, on, or around the Event premises or course.

3. INDEMNIFICATION

I agree to INDEMNIFY AND HOLD HARMLESS the Released Parties from any loss, liability, damage, or cost, including reasonable attorney's fees, they may incur arising from my participation in the Event, whether caused by my negligence or otherwise.

4. MEDICAL ACKNOWLEDGMENT

I certify that I am physically fit and have sufficiently trained for participation in this Event. I acknowledge that the Organization recommends that all participants consult with a physician prior to participating. I consent to receive medical treatment that may be deemed advisable in the event of injury, accident, or illness during the Event, and I accept financial responsibility for the cost of such treatment.

5. USE OF IMAGE AND LIKENESS

I grant the Organization the irrevocable right to use my name, image, likeness, voice, and biographical information in any media, including photographs, video, and audio recordings, for promotional, educational, and commercial purposes, without compensation.

6. EVENT RULES AND COMPLIANCE

I agree to comply with all Event rules, instructions from Event officials and volunteers, and all applicable federal, state, and local laws. I understand that the Organization reserves the right to disqualify any participant who poses a risk to themselves or others, or who fails to comply with Event rules, without refund.

7. PERSONAL PROPERTY

I understand that the Organization is not responsible for any lost, stolen, or damaged personal property.

8. WEATHER AND CANCELLATION

I understand that the Event may be delayed, modified, or cancelled due to weather or other circumstances beyond the Organization's control. In the event of cancellation, the Organization's refund policy, as stated at the time of registration, shall apply.

9. ELECTRONIC SIGNATURE

I agree that my electronic acceptance of this waiver shall have the same legal effect as a handwritten signature. I acknowledge that I have read this waiver in its entirety, understand its terms, and agree to be bound by it voluntarily.

10. GOVERNING LAW

This agreement shall be governed by and construed in accordance with the laws of the State of Michigan, without regard to its conflict of law provisions.

BY ACCEPTING THIS WAIVER, I ACKNOWLEDGE THAT I HAVE READ AND UNDERSTAND THIS AGREEMENT, THAT I AM VOLUNTARILY GIVING UP SUBSTANTIAL LEGAL RIGHTS, AND THAT I INTEND THIS AGREEMENT TO BE A COMPLETE AND UNCONDITIONAL RELEASE OF ALL LIABILITY TO THE GREATEST EXTENT ALLOWED BY LAW.`;

/**
 * Pre-computed SHA-256 hash of waiverText.
 * Recompute after any edit — see instructions at top of file.
 */
export const waiverHash = "df98a95d34e64e492298e4b270bee9a62ada89bebd81a2b52e5db6d67d16c43a";
