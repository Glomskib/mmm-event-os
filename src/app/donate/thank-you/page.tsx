import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Thank You" };

export default function DonateThankYouPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-16">
      <Card className="w-full text-center">
        <CardContent className="pt-8 pb-8">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--brand-orange)" }}
          >
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Thank You!</h1>
          <p className="mt-3 text-muted-foreground">
            Your donation makes a real difference for families in Hancock
            County. You&apos;ll receive a receipt via email for your
            tax-deductible contribution.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/events">
              <Button className="w-full gap-2">
                Browse Events <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
