import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top_left,#eef7f3,transparent_32%),linear-gradient(135deg,#f6f4ef,#ffffff)] px-4">
      <LoginForm hasError={params.error === "1"} />
    </main>
  );
}
