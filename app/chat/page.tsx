import { redirect } from "next/navigation";
import { createChat } from "@/lib/db/queries";
import { getAuthUser } from "@/lib/auth.server";

export default async function Page() {
  const user = await getAuthUser();
  if (!user) redirect("/login");
  const id = await createChat(user.sub);
  redirect(`/chat/${id}`);
}
