import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

interface AppShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AppShell({ children, title, description }: AppShellProps) {
  return (
    <div className="admin-shell">
      <Sidebar />

      <main className="admin-main">
        <Header title={title} description={description} />

        <div className="admin-content">{children}</div>
      </main>
    </div>
  );
}
