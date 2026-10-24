import {
  BoxesIcon,
  CalculatorIcon,
  ChartColumnIcon,
  FolderTreeIcon,
  GemIcon,
  HandCoinsIcon,
  LandmarkIcon,
  LayersIcon,
  LayoutDashboardIcon,
  PackageIcon,
  PaletteIcon,
  ShapesIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
  UsersIcon,
  WarehouseIcon,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
  /** Itens de apoio do grupo: ficam num bloco recolhível ("Organizar catálogo"). */
  secondary?: { label: string; items: AdminNavItem[] };
};

// Mesmos destinos do menu anterior (nenhuma rota foi removida nem renomeada).
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Visão geral",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon },
      { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBagIcon },
      { href: "/admin/clientes", label: "Clientes", icon: UsersIcon },
    ],
  },
  {
    label: "Catálogo",
    items: [{ href: "/admin/produtos", label: "Produtos", icon: PackageIcon }],
    secondary: {
      label: "Organizar catálogo",
      items: [
        { href: "/admin/categorias", label: "Categorias", icon: FolderTreeIcon },
        { href: "/admin/colecoes", label: "Coleções", icon: LayersIcon },
        { href: "/admin/modelos", label: "Modelos", icon: ShapesIcon },
        { href: "/admin/cores", label: "Cores", icon: PaletteIcon },
        { href: "/admin/materiais", label: "Materiais", icon: GemIcon },
        { href: "/admin/grupos-variacao", label: "Variações", icon: BoxesIcon },
      ],
    },
  },
  {
    label: "Estoque e compras",
    items: [
      { href: "/admin/estoque", label: "Estoque", icon: WarehouseIcon },
      { href: "/admin/compras", label: "Compras", icon: ReceiptTextIcon },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { href: "/admin/contas-a-pagar", label: "Contas a pagar", icon: HandCoinsIcon },
      { href: "/admin/fluxo-de-caixa", label: "Fluxo de caixa", icon: LandmarkIcon },
    ],
  },
  {
    label: "Gestão",
    items: [
      { href: "/admin/precificacao", label: "Precificação", icon: CalculatorIcon },
      { href: "/admin/analytics", label: "Analytics", icon: ChartColumnIcon },
    ],
  },
];

export function isNavItemActive(pathname: string, href: string) {
  // "/admin" só está ativo na raiz exata; as demais também nas subrotas.
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}
