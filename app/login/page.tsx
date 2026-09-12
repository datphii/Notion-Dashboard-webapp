import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 sm:px-6">
      <LoginForm />
    </main>
  );
}
