"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Search,
  Wallet,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";

import {
  buscarContasPagar,
  listarContasPagar,
  obterResumoContasPagar,
  type ContaPagar,
  type StatusContaPagar,
} from "@/data/contasPagarStore";

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function dataBR(data: string) {
  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "—";
  }

  return valor.toLocaleDateString("pt-BR");
}

function statusLabel(status: StatusContaPagar) {
  const labels: Record<StatusContaPagar, string> = {
    pendente: "Pendente",
    parcial: "Parcial",
    paga: "Paga",
    vencida: "Vencida",
    cancelada: "Cancelada",
  };

  return labels[status];
}

function statusClasse(status: StatusContaPagar) {
  return `contas-pagar-status ${status}`;
}

export default function ContasPagarPage() {
  const [contas, setContas] = useState<ContaPagar[]>([]);

  const [busca, setBusca] = useState("");

  const [filtroStatus, setFiltroStatus] = useState<"todos" | StatusContaPagar>(
    "todos",
  );

  const [carregando, setCarregando] = useState(true);

  function carregarContas() {
    setCarregando(true);

    setContas(listarContasPagar());

    setCarregando(false);
  }

  useEffect(() => {
    carregarContas();

    const atualizar = () => {
      carregarContas();
    };

    window.addEventListener("abr-agro-contas-pagar-atualizadas", atualizar);

    return () => {
      window.removeEventListener(
        "abr-agro-contas-pagar-atualizadas",
        atualizar,
      );
    };
  }, []);

  const resumo = useMemo(() => obterResumoContasPagar(), [contas]);

  const contasFiltradas = useMemo(() => {
    let resultado = busca ? buscarContasPagar(busca) : listarContasPagar();

    if (filtroStatus !== "todos") {
      resultado = resultado.filter((conta) => conta.status === filtroStatus);
    }

    return resultado;
  }, [busca, filtroStatus, contas]);

  const temFiltros = Boolean(busca) || filtroStatus !== "todos";

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("todos");
  }

  return (
    <AppShell
      title="Contas a Pagar"
      description="Controle as obrigações financeiras da empresa."
    >
      <main className="admin-page contas-pagar-page">
        <header className="admin-page-header contas-pagar-header">
          <div>
            <Link href="/financeiro" className="contas-pagar-voltar">
              <ArrowLeft size={16} />
              Voltar para o financeiro
            </Link>

            <span className="admin-eyebrow">FINANCEIRO</span>

            <h1>Contas a Pagar</h1>

            <p>
              Acompanhe pagamentos, vencimentos e obrigações com fornecedores.
            </p>
          </div>

          <div className="contas-pagar-header-icon">
            <Wallet size={24} />
          </div>
        </header>

        <section className="contas-pagar-resumo">
          <article className="contas-pagar-resumo-card total">
            <div className="contas-pagar-resumo-icon">
              <CircleDollarSign size={21} />
            </div>

            <div>
              <span>Saldo a pagar</span>
              <strong>{moeda(resumo.saldo)}</strong>
            </div>
          </article>

          <article className="contas-pagar-resumo-card vencidas">
            <div className="contas-pagar-resumo-icon">
              <Clock3 size={21} />
            </div>

            <div>
              <span>Vencidas</span>
              <strong>{resumo.vencidas}</strong>
            </div>
          </article>

          <article className="contas-pagar-resumo-card pendentes">
            <div className="contas-pagar-resumo-icon">
              <CalendarDays size={21} />
            </div>

            <div>
              <span>Pendentes</span>
              <strong>{resumo.pendentes + resumo.parciais}</strong>
            </div>
          </article>

          <article className="contas-pagar-resumo-card pagas">
            <div className="contas-pagar-resumo-icon">
              <CreditCard size={21} />
            </div>

            <div>
              <span>Pagas</span>
              <strong>{resumo.pagas}</strong>
            </div>
          </article>
        </section>

        <section className="admin-card contas-pagar-lista">
          <div className="contas-pagar-lista-header">
            <div>
              <span className="admin-eyebrow">OBRIGAÇÕES</span>

              <h2>Contas cadastradas</h2>

              <p>
                {contasFiltradas.length === 1
                  ? "1 conta encontrada."
                  : `${contasFiltradas.length} contas encontradas.`}
              </p>
            </div>
          </div>

          <div className="contas-pagar-filtros">
            <div className="contas-pagar-busca">
              <Search size={18} />

              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar fornecedor, compra ou descrição..."
              />

              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar busca"
                >
                  ×
                </button>
              )}
            </div>

            <div className="contas-pagar-tabs">
              <button
                type="button"
                className={filtroStatus === "todos" ? "active" : ""}
                onClick={() => setFiltroStatus("todos")}
              >
                Todas
              </button>

              <button
                type="button"
                className={filtroStatus === "pendente" ? "active" : ""}
                onClick={() => setFiltroStatus("pendente")}
              >
                Pendentes
              </button>

              <button
                type="button"
                className={filtroStatus === "parcial" ? "active" : ""}
                onClick={() => setFiltroStatus("parcial")}
              >
                Parciais
              </button>

              <button
                type="button"
                className={filtroStatus === "vencida" ? "active" : ""}
                onClick={() => setFiltroStatus("vencida")}
              >
                Vencidas
              </button>

              <button
                type="button"
                className={filtroStatus === "paga" ? "active" : ""}
                onClick={() => setFiltroStatus("paga")}
              >
                Pagas
              </button>

              {temFiltros && (
                <button
                  type="button"
                  className="contas-pagar-limpar"
                  onClick={limparFiltros}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {carregando ? (
            <div className="contas-pagar-estado">Carregando contas...</div>
          ) : contasFiltradas.length === 0 ? (
            <div className="contas-pagar-vazio">
              <div className="contas-pagar-vazio-icon">
                <Wallet size={25} />
              </div>

              <strong>
                {contas.length === 0
                  ? "Nenhuma conta a pagar"
                  : "Nenhuma conta encontrada"}
              </strong>

              <p>
                {contas.length === 0
                  ? "As contas serão criadas automaticamente quando novas compras forem registradas."
                  : "Altere os filtros ou a busca para encontrar outras contas."}
              </p>
            </div>
          ) : (
            <div className="contas-pagar-tabela-wrap">
              <div className="contas-pagar-tabela">
                <div className="contas-pagar-head">
                  <span>FORNECEDOR</span>
                  <span>COMPRA</span>
                  <span>VENCIMENTO</span>
                  <span>VALOR</span>
                  <span>SALDO</span>
                  <span>STATUS</span>
                  <span />
                </div>

                {contasFiltradas.map((conta) => (
                  <Link
                    href={`/financeiro/contas-pagar/${conta.id}`}
                    key={conta.id}
                    className="contas-pagar-row"
                  >
                    <div className="contas-pagar-fornecedor">
                      <div className="contas-pagar-fornecedor-icon">
                        <CreditCard size={17} />
                      </div>

                      <div>
                        <strong>{conta.fornecedorNome}</strong>

                        <small>{conta.descricao}</small>
                      </div>
                    </div>

                    <div className="contas-pagar-compra">
                      {conta.compraNumero ? `#${conta.compraNumero}` : "—"}
                    </div>

                    <div className="contas-pagar-vencimento">
                      <strong>{dataBR(conta.dataVencimento)}</strong>

                      <small>
                        {conta.parcelas.length}{" "}
                        {conta.parcelas.length === 1 ? "parcela" : "parcelas"}
                      </small>
                    </div>

                    <div className="contas-pagar-valor">
                      {moeda(conta.valorOriginal)}
                    </div>

                    <div className="contas-pagar-saldo">
                      {moeda(conta.saldo)}
                    </div>

                    <div>
                      <span className={statusClasse(conta.status)}>
                        {statusLabel(conta.status)}
                      </span>
                    </div>

                    <div className="contas-pagar-arrow">
                      <ArrowRight size={17} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
