/* eslint-disable @typescript-eslint/no-unused-vars */

// @ts-ignore
declare module "@prisma/client" {
  export { PrismaClient } from ".prisma/client";
  export type * from ".prisma/client";
}

declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    OPENAI_API_KEY?: string;
  }
}
