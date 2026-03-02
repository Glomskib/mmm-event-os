"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

interface Props {
  next: string;
}

export function RegisterClient({ next }: Props) {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleGoogle() {
    setLoading(true);
    setMessage(null);
    const redirectTo = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
    if (error) {
      setMessage({ text: error.message, isError: true });
      setLoading(false);
    }
    // On success, browser redirects — no cleanup needed
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage({ text: error.message, isError: true });
      setLoading(false);
    } else {
      window.location.href = next;
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      setMessage({ text: error.message, isError: true });
      setLoading(false);
      return;
    }
    // If session is immediately available (email confirmation disabled), go straight through
    if (data.session) {
      window.location.href = next;
      return;
    }
    setMessage({
      text: "Check your email to confirm your account, then return here to sign in.",
      isError: false,
    });
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Continue to Registration</CardTitle>
        <CardDescription>
          Create an account to sign the waiver and manage your registrations.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Google */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          size="lg"
          onClick={handleGoogle}
          disabled={loading}
        >
          <GoogleIcon />
          Continue with Google
        </Button>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email + password form */}
        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <Label htmlFor="reg-email" className="text-sm">Email</Label>
            <Input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-password" className="text-sm">Password</Label>
            <Input
              id="reg-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min 6 characters"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="submit"
              variant="outline"
              size="lg"
              onClick={handleSignIn}
              disabled={loading || !email || !password}
            >
              Sign In
            </Button>
            <Button
              type="button"
              size="lg"
              onClick={handleSignUp}
              disabled={loading || !email || !password}
            >
              Create Account
            </Button>
          </div>
        </form>

        {/* Feedback */}
        {message && (
          <p
            className={`text-center text-sm ${
              message.isError ? "text-red-600" : "text-muted-foreground"
            }`}
          >
            {message.text}
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/events" className="hover:text-foreground hover:underline">
            ← Back to events
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg
      className="mr-2 h-4 w-4"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
