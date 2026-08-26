"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  Filter,
  Search,
  Wallet,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";
import {
  listarLancamentosCaixa,
  obterResumoCaixa,
  type LancamentoCaixa,
  type TipoLancamentoCaixa,
} from "@/data/caixaStore";

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function dataBR(data: string) {
  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return "—";
  }

  return d.toLocaleDateString("pt-BR");
}

function horaBR(data: string) {
  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function origemLabel(origem: LancamentoCaixa["origem"]) {
  const labels: Record<LancamentoCaixa["origem"], string> = {
    venda: "Venda",
    compra: "Compra",
    manual: "Manual",
    ajuste: "Ajuste",
    estorno: "Estorno",
  };

  return labels[origem];
}

export default function CaixaPage() {
  const [lancamentos, setLancamentos] = useState<LancamentoCaixa[]>([]);

  const [busca, setBusca] = useState("");

  const [filtroTipo, setFiltroTipo] = useState<"todos" | TipoLancamentoCaixa>(
    "todos",
  );

  const [filtroOrigem, setFiltroOrigem] = useState<
    "todas" | LancamentoCaixa["origem"]
  >("todas");

  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [carregando, setCarregando] = useState(true);

  function carregar() {
    setCarregando(true);

    setLancamentos(listarLancamentosCaixa());

    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(
    () => obterResumoCaixa(dataInicio || undefined, dataFim || undefined),
    [lancamentos, dataInicio, dataFim],
  );

  const lancamentosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return lancamentos.filter((lancamento) => {
      const correspondeBusca =
        !termo ||
        [
          lancamento.id,
          lancamento.descricao,
          lancamento.origem,
          lancamento.categoria,
          lancamento.formaPagamento,
          lancamento.vendaNumero,
          lancamento.compraNumero,
          lancamento.observacao,
        ]
          .filter(Boolean)
          .some((valor) => String(valor).toLowerCase().includes(termo));

      const correspondeTipo =
        filtroTipo === "todos" || lancamento.tipo === filtroTipo;

      const correspondeOrigem =
        filtroOrigem === "todas" || lancamento.origem === filtroOrigem;

      const dataLancamento = new Date(lancamento.data);

      const correspondeDataInicio =
        !dataInicio || dataLancamento >= new Date(`${dataInicio}T00:00:00`);

      const correspondeDataFim =
        !dataFim || dataLancamento <= new Date(`${dataFim}T23:59:59.999`);

      return (
        correspondeBusca &&
        correspondeTipo &&
        correspondeOrigem &&
        correspondeDataInicio &&
        correspondeDataFim
      );
    });
  }, [lancamentos, busca, filtroTipo, filtroOrigem, dataInicio, dataFim]);

  const temFiltros =
    Boolean(busca) ||
    filtroTipo !== "todos" ||
    filtroOrigem !== "todas" ||
    Boolean(dataInicio) ||
    Boolean(dataFim);

  function limparFiltros() {
    setBusca("");
    setFiltroTipo("todos");
    setFiltroOrigem("todas");
    setDataInicio("");
    setDataFim("");
  }

  return (
    <AppShell
      title="Caixa"
      description="Controle as entradas e saídas financeiras da empresa."
    >
      <main className="admin-page caixa-page">
        <header className="admin-page-header caixa-page-header">
          <div>
            <Link href="/financeiro" className="caixa-voltar">
              <ArrowLeft size={16} />
              Voltar para o financeiro
            </Link>

            <span className="admin-eyebrow">FINANCEIRO</span>

            <h1>Caixa</h1>

            <p>Acompanhe todas as entradas e saídas financeiras.</p>
          </div>

          <div className="caixa-header-icon">
            <Wallet size={24} />
          </div>
        </header>

        <section className="caixa-resumo-grid">
          <article className="caixa-resumo-card caixa-card-saldo">
            <div className="caixa-resumo-icon">
              <Wallet size={21} />
            </div>

            <div>
              <span>Saldo</span>
              <strong>{moeda(resumo.saldo)}</strong>
            </div>
          </article>

          <article className="caixa-resumo-card caixa-card-entrada">
            <div className="caixa-resumo-icon">
              <ArrowUpCircle size={21} />
            </div>

            <div>
              <span>Entradas</span>
              <strong>{moeda(resumo.entradas)}</strong>
            </div>
          </article>

          <article className="caixa-resumo-card caixa-card-saida">
            <div className="caixa-resumo-icon">
              <ArrowDownCircle size={21} />
            </div>

            <div>
              <span>Saídas</span>
              <strong>{moeda(resumo.saidas)}</strong>
            </div>
          </article>

          <article className="caixa-resumo-card caixa-card-movimentos">
            <div className="caixa-resumo-icon">
              <CircleDollarSign size={21} />
            </div>

            <div>
              <span>Movimentações</span>
              <strong>
                {resumo.quantidadeEntradas + resumo.quantidadeSaidas}
              </strong>
            </div>
          </article>
        </section>

        <section className="admin-card caixa-lista-card">
          <div className="caixa-lista-header">
            <div>
              <span className="admin-eyebrow">MOVIMENTAÇÕES</span>

              <h2>Movimentações do caixa</h2>

              <p>
                {lancamentosFiltrados.length === 1
                  ? "1 movimentação encontrada."
                  : `${lancamentosFiltrados.length} movimentações encontradas.`}
              </p>
            </div>

            <div className="caixa-lista-icon">
              <Filter size={21} />
            </div>
          </div>

          <div className="caixa-filtros">
            <div className="caixa-busca">
              <Search size={18} />

              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar descrição, venda, compra, categoria..."
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

            <div className="caixa-filtros-linha">
              <div className="caixa-filtro-grupo">
                <span>Tipo</span>

                <div className="caixa-tabs">
                  <button
                    type="button"
                    className={filtroTipo === "todos" ? "active" : ""}
                    onClick={() => setFiltroTipo("todos")}
                  >
                    Todos
                  </button>

                  <button
                    type="button"
                    className={filtroTipo === "entrada" ? "active" : ""}
                    onClick={() => setFiltroTipo("entrada")}
                  >
                    Entradas
                  </button>

                  <button
                    type="button"
                    className={filtroTipo === "saida" ? "active" : ""}
                    onClick={() => setFiltroTipo("saida")}
                  >
                    Saídas
                  </button>
                </div>
              </div>

              <div className="caixa-filtro-grupo">
                <span>Origem</span>

                <select
                  value={filtroOrigem}
                  onChange={(event) =>
                    setFiltroOrigem(
                      event.target.value as "todas" | LancamentoCaixa["origem"],
                    )
                  }
                >
                  <option value="todas">Todas</option>
                  <option value="venda">Vendas</option>
                  <option value="compra">Compras</option>
                  <option value="manual">Manual</option>
                  <option value="ajuste">Ajustes</option>
                  <option value="estorno">Estornos</option>
                </select>
              </div>

              <label className="caixa-data-field">
                <span>De</span>

                <div>
                  <CalendarDays size={15} />

                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(event) => setDataInicio(event.target.value)}
                  />
                </div>
              </label>

              <label className="caixa-data-field">
                <span>Até</span>

                <div>
                  <CalendarDays size={15} />

                  <input
                    type="date"
                    value={dataFim}
                    onChange={(event) => setDataFim(event.target.value)}
                  />
                </div>
              </label>

              {temFiltros && (
                <button
                  type="button"
                  className="caixa-limpar-filtros"
                  onClick={limparFiltros}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {carregando ? (
            <div className="caixa-estado">Carregando movimentações...</div>
          ) : lancamentosFiltrados.length === 0 ? (
            <div className="caixa-estado caixa-estado-vazio">
              <div className="caixa-estado-icon">
                <Wallet size={25} />
              </div>

              <strong>
                {lancamentos.length === 0
                  ? "Nenhuma movimentação no caixa"
                  : "Nenhuma movimentação encontrada"}
              </strong>

              <p>
                {lancamentos.length === 0
                  ? "Os recebimentos das vendas aparecerão aqui automaticamente."
                  : "Altere os filtros ou a busca para encontrar outras movimentações."}
              </p>
            </div>
          ) : (
            <div className="caixa-tabela-wrap">
              <div className="caixa-tabela">
                <div className="caixa-tabela-head">
                  <span>DATA</span>
                  <span>DESCRIÇÃO</span>
                  <span>ORIGEM</span>
                  <span>FORMA</span>
                  <span>TIPO</span>
                  <span>VALOR</span>
                  <span />
                </div>

                {lancamentosFiltrados.map((lancamento) => {
                  const entrada = lancamento.tipo === "entrada";

                  return (
                    <div key={lancamento.id} className="caixa-tabela-row">
                      <div className="caixa-data-cell">
                        <strong>{dataBR(lancamento.data)}</strong>

                        <small>{horaBR(lancamento.data)}</small>
                      </div>

                      <div className="caixa-descricao-cell">
                        <div
                          className={`caixa-mov-icon ${
                            entrada ? "entrada" : "saida"
                          }`}
                        >
                          {entrada ? (
                            <ArrowUpCircle size={17} />
                          ) : (
                            <ArrowDownCircle size={17} />
                          )}
                        </div>

                        <div>
                          <strong>{lancamento.descricao}</strong>

                          {lancamento.categoria && (
                            <small>{lancamento.categoria}</small>
                          )}
                        </div>
                      </div>

                      <div className="caixa-origem-cell">
                        {origemLabel(lancamento.origem)}

                        {lancamento.vendaNumero && (
                          <small>Venda #{lancamento.vendaNumero}</small>
                        )}

                        {lancamento.compraNumero && (
                          <small>Compra #{lancamento.compraNumero}</small>
                        )}
                      </div>

                      <div className="caixa-forma-cell">
                        {lancamento.formaPagamento || "—"}
                      </div>

                      <div>
                        <span
                          className={`caixa-tipo ${
                            entrada ? "entrada" : "saida"
                          }`}
                        >
                          {entrada ? "Entrada" : "Saída"}
                        </span>
                      </div>

                      <div
                        className={`caixa-valor-cell ${
                          entrada ? "entrada" : "saida"
                        }`}
                      >
                        {entrada ? "+" : "-"} {moeda(lancamento.valor)}
                      </div>

                      <div className="caixa-row-arrow">
                        <ChevronRight size={17} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
