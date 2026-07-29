import { getActiveStore } from "@/lib/store/get-active-store";

export default async function HomePage() {
  const store = await getActiveStore();

  return (
    <main className="flex flex-1 items-center justify-center p-16">
      <h1 className="text-3xl font-semibold tracking-tight">{store.name}</h1>
    </main>
  );
}
