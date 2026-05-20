import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimitInstance: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimitInstance) {
    return ratelimitInstance;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    ratelimitInstance = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      analytics: true,
    });
    return ratelimitInstance;
  } catch {
    return null;
  }
}

export async function checkRateLimit(ip: string): Promise<boolean> {
  const rl = getRatelimit();
  if (!rl) {
    return true;
  }

  try {
    const { success } = await rl.limit(ip);
    return success;
  } catch {
    return true;
  }
}
