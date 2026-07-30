import { SelectionProvider } from "@/lib/selection/selection-context";
import { SelectionFloatingButton } from "@/components/catalog/selection-floating-button";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SelectionProvider>
      <div className="flex flex-col flex-1">{children}</div>
      <SelectionFloatingButton />
    </SelectionProvider>
  );
}
