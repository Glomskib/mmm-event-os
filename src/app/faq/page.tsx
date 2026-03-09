import { Hero } from "@/components/layout/hero";
import { FaqAccordion } from "./faq-accordion";
import { getOrgConfig } from "@/lib/org-config";

export const metadata = { title: "FAQ" };

const org = getOrgConfig();

const faqs = [
  {
    q: `What is ${org.name}?`,
    a: `${org.name} Inc. is a ${org.nonprofit.type} nonprofit based in ${org.location}. We organize cycling events — from charity rides to weekly group rides — that build community and raise funds for local families in Hancock County.`,
  },
  {
    q: "What events do you host?",
    a: "Our flagship event is the Hancock Horizontal Hundred (HHH), a gravel century ride each September. We also host the Findlay Further Fondo in spring, Wheels & Reels film nights, Ride to the Movies, weekly Saturday shop rides, Cranksgiving, and more. Check our Events page for the full calendar.",
  },
  {
    q: "Do I need to be an experienced cyclist?",
    a: "Not at all! Every event offers multiple distance options. The HHH has distances from 15 miles (free!) to 100 miles. Our weekly group rides welcome all skill levels. We want everyone to feel comfortable riding with us.",
  },
  {
    q: "Where does the money go?",
    a: "100% of event registration proceeds go directly to supporting families in Hancock County. We partner with local organizations to provide meals, supplies, and support to families in need. We keep our overhead as close to zero as possible through volunteer labor and sponsor support.",
  },
  {
    q: "How do I register for an event?",
    a: "Head to our Events page, choose your event, select your distance, create an account (or sign in), sign the waiver, and pay. The whole process takes about 2 minutes. Some distances are free!",
  },
  {
    q: "What is the referral program?",
    a: "When you register, you get a unique referral link. Share it with friends — when they register using your link, you earn points toward prizes. Top referrers earn gear, event swag, and raffle entries. Check the Leaderboard to see where you stand.",
  },
  {
    q: "Can I volunteer instead of riding?",
    a: "Absolutely! We need 30+ volunteers for each major event. Roles include registration desk, rest stop support, course marshals, SAG drivers, photography, and post-ride party setup. Volunteers get a free t-shirt, meals, and raffle entries. Sign up on our Volunteer page.",
  },
  {
    q: "Are donations tax-deductible?",
    a: `Yes. ${org.name} Inc. is a registered ${org.nonprofit.type} nonprofit organization. All donations are tax-deductible to the extent allowed by law. You'll receive a receipt via email.`,
  },
  {
    q: "How can my business become a sponsor?",
    a: "We offer multiple sponsorship tiers — from Community Sponsor to Title Sponsor. Sponsors get logo placement on event materials, website visibility, and direct access to our rider community. Visit our Sponsors page or email us directly.",
  },
  {
    q: "What should I bring on ride day?",
    a: "At minimum: your bike, helmet, water bottles, and a good attitude. We'll have rest stops with snacks and water. We recommend a spare tube, tire levers, a mini pump, and sunscreen. A detailed packing list will be emailed to registered riders before the event.",
  },
  {
    q: "Is there a post-ride party?",
    a: "Yes! Every major event includes a post-ride celebration with food, drinks, music, raffle drawings, and community vibes. It's the best part of the day (besides the ride itself).",
  },
  {
    q: "Where are events located?",
    a: "Most events start and finish in Findlay, Ohio. Routes go through the scenic backroads of Hancock County — flat, fast, and beautiful. Specific venue details are shared on each event page.",
  },
];

export default function FaqPage() {
  return (
    <>
      <Hero
        title="Frequently Asked Questions"
        subtitle={`Everything you need to know about ${org.name} events.`}
      />

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <FaqAccordion items={faqs} />
      </section>
    </>
  );
}
