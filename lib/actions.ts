import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName } from "@/lib/session";

export async function logoutAction() {
  "use server";
  (await cookies()).delete(getSessionCookieName());
  redirect("/login");
}
