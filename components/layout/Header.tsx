"use client";

import { Bell, ChevronDown, Menu, Search } from "lucide-react";

interface HeaderProps {
  title?: string;
  description?: string;
}

export function Header({
  title = "Dashboard",
  description = "Visão geral do Sistema ABR Agro.",
}: HeaderProps) {
  return (
    <header className="admin-topbar">
      {/* LADO ESQUERDO */}
      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-menu-button"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        <div className="admin-topbar-title">
          <span className="admin-eyebrow">Sistema de Gestão</span>

          <h1>{title}</h1>

          <p>{description}</p>
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="admin-topbar-actions">
        {/* BUSCA */}
        <div className="admin-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Buscar no sistema..."
            aria-label="Buscar no sistema"
          />
        </div>

        {/* NOTIFICAÇÕES */}
        <button
          type="button"
          className="admin-icon-button admin-notification-button"
          aria-label="Notificações"
        >
          <Bell size={20} />

          <span className="admin-notification-dot" />
        </button>

        {/* USUÁRIO */}
        <button
          type="button"
          className="admin-user-menu"
          aria-label="Menu do usuário"
        >
          <div className="admin-user-avatar">
            <span>AD</span>
          </div>

          <div className="admin-user-info">
            <strong>Administrador</strong>

            <span>ABR Agro</span>
          </div>

          <ChevronDown size={17} className="admin-user-chevron" />
        </button>
      </div>
    </header>
  );
}
