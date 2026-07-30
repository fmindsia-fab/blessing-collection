import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex w-fit items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900">
      <ArrowLeftIcon className="size-4" />
      {children}
    </Link>
  );
}
