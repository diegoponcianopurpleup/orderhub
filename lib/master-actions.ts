import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getMasterCookieName } from "@/lib/master-session";

export async function masterLogoutAction() {
  "use server";
  (await cookies()).delete(getMasterCookieName());
  redirect("/master/login");
}
