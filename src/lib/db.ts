import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaPg(url);
  const client = new PrismaClient({ adapter });
  globalForPrisma.prisma = client;
  return client;
}

function createProxy(): PrismaClient {
  return new Proxy({} as unknown as PrismaClient, {
    get(target, prop) {
      if (prop === "then" || prop === "catch") {
        return undefined;
      }
      return Reflect.get(getClient(), prop as keyof PrismaClient);
    },
  });
}

const db = createProxy();

export { db };
