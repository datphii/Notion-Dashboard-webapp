"use client";

import { useState } from "react";
import Link from "next/link";
import type { WebUser, Role } from "@/lib/users";

async function api(path: string, method: string, body?: unknown) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Có lỗi xảy ra.");
  return data;
}

function NewUserForm({ onCreated }: { onCreated: (u: WebUser) => void }) {
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Role>("Editor");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const data = await api("/api/admin/users", "POST", { name, pin, role });
      onCreated(data.user as WebUser);
      setName("");
      setPin("");
      setRole("Editor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mb-6 flex flex-wrap items-end gap-2 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
    >
      <label className="text-sm">
        Tên
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 block rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-neutral-950"
        />
      </label>
      <label className="text-sm">
        PIN
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
          minLength={4}
          className="mt-1 block rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-neutral-950"
        />
      </label>
      <label className="text-sm">
        Vai trò
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="mt-1 block rounded-md border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-neutral-950"
        >
          <option value="Editor">Editor</option>
          <option value="Admin">Admin</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {saving ? "Đang thêm..." : "+ Thêm tài khoản"}
      </button>
      {error && <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

function UserRow({
  user,
  isSelf,
  onChanged,
  onDeleted,
}: {
  user: WebUser;
  isSelf: boolean;
  onChanged: (u: WebUser) => void;
  onDeleted: (id: string) => void;
}) {
  const [name, setName] = useState(user.name);
  const [pin, setPin] = useState(user.pin);
  const [role, setRole] = useState<Role>(user.role);
  const [active, setActive] = useState(user.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: Partial<{ name: string; pin: string; role: Role; active: boolean }>) {
    setSaving(true);
    setError(null);
    try {
      await api(`/api/admin/users/${user.id}`, "PATCH", patch);
      onChanged({ ...user, name, pin, role, active, ...patch });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Xoá tài khoản "${user.name}"?`)) return;
    setSaving(true);
    try {
      await api(`/api/admin/users/${user.id}`, "DELETE");
      onDeleted(user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra.");
      setSaving(false);
    }
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="py-2 pr-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => name !== user.name && save({ name })}
          className="w-32 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-neutral-950"
        />
      </td>
      <td className="py-2 pr-3">
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onBlur={() => pin !== user.pin && save({ pin })}
          className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-neutral-950"
        />
      </td>
      <td className="py-2 pr-3">
        <select
          value={role}
          onChange={(e) => {
            const v = e.target.value as Role;
            setRole(v);
            save({ role: v });
          }}
          disabled={isSelf}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-700 dark:bg-neutral-950"
        >
          <option value="Editor">Editor</option>
          <option value="Admin">Admin</option>
        </select>
      </td>
      <td className="py-2 pr-3 text-center">
        <input
          type="checkbox"
          checked={active}
          disabled={isSelf}
          onChange={(e) => {
            const v = e.target.checked;
            setActive(v);
            save({ active: v });
          }}
        />
      </td>
      <td className="py-2 pr-3 text-xs text-gray-400">{saving ? "Đang lưu..." : error}</td>
      <td className="py-2">
        {!isSelf && (
          <button
            onClick={remove}
            className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
          >
            Xoá
          </button>
        )}
      </td>
    </tr>
  );
}

export default function UsersAdmin({
  initialUsers,
  currentUserId,
}: {
  initialUsers: WebUser[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Quản lý tài khoản đăng nhập</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← Về trang chính
        </Link>
      </div>
      <p className="mb-6 text-sm text-gray-500">
        Tài khoản ở đây chỉ dùng để đăng nhập webapp này, hoàn toàn tách biệt với thành viên
        workspace Notion.
      </p>

      <NewUserForm onCreated={(u) => setUsers((prev) => [...prev, u])} />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-800">
              <th className="py-2 pr-3 font-medium">Tên</th>
              <th className="py-2 pr-3 font-medium">PIN</th>
              <th className="py-2 pr-3 font-medium">Vai trò</th>
              <th className="py-2 pr-3 font-medium">Active</th>
              <th className="py-2 pr-3 font-medium"></th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUserId}
                onChanged={(updated) =>
                  setUsers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
                }
                onDeleted={(id) => setUsers((prev) => prev.filter((p) => p.id !== id))}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
