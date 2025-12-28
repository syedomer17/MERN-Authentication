import { AuthUser } from "../interfaces/AuthUser";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
