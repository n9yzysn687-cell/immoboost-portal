import type { NextResponse } from "next/server";
import type { CommerceRepository } from "./repository";

export const SESSION_COOKIE = "immoboost_session";

export function readSessionCookie(request: Request) {
  const cookies = request.headers.get("cookie") ?? "";
  for (const entry of cookies.split(";")) {
    const [name, ...value] = entry.trim().split("=");
    if (name === SESSION_COOKIE) return decodeURIComponent(value.join("="));
  }
  return "";
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: string) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
    priority: "high",
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function sessionFromRequest(request: Request, repository: CommerceRepository) {
  const token = readSessionCookie(request);
  return token ? repository.getSession(token) : null;
}

