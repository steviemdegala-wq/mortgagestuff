"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`text-sm px-1 py-0.5 transition-colors ${
        isActive
          ? "text-black font-medium"
          : "text-gray-400 hover:text-gray-700"
      }`}
    >
      {children}
    </Link>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-start justify-between gap-4 sm:items-center">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <Link href="/" className="text-sm font-semibold tracking-tight text-black">
            Stevie De Gala
          </Link>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 sm:gap-x-6">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/people">People</NavLink>
            <NavLink href="/pipeline">Pipeline</NavLink>
            <NavLink href="/top-10">Top 10</NavLink>
          </nav>
        </div>
        <button
          onClick={handleLogout}
          className="shrink-0 text-sm text-gray-400 hover:text-gray-700 transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="flex-1 px-6 py-8 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
