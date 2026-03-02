import { writeSystemLog } from "@/lib/logger";

const LATE_BASE_URL =
  process.env.LATE_BASE_URL ?? "https://getlate.dev/api/v1";

function getApiKey(): string {
  const key = process.env.LATE_API_KEY;
  if (!key) throw new Error("LATE_API_KEY is not set");
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

// ── Account ID map (from connected Late.dev accounts) ──────────────
// These are the account IDs for Making Miles Matter's connected socials.
// If new accounts are connected, add them here.
export const LATE_ACCOUNTS: Record<string, string> = {
  facebook: "699e6a2f8ab8ae478b4279b6",
  linkedin: "699e68698ab8ae478b42776e",
  pinterest: "699e66cc8ab8ae478b427553",
  reddit: "699e67788ab8ae478b42764b",
  tiktok: "699e65138ab8ae478b427330",
  twitter: "699e663d8ab8ae478b4274a2",
  youtube: "699e652b8ab8ae478b427341",
};

// ── Types ───────────────────────────────────────────────────────────

interface MediaItem {
  type: "image" | "video";
  url: string;
}

interface PlatformTarget {
  platform: string;
  accountId: string;
  platformSpecificData?: Record<string, unknown>;
}

interface CreatePostPayload {
  content: string;
  mediaItems?: MediaItem[];
  platforms: PlatformTarget[];
  publishNow: boolean;
}

export interface PublishResult {
  success: boolean;
  postId?: string;
  data?: unknown;
  error?: string;
}

// ── Publish ─────────────────────────────────────────────────────────

/**
 * Publish a post to Late.dev.
 * Builds the platforms array from channel_targets + account ID map.
 */
export async function publishPost(params: {
  content: string;
  channelTargets: Record<string, boolean>;
  mediaUrls?: string[];
}): Promise<PublishResult> {
  const { content, channelTargets, mediaUrls } = params;

  // Build platforms array from channel_targets
  const platforms: PlatformTarget[] = [];
  for (const [platform, enabled] of Object.entries(channelTargets)) {
    if (!enabled) continue;
    const accountId = LATE_ACCOUNTS[platform];
    if (!accountId) {
      writeSystemLog("late:publish", `Unknown platform: ${platform}`, {
        platform,
      });
      continue;
    }
    platforms.push({ platform, accountId });
  }

  if (platforms.length === 0) {
    return { success: false, error: "No valid platforms selected" };
  }

  // Build media items
  const mediaItems: MediaItem[] = (mediaUrls ?? []).map((url) => {
    const isVideo = /\.(mp4|mov|webm)$/i.test(url);
    return { type: isVideo ? "video" : "image", url };
  });

  const payload: CreatePostPayload = {
    content,
    platforms,
    publishNow: true,
    ...(mediaItems.length > 0 ? { mediaItems } : {}),
  };

  try {
    const res = await fetch(`${LATE_BASE_URL}/posts`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      const errMsg =
        typeof data?.message === "string"
          ? data.message
          : typeof data?.error === "string"
            ? data.error
            : JSON.stringify(data);

      writeSystemLog("late:publish", `Failed: ${errMsg}`, {
        statusCode: res.status,
        platforms: platforms.map((p) => p.platform),
      });

      return { success: false, error: errMsg, data };
    }

    writeSystemLog("late:publish", "Published successfully", {
      platforms: platforms.map((p) => p.platform),
      postId: data?.id ?? data?._id,
    });

    return {
      success: true,
      postId: data?.id ?? data?._id,
      data,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    writeSystemLog("late:publish", `Exception: ${msg}`, {
      platforms: platforms.map((p) => p.platform),
    });
    return { success: false, error: msg };
  }
}

// ── Health check ────────────────────────────────────────────────────

/**
 * Ping Late.dev API to verify connectivity + auth.
 * Returns { ok, accounts?, error? } without exposing secrets.
 */
export async function checkLateHealth(): Promise<{
  ok: boolean;
  accountCount?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${LATE_BASE_URL}/accounts`, {
      method: "GET",
      headers: headers(),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const errMsg =
        data?.message ?? data?.error ?? `HTTP ${res.status}`;
      return { ok: false, error: errMsg };
    }

    const data = await res.json();
    const accounts = Array.isArray(data) ? data : data?.accounts ?? [];
    return { ok: true, accountCount: accounts.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: msg };
  }
}
