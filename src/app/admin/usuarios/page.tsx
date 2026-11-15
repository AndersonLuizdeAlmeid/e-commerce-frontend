import type { Metadata } from "next";
import { UsersPanel } from "@/features/admin/components/UsersPanel";

export const metadata: Metadata = { title: "Usuários" };

export default function AdminUsersPage() {
  return <UsersPanel />;
}
