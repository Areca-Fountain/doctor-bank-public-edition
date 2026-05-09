// types/index.ts

export interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt?: Date;
}

export interface UserSession {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}