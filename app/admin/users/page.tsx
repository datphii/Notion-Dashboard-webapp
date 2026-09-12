import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/lib/users";
import UsersAdmin from "@/components/UsersAdmin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "Admin") redirect("/");

  const users = await listUsers();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <UsersAdmin initialUsers={users} currentUserId={currentUser.userId} />
    </main>
  );
}
