"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ChartNoAxesCombined,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";

const menuPrincipal = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Vendas",
    href: "/vendas",
    icon: ShoppingCart,
  },
  {
    label: "Produtos",
    href: "/produtos",
    icon: Package,
  },
  {
    label: "Estoque",
    href: "/estoque",
    icon: Warehouse,
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    label: "Fornecedores",
    href: "/fornecedores",
    icon: Truck,
  },
];

const menuGestao = [
  {
    label: "Compras",
    href: "/compras",
    icon: ClipboardList,
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    icon: CircleDollarSign,
  },
  {
    label: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
  },
  {
    label: "Análises",
    href: "/analises",
    icon: ChartNoAxesCombined,
  },
];

const menuSistema = [
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <aside className="admin-sidebar">
      {/* LOGO */}
      <div className="admin-brand">
        <div className="admin-brand-logo-wrapper">
          <Image
            src="/logo/abr-agro.png"
            alt="ABR Agro"
            width={180}
            height={80}
            priority
            className="admin-brand-logo"
          />
        </div>
      </div>

      {/* MENU PRINCIPAL */}
      <nav className="admin-nav">
        <span className="admin-nav-label">Principal</span>

        {menuPrincipal.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${active ? "is-active" : ""}`}
            >
              <Icon />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* MENU GESTÃO */}
      <nav className="admin-nav">
        <span className="admin-nav-label">Gestão</span>

        {menuGestao.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${active ? "is-active" : ""}`}
            >
              <Icon />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* MENU SISTEMA */}
      <nav className="admin-nav">
        <span className="admin-nav-label">Sistema</span>

        {menuSistema.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${active ? "is-active" : ""}`}
            >
              <Icon />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* RODAPÉ DA SIDEBAR */}
      <div className="admin-sidebar-card">
        <div className="admin-sidebar-card-icon">
          <Boxes size={18} />
        </div>

        <div>
          <strong>Sistema ABR Agro</strong>

          <p>Gestão inteligente para o seu negócio.</p>
        </div>

        <ChevronRight size={18} className="admin-sidebar-card-arrow" />
      </div>
    </aside>
  );
}
