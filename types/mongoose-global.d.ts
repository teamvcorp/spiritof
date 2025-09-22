// types/mongoose-global.d.ts
import type mongoose from "mongoose";

type MongooseType = typeof mongoose;

declare global {
  // Use `var` so it attaches to Node's global in dev/HMR
  // eslint-disable-next-line no-var
  var _mongoose:
    | {
        conn: MongooseType | null;
        promise: Promise<MongooseType> | null;
      }
    | undefined;
}

export {};
