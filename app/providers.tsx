"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const PREFIXES = ["abr-agro-", "sistema-abr-"];
const THEME_KEY = "abr-agro-configuracoes";
const DELAY = 900;
// Fica fora dos PREFIXES de propósito: não pode ser apagada pelo restore()
// nem reenviada à nuvem, só serve para este navegador saber se já está
// sincronizado com a última versão salva no servidor.
const MARCA_SYNC_KEY = "abr-cloud-sync-marca";

function aplicarTema(tema: "escuro" | "claro") {
  document.documentElement.dataset.tema = tema;
  document.documentElement.style.colorScheme =
    tema === "claro" ? "light" : "dark";
}

function lerTemaDoStorage(): "escuro" | "claro" {
  try {
    const bruto = localStorage.getItem(THEME_KEY);

    if (!bruto) return "escuro";

    const dados = JSON.parse(bruto) as {
      tema?: string;
    };

    return dados.tema === "claro" ? "claro" : "escuro";
  } catch {
    return "escuro";
  }
}

function snapshot() {
  const state: Record<string, string> = {};

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !PREFIXES.some((prefix) => key.startsWith(prefix))) continue;

    const value = localStorage.getItem(key);
    if (value !== null) state[key] = value;
  }

  return state;
}

function hasMeaningfulState(state: Record<string, string> | undefined) {
  if (!state || Object.keys(state).length === 0) {
    return false;
  }

  return Object.values(state).some((value) => {
    const trimmed = String(value ?? "").trim();
    return trimmed.length > 0 && trimmed !== "[]" && trimmed !== "{}";
  });
}

function restore(state: Record<string, string>) {
  const remove: string[] = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && PREFIXES.some((prefix) => key.startsWith(prefix))) {
      remove.push(key);
    }
  }

  remove.forEach((key) => localStorage.removeItem(key));
  Object.entries(state).forEach(([key, value]) =>
    localStorage.setItem(key, value),
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(pathname === "/login");
  const bootedRef = useRef(false);

  useEffect(() => {
    aplicarTema(lerTemaDoStorage());

    if (pathname === "/login") {
      setReady(true);
      return;
    }

    // Já sincronizou nesta sessão do navegador: não refaz boot/restore
    // a cada troca de página, apenas mantém a UI liberada.
    if (bootedRef.current) {
      setReady(true);
      return;
    }

    let alive = true;
    let timer: number | undefined;

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    // Envio de última hora caso a página feche/recarregue antes do
    // debounce normal disparar (ex.: window.location.href, fechar aba,
    // voltar/avançar do navegador). sendBeacon funciona durante o unload.
    const flushComBeacon = () => {
      try {
        const payload = JSON.stringify({ state: snapshot() });
        navigator.sendBeacon?.(
          "/api/state",
          new Blob([payload], { type: "application/json" }),
        );
      } catch (error) {
        console.error("[ABR] cloud beacon", error);
      }
    };

    window.addEventListener("pagehide", flushComBeacon);
    window.addEventListener("beforeunload", flushComBeacon);

    // Envia o snapshot atual para a nuvem e guarda a marca de sincronismo
    // retornada, para sabermos depois se algum outro dispositivo alterou
    // os dados nesse meio tempo.
    const enviarParaNuvem = async () => {
      const resposta = await fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ state: snapshot() }),
      });

      if (resposta.ok) {
        const resultado = (await resposta.json()) as { updatedAt?: string };
        if (resultado.updatedAt) {
          originalSetItem.call(localStorage, MARCA_SYNC_KEY, resultado.updatedAt);
        }
      }

      return resposta;
    };

    const schedule = () => {
      if (timer) window.clearTimeout(timer);

      timer = window.setTimeout(async () => {
        try {
          // Confere se a nuvem ainda está na versão que vimos por último.
          // Se outro dispositivo/aba já sincronizou dados mais novos,
          // NÃO sobrescreve: isso é o que apagava produtos/vendas recentes.
          const checagem = await fetch("/api/state", {
            credentials: "same-origin",
            cache: "no-store",
          });

          if (checagem.ok) {
            const atual = (await checagem.json()) as {
              existe: boolean;
              state?: Record<string, string>;
              updatedAt?: string;
            };
            const marcaConhecida = localStorage.getItem(MARCA_SYNC_KEY);

            if (
              atual.existe &&
              atual.updatedAt &&
              marcaConhecida &&
              atual.updatedAt !== marcaConhecida
            ) {
              // Outra sessão já salvou uma versão mais nova: adota os dados
              // dela em vez de sobrescrever (evita perder produtos/vendas).
              console.warn(
                "[ABR] dados na nuvem foram atualizados por outra sessão; recarregando.",
              );
              restore(atual.state ?? {});
              aplicarTema(lerTemaDoStorage());
              originalSetItem.call(localStorage, MARCA_SYNC_KEY, atual.updatedAt);
              return;
            }
          }

          await enviarParaNuvem();
        } catch (error) {
          console.error("[ABR] cloud sync", error);
        }
      }, DELAY);
    };

    async function boot() {
      try {
        const response = await fetch("/api/state", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (response.ok) {
          const data = (await response.json()) as {
            existe: boolean;
            state?: Record<string, string>;
            updatedAt?: string;
          };

          if (data.existe) {
            if (hasMeaningfulState(data.state)) {
              restore(data.state ?? {});
              aplicarTema(lerTemaDoStorage());
              if (data.updatedAt) {
                originalSetItem.call(localStorage, MARCA_SYNC_KEY, data.updatedAt);
              }
            } else {
              await enviarParaNuvem();
            }
          } else {
            await enviarParaNuvem();
          }

          Storage.prototype.setItem = function (key, value) {
            originalSetItem.call(this, key, value);

            if (key === THEME_KEY) {
              try {
                const dados = JSON.parse(value) as { tema?: string };
                aplicarTema(dados.tema === "claro" ? "claro" : "escuro");
              } catch {
                aplicarTema("escuro");
              }
            }

            if (PREFIXES.some((prefix) => key.startsWith(prefix))) schedule();
          };

          Storage.prototype.removeItem = function (key) {
            originalRemoveItem.call(this, key);
            if (PREFIXES.some((prefix) => key.startsWith(prefix))) schedule();
          };

          bootedRef.current = true;
        }
      } catch (error) {
        console.error("[ABR] cloud boot", error);
      } finally {
        if (alive) setReady(true);
      }
    }

    void boot();

    return () => {
      alive = false;
      window.removeEventListener("pagehide", flushComBeacon);
      window.removeEventListener("beforeunload", flushComBeacon);
      // Não cancela o timer de sincronização pendente nem remove os
      // overrides do Storage: eles devem sobreviver a trocas de página
      // dentro da mesma sessão, senão uma navegação rápida cancela um
      // envio ao servidor que ainda não tinha sido concluído.
    };
  }, [pathname]);

  if (!ready) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0d0e0d",
          color: "rgba(255,255,255,.55)",
          fontSize: 12,
        }}
      >
        Sincronizando dados...
      </main>
    );
  }

  return children;
}
