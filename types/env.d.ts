// types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    MONGODB_URI: string;
  }
}
