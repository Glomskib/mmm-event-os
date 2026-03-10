/**
 * Central org configuration for white-label support.
 *
 * For now this returns hardcoded MMM values. A future version can read from
 * the `orgs` table metadata column or a config JSON file.
 */

export type OrgConfig = {
  name: string;
  shortName: string;
  tagline: string;
  mission: string;
  location: string;
  contactEmail: string;
  nonprofit: { type: string; ein: string | null };
  social: {
    facebook: string | null;
    instagram: string | null;
    strava: string | null;
  };
  branding: {
    primaryColor: string;
    navyColor: string;
    logoUrl: string | null;
  };
  domain: string;
};

export function getOrgConfig(): OrgConfig {
  return {
    name: "Making Miles Matter",
    shortName: "MMM",
    tagline: "Every Mile Matters.",
    mission:
      "Making Miles Matter brings people together to improve mental, physical, and emotional health. We help people push their limits, connect with nature and each other, and turn every mile into meaningful impact for themselves, their communities, and the world around them.",
    location: "Findlay, OH",
    contactEmail: "miles@makingmilesmatter.com",
    nonprofit: { type: "501(c)(3)", ein: null },
    social: {
      facebook: "https://facebook.com/MakingMilesMatterINC",
      instagram: "https://instagram.com/makingmilesmatter",
      strava: "https://strava.com/clubs/makingmilesmatter",
    },
    branding: {
      primaryColor: "#F5A623",
      navyColor: "#0E2A47",
      logoUrl: null,
    },
    domain: "makingmilesmatter.com",
  };
}
