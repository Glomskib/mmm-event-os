"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HandHeart, Check } from "lucide-react";

export function VolunteerForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    shirt_size: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState("");

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/volunteer/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--brand-orange)" }}
          >
            <Check className="h-7 w-7 text-white" />
          </div>
          <h3 className="text-xl font-bold">You&apos;re Signed Up!</h3>
          <p className="mt-2 text-muted-foreground">
            We&apos;ll reach out with more details as events approach. Thank you
            for volunteering!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HandHeart
            className="h-5 w-5"
            style={{ color: "var(--brand-orange)" }}
          />
          Sign Up to Volunteer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="vol-name" className="text-sm font-medium">
              Full Name *
            </label>
            <Input
              id="vol-name"
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="vol-email" className="text-sm font-medium">
              Email *
            </label>
            <Input
              id="vol-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="jane@example.com"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="vol-phone" className="text-sm font-medium">
              Phone (optional)
            </label>
            <Input
              id="vol-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="vol-ec-name" className="text-sm font-medium">
                Emergency Contact Name
              </label>
              <Input
                id="vol-ec-name"
                value={form.emergency_contact_name}
                onChange={(e) => update("emergency_contact_name", e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="vol-ec-phone" className="text-sm font-medium">
                Emergency Contact Phone
              </label>
              <Input
                id="vol-ec-phone"
                type="tel"
                value={form.emergency_contact_phone}
                onChange={(e) => update("emergency_contact_phone", e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="vol-shirt" className="text-sm font-medium">
              T-Shirt Size
            </label>
            <select
              id="vol-shirt"
              value={form.shirt_size}
              onChange={(e) => update("shirt_size", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              <option value="">Select size...</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="2XL">2XL</option>
              <option value="3XL">3XL</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="vol-message" className="text-sm font-medium">
              Anything else? (optional)
            </label>
            <Textarea
              id="vol-message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Preferred roles, availability..."
              rows={3}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button
            type="submit"
            disabled={status === "loading"}
            className="w-full"
            size="lg"
          >
            {status === "loading" ? "Submitting..." : "Sign Up to Volunteer"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
