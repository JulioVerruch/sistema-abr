"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarDays,
  CircleDollarSign,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  Gauge,
  AlertTriangle,
  Warehouse,
} from "lucide-react";

import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { AppShell } from "../../components/layout/AppShell";
import {
  obterAnaliseGerencial,
  type AnaliseGerencial,
} from "../../data/analisesStore";

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function inteiro(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor || 0);
}

function percentual(valor: number | null) {
  if (valor === null) return "Sem base comparável";

  return `${valor >= 0 ? "+" : ""}${valor.toFixed(1).replace(".", ",")}%`;
}

function hojeISO() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

function primeiroDiaMesISO() {
  const d = new Date();

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(20, 20, 20, 0.96)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  color: "#fff",
};

function abreviarNumero(valor: number) {
  const n = Number(valor) || 0;

  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(".", ",")} mi`;
  }

  if (Math.abs(n) >= 1_000) {
    return `${(n / 1_000).toFixed(1).replace(".", ",")} mil`;
  }

  return n.toFixed(0);
}

function nomeCurto(valor: string, limite = 18) {
  if (valor.length <= limite) return valor;
  return `${valor.slice(0, limite - 1)}…`;
}

const vazio: AnaliseGerencial = {
  faturamento: 0,
  custoMercadorias: 0,
  lucroBruto: 0,
  margemBruta: 0,
  entradas: 0,
  saidas: 0,
  resultadoFinanceiro: 0,
  crescimentoFaturamento: 0,
  crescimentoLucroBruto: 0,
  vendasPorPeriodo: [],
  produtosMaisVendidos: [],
  produtosMaisFaturados: [],
  produtosMaisLucrativos: [],
  clientesMaisCompram: [],
  clientesMaisLucrativos: [],
  clientesMenorMargem: [],
  fornecedoresMaisComprados: [],
  fornecedoresMaisPagos: [],
  comparacaoPeriodos: null,
  alertas: [],
  vendas: {
    faturamento: 0,
    vendasConcluidas: 0,
    vendasCanceladas: 0,
    quantidadeVendida: 0,
    ticketMedio: 0,
    custoMercadorias: 0,
    lucroBruto: 0,
    margemBruta: 0,
    vendasSemCustoHistorico: 0,
    itensSemCustoHistorico: 0,
    crescimentoFaturamento: 0,
    crescimentoLucroBruto: 0,
    vendasPorPeriodo: [],
    produtosMaisVendidos: [],
    produtosMaisFaturados: [],
    produtosMaisLucrativos: [],
    produtosMenorMargem: [],
    clientesMaisCompram: [],
    vendasPorFormaPagamento: [],
  },
  financeiro: {
    entradas: 0,
    saidas: 0,
    resultado: 0,
    saldoAtual: 0,
    fluxoPorPeriodo: [],
  },
  compras: {
    totalComprado: 0,
    comprasConcluidas: 0,
    comprasCanceladas: 0,
    quantidadeCompras: 0,
    ticketMedio: 0,
  },
  estoque: {
    valorInvestido: 0,
    quantidadeProdutos: 0,
    estoqueBaixo: [],
    produtosParados: [],
    maiorGiro: [],
    menorGiro: [],
    produtos: [],
  },
};

export default function AnalisesPage() {
  const [inicio, setInicio] = useState(primeiroDiaMesISO());
  const [fim, setFim] = useState(hojeISO());
  const [dados, setDados] = useState<AnaliseGerencial>(vazio);
  const [atualizando, setAtualizando] = useState(false);

  const carregar = () => {
    setAtualizando(true);

    try {
      setDados(
        obterAnaliseGerencial({
          inicio,
          fim,
        }),
      );
    } finally {
      setAtualizando(false);
    }
  };

  useEffect(() => {
    carregar();

    const eventos = [
      "abr-agro-vendas-atualizadas",
      "abr-agro-compras-atualizadas",
      "abr-agro-caixa-atualizado",
      "abr-agro-contas-receber-atualizadas",
      "abr-agro-contas-pagar-atualizadas",
      "storage",
    ];

    eventos.forEach((evento) => window.addEventListener(evento, carregar));

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, carregar));
    };
  }, [inicio, fim]);

  const crescimentoFaturamento = dados.crescimentoFaturamento;

  const crescimentoLucro = dados.crescimentoLucroBruto;

  return (
    <AppShell
      title="Análises"
      description="Indicadores gerenciais para entender o desempenho do negócio."
    >
      <main className="admin-page analises-page">
        <header className="analises-header">
          <div>
            <Link href="/relatorios" className="analises-back">
              ← Relatórios
            </Link>

            <span className="admin-eyebrow">INTELIGÊNCIA GERENCIAL</span>

            <h1>Análises</h1>

            <p>
              Transforme os dados de vendas, estoque e financeiro em indicadores
              para tomada de decisão.
            </p>
          </div>

          <button
            type="button"
            className="btn primary analises-refresh"
            onClick={carregar}
            disabled={atualizando}
          >
            <RefreshCw size={16} className={atualizando ? "is-spinning" : ""} />
            Atualizar
          </button>
        </header>

        <section className="analises-filtros">
          <div className="analises-filtro">
            <CalendarDays size={16} />
            <label htmlFor="analise-inicio">De</label>
            <input
              id="analise-inicio"
              type="date"
              value={inicio}
              onChange={(event) => setInicio(event.target.value)}
            />
          </div>

          <div className="analises-filtro">
            <CalendarDays size={16} />
            <label htmlFor="analise-fim">Até</label>
            <input
              id="analise-fim"
              type="date"
              value={fim}
              onChange={(event) => setFim(event.target.value)}
            />
          </div>
        </section>

        <section className="analises-kpis">
          <article className="analise-kpi">
            <div className="analise-kpi-icon">
              <CircleDollarSign size={20} />
            </div>

            <span>Faturamento</span>
            <strong>{moeda(dados.faturamento)}</strong>

            <small
              className={
                crescimentoFaturamento !== null && crescimentoFaturamento < 0
                  ? "is-negative"
                  : "is-positive"
              }
            >
              {crescimentoFaturamento !== null &&
              crescimentoFaturamento >= 0 ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}
              {percentual(crescimentoFaturamento)} vs. período anterior
            </small>
          </article>

          <article className="analise-kpi">
            <div className="analise-kpi-icon">
              <TrendingUp size={20} />
            </div>

            <span>Lucro bruto</span>
            <strong>{moeda(dados.lucroBruto)}</strong>

            <small
              className={
                crescimentoLucro !== null && crescimentoLucro < 0
                  ? "is-negative"
                  : "is-positive"
              }
            >
              {crescimentoLucro !== null && crescimentoLucro >= 0 ? (
                <ArrowUpRight size={13} />
              ) : (
                <ArrowDownRight size={13} />
              )}
              {percentual(crescimentoLucro)} vs. período anterior
            </small>
          </article>

          <article className="analise-kpi">
            <div className="analise-kpi-icon">
              <BarChart3 size={20} />
            </div>

            <span>Margem bruta</span>
            <strong>{dados.margemBruta.toFixed(1).replace(".", ",")}%</strong>

            <small>{moeda(dados.custoMercadorias)} em custo</small>
          </article>

          <article className="analise-kpi">
            <div className="analise-kpi-icon">
              <ShoppingCart size={20} />
            </div>

            <span>Ticket médio</span>
            <strong>{moeda(dados.vendas.ticketMedio)}</strong>

            <small>
              {inteiro(dados.vendas.vendasConcluidas)} vendas concluídas
            </small>
          </article>

          <article className="analise-kpi">
            <div className="analise-kpi-icon">
              <Boxes size={20} />
            </div>

            <span>Resultado financeiro</span>
            <strong>{moeda(dados.resultadoFinanceiro)}</strong>

            <small>
              Entradas {moeda(dados.entradas)} · Saídas {moeda(dados.saidas)}
            </small>
          </article>
        </section>

        {dados.vendas.vendasSemCustoHistorico > 0 && (
          <section className="analises-alerta">
            <Activity size={18} />

            <div>
              <strong>Análise de margem parcialmente limitada</strong>

              <p>
                {inteiro(dados.vendas.vendasSemCustoHistorico)} venda(s) e{" "}
                {inteiro(dados.vendas.itensSemCustoHistorico)} item(ns) não
                possuem custo histórico registrado. Essas vendas não entram no
                cálculo de custo e margem.
              </p>
            </div>
          </section>
        )}

        <section
          className={`analises-alertas-gerenciais ${
            dados.alertas.length ? "has-alertas" : "is-ok"
          }`}
        >
          <header className="analises-alertas-header">
            <div>
              <span>ATENÇÃO GERENCIAL</span>
              <h2>
                {dados.alertas.length
                  ? "O que merece sua atenção agora"
                  : "Tudo sob controle"}
              </h2>
              <p>
                {dados.alertas.length
                  ? "Situações que podem exigir uma ação no negócio."
                  : "Nenhuma situação prioritária foi identificada no período selecionado."}
              </p>
            </div>

            <div className="analises-alertas-count">
              <strong>{inteiro(dados.alertas.length)}</strong>
              <span>{dados.alertas.length === 1 ? "alerta" : "alertas"}</span>
            </div>
          </header>

          {dados.alertas.length > 0 ? (
            <div className="analises-alertas-lista">
              {dados.alertas.map((alerta) => (
                <article
                  className={`analise-alerta-card is-${alerta.severidade}`}
                  key={alerta.id}
                >
                  <div className="analise-alerta-icone">
                    {alerta.severidade === "critico"
                      ? "!"
                      : alerta.severidade === "atencao"
                        ? "!"
                        : "i"}
                  </div>

                  <div className="analise-alerta-conteudo">
                    <div className="analise-alerta-topo">
                      <strong>{alerta.titulo}</strong>
                      <span>
                        {alerta.severidade === "critico"
                          ? "Crítico"
                          : alerta.severidade === "atencao"
                            ? "Atenção"
                            : "Informação"}
                      </span>
                    </div>

                    <p>{alerta.descricao}</p>

                    <div className="analise-alerta-meta">
                      {typeof alerta.valor === "number" &&
                        ![
                          "margem-baixa",
                          "cliente-baixa-margem",
                          "custos-em-alta",
                          "faturamento-em-queda",
                        ].includes(alerta.tipo) && (
                          <span>{moeda(Math.abs(alerta.valor))}</span>
                        )}

                      {typeof alerta.valor === "number" &&
                        (alerta.tipo === "margem-baixa" ||
                          alerta.tipo === "cliente-baixa-margem") && (
                          <span>
                            Margem {alerta.valor.toFixed(1).replace(".", ",")}%
                          </span>
                        )}

                      {typeof alerta.valor === "number" &&
                        alerta.tipo === "custos-em-alta" && (
                          <span>
                            Diferença{" "}
                            {alerta.valor.toFixed(1).replace(".", ",")} p.p.
                          </span>
                        )}

                      {typeof alerta.valor === "number" &&
                        alerta.tipo === "faturamento-em-queda" && (
                          <span>
                            Variação {alerta.valor.toFixed(1).replace(".", ",")}
                            %
                          </span>
                        )}

                      {typeof alerta.quantidade === "number" && (
                        <span>{inteiro(alerta.quantidade)} ocorrência(s)</span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="analises-alerta-ok">
              <div className="analise-alerta-icone">✓</div>
              <div>
                <strong>Nenhum alerta prioritário</strong>
                <p>
                  O sistema não identificou nenhuma situação crítica ou de
                  atenção para o período selecionado.
                </p>
              </div>
            </div>
          )}
        </section>

        <section className="analises-grid">
          <article className="analises-card analises-card-wide">
            <header className="analises-card-header">
              <div>
                <span>EVOLUÇÃO</span>
                <h2>Faturamento e lucro por período</h2>
              </div>

              <TrendingUp size={20} />
            </header>

            {dados.vendasPorPeriodo.length ? (
              <div className="analises-periodos">
                {dados.vendasPorPeriodo.map((item) => {
                  const maior =
                    Math.max(
                      ...dados.vendasPorPeriodo.map(
                        (linha) => linha.faturamento,
                      ),
                      0,
                    ) || 1;

                  const largura = (item.faturamento / maior) * 100;

                  return (
                    <div className="analises-periodo" key={item.periodo}>
                      <div className="analises-periodo-top">
                        <strong>{item.label}</strong>

                        <span>{moeda(item.faturamento)}</span>
                      </div>

                      <div className="analises-progress">
                        <span
                          style={{
                            width: `${largura}%`,
                          }}
                        />
                      </div>

                      <div className="analises-periodo-bottom">
                        <span>Lucro {moeda(item.lucroBruto)}</span>

                        <span>
                          Margem {item.margem.toFixed(1).replace(".", ",")}%
                        </span>

                        <span>{inteiro(item.vendas)} vendas</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="analises-empty">
                <BarChart3 size={26} />
                Nenhuma venda encontrada no período.
              </div>
            )}
          </article>

          <article className="analises-card analises-card-wide analises-chart-card">
            <header className="analises-card-header">
              <div>
                <span>DESEMPENHO</span>
                <h2>Faturamento × lucro por período</h2>
              </div>
              <TrendingUp size={20} />
            </header>

            {dados.vendasPorPeriodo.length ? (
              <div className="analises-chart">
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart
                    data={dados.vendasPorPeriodo}
                    margin={{ top: 12, right: 18, left: 0, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.52)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={abreviarNumero}
                      tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(valor: number | string, nome: string) => [
                        moeda(Number(valor)),
                        nome === "faturamento" ? "Faturamento" : "Lucro bruto",
                      ]}
                    />
                    <Legend
                      wrapperStyle={{
                        color: "rgba(255,255,255,0.62)",
                        fontSize: 11,
                      }}
                      formatter={(valor) =>
                        valor === "faturamento" ? "Faturamento" : "Lucro bruto"
                      }
                    />
                    <Bar
                      dataKey="faturamento"
                      name="faturamento"
                      fill="#d7a900"
                      radius={[6, 6, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="lucroBruto"
                      name="lucroBruto"
                      stroke="#62d69b"
                      strokeWidth={3}
                      dot={{ r: 3, fill: "#62d69b" }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="analises-empty">
                <BarChart3 size={26} />
                Não há dados suficientes para o gráfico.
              </div>
            )}
          </article>

          <article className="analises-card analises-chart-card">
            <header className="analises-card-header">
              <div>
                <span>FINANCEIRO</span>
                <h2>Entradas × saídas</h2>
              </div>
              <CircleDollarSign size={20} />
            </header>

            {dados.financeiro.fluxoPorPeriodo.length ? (
              <div className="analises-chart">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={dados.financeiro.fluxoPorPeriodo}
                    margin={{ top: 12, right: 8, left: -18, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.06)"
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={abreviarNumero}
                      tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(valor: number | string, nome: string) => [
                        moeda(Number(valor)),
                        nome === "entradas" ? "Entradas" : "Saídas",
                      ]}
                    />
                    <Legend
                      wrapperStyle={{
                        color: "rgba(255,255,255,0.62)",
                        fontSize: 10,
                      }}
                      formatter={(valor) =>
                        valor === "entradas" ? "Entradas" : "Saídas"
                      }
                    />
                    <Bar
                      dataKey="entradas"
                      name="entradas"
                      fill="#62d69b"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="saidas"
                      name="saidas"
                      fill="#ff7272"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="analises-empty">
                <CircleDollarSign size={24} />
                Sem movimentação financeira no período.
              </div>
            )}
          </article>

          <article className="analises-card analises-chart-card">
            <header className="analises-card-header">
              <div>
                <span>FORMAS DE PAGAMENTO</span>
                <h2>Participação nas vendas</h2>
              </div>
              <CircleDollarSign size={20} />
            </header>

            {dados.vendas.vendasPorFormaPagamento.length ? (
              <div className="analises-pie-layout">
                <div className="analises-chart analises-pie-chart">
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={dados.vendas.vendasPorFormaPagamento}
                        dataKey="faturamento"
                        nameKey="forma"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={2}
                      >
                        {dados.vendas.vendasPorFormaPagamento.map(
                          (item, index) => (
                            <Cell
                              key={`${item.forma}-${index}`}
                              fill={
                                [
                                  "#d7a900",
                                  "#62d69b",
                                  "#6ea8ff",
                                  "#b78cff",
                                  "#ff9f68",
                                  "#8bd3c7",
                                ][index % 6]
                              }
                            />
                          ),
                        )}
                      </Pie>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(valor: number | string) => [
                          moeda(Number(valor)),
                          "Faturamento",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="analises-pie-legend">
                  {dados.vendas.vendasPorFormaPagamento.map((item) => (
                    <div key={item.forma}>
                      <div>
                        <strong>
                          {item.forma === "nao_informado"
                            ? "Não informado"
                            : item.forma.replaceAll("_", " ")}
                        </strong>
                        <small>{item.vendas} vendas</small>
                      </div>
                      <span>
                        {item.percentual.toFixed(1).replace(".", ",")}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="analises-empty">
                <CircleDollarSign size={24} />
                Nenhuma venda com pagamento registrado.
              </div>
            )}
          </article>

          <article className="analises-card analises-card-wide analises-chart-card">
            <header className="analises-card-header">
              <div>
                <span>PRODUTOS</span>
                <h2>Faturamento × lucro dos produtos</h2>
              </div>
              <Package size={20} />
            </header>

            {dados.produtosMaisFaturados.length ? (
              <div className="analises-chart">
                <ResponsiveContainer width="100%" height={340}>
                  <BarChart
                    data={dados.produtosMaisFaturados
                      .slice(0, 10)
                      .map((item) => ({
                        ...item,
                        nomeCurto: nomeCurto(item.nome, 16),
                      }))}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 55, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={abreviarNumero}
                      tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nomeCurto"
                      tick={{ fill: "rgba(255,255,255,0.56)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      width={105}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(valor: number | string, nome: string) => [
                        moeda(Number(valor)),
                        nome === "faturamento" ? "Faturamento" : "Lucro bruto",
                      ]}
                    />
                    <Legend
                      wrapperStyle={{
                        color: "rgba(255,255,255,0.62)",
                        fontSize: 10,
                      }}
                      formatter={(valor) =>
                        valor === "faturamento" ? "Faturamento" : "Lucro bruto"
                      }
                    />
                    <Bar
                      dataKey="faturamento"
                      name="faturamento"
                      fill="#d7a900"
                      radius={[0, 5, 5, 0]}
                    />
                    <Bar
                      dataKey="lucroBruto"
                      name="lucroBruto"
                      fill="#62d69b"
                      radius={[0, 5, 5, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="analises-empty">
                <Package size={24} />
                Nenhum produto vendido no período.
              </div>
            )}
          </article>

          <article className="analises-card analises-chart-card">
            <header className="analises-card-header">
              <div>
                <span>RENTABILIDADE</span>
                <h2>Margem dos produtos</h2>
              </div>
              <TrendingUp size={20} />
            </header>

            {dados.produtosMaisLucrativos.length ? (
              <div className="analises-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={dados.produtosMaisLucrativos
                      .slice(0, 8)
                      .map((item) => ({
                        nomeCurto: nomeCurto(item.nome, 13),
                        margem: item.margem,
                      }))}
                    margin={{ top: 8, right: 8, left: -18, bottom: 35 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="nomeCurto"
                      angle={-28}
                      textAnchor="end"
                      interval={0}
                      tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(valor: number | string) => [
                        `${Number(valor).toFixed(1).replace(".", ",")}%`,
                        "Margem",
                      ]}
                    />
                    <Bar
                      dataKey="margem"
                      name="margem"
                      fill="#d7a900"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="analises-empty">
                <TrendingUp size={24} />
                Rentabilidade disponível após registrar vendas com custo
                histórico.
              </div>
            )}
          </article>

          <article className="analises-card analises-chart-card">
            <header className="analises-card-header">
              <div>
                <span>CLIENTES</span>
                <h2>Top clientes por faturamento</h2>
              </div>
              <Users size={20} />
            </header>

            {dados.clientesMaisCompram.length ? (
              <div className="analises-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={dados.clientesMaisCompram.slice(0, 8).map((item) => ({
                      nomeCurto: nomeCurto(item.nome, 14),
                      faturamento: item.faturamento,
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 12, left: 58, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={abreviarNumero}
                      tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nomeCurto"
                      tick={{ fill: "rgba(255,255,255,0.52)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      width={110}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(valor: number | string) => [
                        moeda(Number(valor)),
                        "Faturamento",
                      ]}
                    />
                    <Bar
                      dataKey="faturamento"
                      fill="#6ea8ff"
                      radius={[0, 5, 5, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="analises-empty">
                <Users size={24} />
                Nenhum cliente encontrado.
              </div>
            )}
          </article>

          <article className="analises-card analises-chart-card">
            <header className="analises-card-header">
              <div>
                <span>FORNECEDORES</span>
                <h2>Compras por fornecedor</h2>
              </div>
              <Warehouse size={20} />
            </header>

            {dados.fornecedoresMaisComprados.length ? (
              <div className="analises-chart">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={dados.fornecedoresMaisComprados
                      .slice(0, 8)
                      .map((item) => ({
                        nomeCurto: nomeCurto(item.nome, 14),
                        totalComprado: item.totalComprado,
                      }))}
                    layout="vertical"
                    margin={{ top: 5, right: 12, left: 58, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={abreviarNumero}
                      tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nomeCurto"
                      tick={{ fill: "rgba(255,255,255,0.52)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      width={110}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(valor: number | string) => [
                        moeda(Number(valor)),
                        "Total comprado",
                      ]}
                    />
                    <Bar
                      dataKey="totalComprado"
                      fill="#b78cff"
                      radius={[0, 5, 5, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="analises-empty">
                <Warehouse size={24} />
                Nenhum fornecedor encontrado.
              </div>
            )}
          </article>

          <article className="analises-card analises-card-wide analises-chart-card">
            <header className="analises-card-header">
              <div>
                <span>ESTOQUE</span>
                <h2>Estoque × vendas</h2>
              </div>
              <Warehouse size={20} />
            </header>

            {dados.estoque.produtos.length ? (
              <div className="analises-chart">
                <ResponsiveContainer width="100%" height={340}>
                  <ComposedChart
                    data={dados.estoque.produtos
                      .filter(
                        (item) =>
                          item.estoque > 0 || item.quantidadeVendida > 0,
                      )
                      .sort((a, b) => b.valorEstoque - a.valorEstoque)
                      .slice(0, 10)
                      .map((item) => ({
                        nomeCurto: nomeCurto(item.nome, 14),
                        estoque: item.estoque,
                        vendas: item.quantidadeVendida,
                      }))}
                    margin={{ top: 10, right: 15, left: 0, bottom: 45 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="nomeCurto"
                      angle={-28}
                      textAnchor="end"
                      interval={0}
                      tick={{ fill: "rgba(255,255,255,0.48)", fontSize: 8 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(valor: number | string, nome: string) => [
                        inteiro(Number(valor)),
                        nome === "estoque"
                          ? "Estoque atual"
                          : "Unidades vendidas",
                      ]}
                    />
                    <Legend
                      wrapperStyle={{
                        color: "rgba(255,255,255,0.62)",
                        fontSize: 10,
                      }}
                      formatter={(valor) =>
                        valor === "estoque"
                          ? "Estoque atual"
                          : "Unidades vendidas"
                      }
                    />
                    <Bar
                      dataKey="estoque"
                      name="estoque"
                      fill="#d7a900"
                      radius={[5, 5, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="vendas"
                      name="vendas"
                      stroke="#6ea8ff"
                      strokeWidth={3}
                      dot={{ r: 3, fill: "#6ea8ff" }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="analises-empty">
                <Warehouse size={24} />
                Nenhum produto de estoque disponível para análise.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>PRODUTOS</span>
                <h2>Mais vendidos</h2>
              </div>

              <Package size={20} />
            </header>

            {dados.produtosMaisVendidos.length ? (
              <div className="analises-ranking">
                {dados.produtosMaisVendidos
                  .slice(0, 8)
                  .map((produto, index) => (
                    <div className="analises-ranking-row" key={produto.id}>
                      <b>{index + 1}</b>

                      <div>
                        <strong>{produto.nome}</strong>
                        <small>{inteiro(produto.quantidade)} unidades</small>
                      </div>

                      <span>{moeda(produto.faturamento)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="analises-empty">
                <Package size={24} />
                Nenhum produto vendido.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>RENTABILIDADE</span>
                <h2>Produtos mais lucrativos</h2>
              </div>

              <TrendingUp size={20} />
            </header>

            {dados.produtosMaisLucrativos.length ? (
              <div className="analises-ranking">
                {dados.produtosMaisLucrativos
                  .slice(0, 8)
                  .map((produto, index) => (
                    <div className="analises-ranking-row" key={produto.id}>
                      <b>{index + 1}</b>

                      <div>
                        <strong>{produto.nome}</strong>
                        <small>
                          Margem {produto.margem.toFixed(1).replace(".", ",")}%
                        </small>
                      </div>

                      <span>{moeda(produto.lucroBruto)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="analises-empty">
                <TrendingUp size={24} />
                Ainda não há dados de custo histórico suficientes.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>CLIENTES</span>
                <h2>Quem mais compra</h2>
              </div>
              <Users size={20} />
            </header>

            {dados.clientesMaisCompram.length ? (
              <div className="analises-ranking">
                {dados.clientesMaisCompram.slice(0, 8).map((cliente, index) => (
                  <div className="analises-ranking-row" key={cliente.id}>
                    <b>{index + 1}</b>
                    <div>
                      <strong>{cliente.nome}</strong>
                      <small>
                        {inteiro(cliente.vendas)} vendas · ticket{" "}
                        {moeda(cliente.ticketMedio)}
                      </small>
                    </div>
                    <span>{moeda(cliente.faturamento)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analises-empty">
                <Users size={24} />
                Nenhum cliente encontrado.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>CLIENTES · RENTABILIDADE</span>
                <h2>Clientes mais lucrativos</h2>
              </div>
              <TrendingUp size={20} />
            </header>

            {dados.clientesMaisLucrativos.length ? (
              <div className="analises-ranking">
                {dados.clientesMaisLucrativos
                  .slice(0, 8)
                  .map((cliente, index) => (
                    <div className="analises-ranking-row" key={cliente.id}>
                      <b>{index + 1}</b>
                      <div>
                        <strong>{cliente.nome}</strong>
                        <small>
                          Margem {cliente.margem.toFixed(1).replace(".", ",")}%
                        </small>
                      </div>
                      <span>{moeda(cliente.lucroBruto)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="analises-empty">
                <TrendingUp size={24} />
                Ainda não há dados suficientes de custo histórico.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>CLIENTES · ATENÇÃO</span>
                <h2>Menor margem</h2>
              </div>
              <AlertTriangle size={20} />
            </header>

            {dados.clientesMenorMargem.length ? (
              <div className="analises-ranking">
                {dados.clientesMenorMargem.slice(0, 8).map((cliente, index) => (
                  <div className="analises-ranking-row" key={cliente.id}>
                    <b>{index + 1}</b>
                    <div>
                      <strong>{cliente.nome}</strong>
                      <small>
                        {inteiro(cliente.vendas)} vendas ·{" "}
                        {moeda(cliente.faturamento)}
                      </small>
                    </div>
                    <span className="analises-value-danger">
                      {cliente.margem.toFixed(1).replace(".", ",")}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analises-empty">
                <AlertTriangle size={24} />
                Nenhum cliente com margem calculável.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>FORNECEDORES</span>
                <h2>Maior volume comprado</h2>
              </div>
              <Warehouse size={20} />
            </header>

            {dados.fornecedoresMaisComprados.length ? (
              <div className="analises-ranking">
                {dados.fornecedoresMaisComprados
                  .slice(0, 8)
                  .map((fornecedor, index) => (
                    <div className="analises-ranking-row" key={fornecedor.id}>
                      <b>{index + 1}</b>
                      <div>
                        <strong>{fornecedor.nome}</strong>
                        <small>
                          {inteiro(fornecedor.compras)} compras ·{" "}
                          {fornecedor.percentualCompras
                            .toFixed(1)
                            .replace(".", ",")}
                          % do total
                        </small>
                      </div>
                      <span>{moeda(fornecedor.totalComprado)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="analises-empty">
                <Warehouse size={24} />
                Nenhuma compra encontrada.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>FORNECEDORES · FINANCEIRO</span>
                <h2>Mais pagos</h2>
              </div>
              <CircleDollarSign size={20} />
            </header>

            {dados.fornecedoresMaisPagos.length ? (
              <div className="analises-ranking">
                {dados.fornecedoresMaisPagos
                  .slice(0, 8)
                  .map((fornecedor, index) => (
                    <div className="analises-ranking-row" key={fornecedor.id}>
                      <b>{index + 1}</b>
                      <div>
                        <strong>{fornecedor.nome}</strong>
                        <small>
                          Pago {moeda(fornecedor.totalPago)} · pendente{" "}
                          {moeda(fornecedor.saldoPendente)}
                        </small>
                      </div>
                      <span>{moeda(fornecedor.totalPago)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="analises-empty">
                <CircleDollarSign size={24} />
                Nenhum pagamento de fornecedor encontrado.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>FINANCEIRO</span>
                <h2>Fluxo de caixa</h2>
              </div>
              <CircleDollarSign size={20} />
            </header>

            <div className="analises-financeiro">
              <div>
                <span>Entradas</span>
                <strong className="is-positive">{moeda(dados.entradas)}</strong>
              </div>
              <div>
                <span>Saídas</span>
                <strong className="is-negative">{moeda(dados.saidas)}</strong>
              </div>
              <div>
                <span>Resultado</span>
                <strong>{moeda(dados.resultadoFinanceiro)}</strong>
              </div>
              <div>
                <span>Saldo atual</span>
                <strong>{moeda(dados.financeiro.saldoAtual)}</strong>
              </div>
            </div>
          </article>

          {dados.comparacaoPeriodos && (
            <article className="analises-card analises-card-wide analises-comparacao-card">
              <header className="analises-card-header">
                <div>
                  <span>COMPARAÇÃO</span>
                  <h2>Período atual × período anterior</h2>
                </div>
                <Activity size={20} />
              </header>

              <div className="analises-comparacao">
                <div>
                  <span>Faturamento</span>
                  <strong
                    className={
                      dados.comparacaoPeriodos.variacao.faturamento !== null &&
                      dados.comparacaoPeriodos.variacao.faturamento < 0
                        ? "is-negative"
                        : "is-positive"
                    }
                  >
                    {percentual(dados.comparacaoPeriodos.variacao.faturamento)}
                  </strong>
                </div>
                <div>
                  <span>Vendas</span>
                  <strong
                    className={
                      dados.comparacaoPeriodos.variacao.vendas !== null &&
                      dados.comparacaoPeriodos.variacao.vendas < 0
                        ? "is-negative"
                        : "is-positive"
                    }
                  >
                    {percentual(dados.comparacaoPeriodos.variacao.vendas)}
                  </strong>
                </div>
                <div>
                  <span>Quantidade vendida</span>
                  <strong
                    className={
                      dados.comparacaoPeriodos.variacao.quantidadeVendida !==
                        null &&
                      dados.comparacaoPeriodos.variacao.quantidadeVendida < 0
                        ? "is-negative"
                        : "is-positive"
                    }
                  >
                    {percentual(
                      dados.comparacaoPeriodos.variacao.quantidadeVendida,
                    )}
                  </strong>
                </div>
                <div>
                  <span>Ticket médio</span>
                  <strong
                    className={
                      dados.comparacaoPeriodos.variacao.ticketMedio !== null &&
                      dados.comparacaoPeriodos.variacao.ticketMedio < 0
                        ? "is-negative"
                        : "is-positive"
                    }
                  >
                    {percentual(dados.comparacaoPeriodos.variacao.ticketMedio)}
                  </strong>
                </div>
                <div>
                  <span>Custo mercadorias</span>
                  <strong
                    className={
                      dados.comparacaoPeriodos.variacao.custoMercadorias !==
                        null &&
                      dados.comparacaoPeriodos.variacao.custoMercadorias > 0
                        ? "is-negative"
                        : "is-positive"
                    }
                  >
                    {percentual(
                      dados.comparacaoPeriodos.variacao.custoMercadorias,
                    )}
                  </strong>
                </div>
                <div>
                  <span>Lucro bruto</span>
                  <strong
                    className={
                      dados.comparacaoPeriodos.variacao.lucroBruto !== null &&
                      dados.comparacaoPeriodos.variacao.lucroBruto < 0
                        ? "is-negative"
                        : "is-positive"
                    }
                  >
                    {percentual(dados.comparacaoPeriodos.variacao.lucroBruto)}
                  </strong>
                </div>
                <div>
                  <span>Margem bruta</span>
                  <strong
                    className={
                      dados.comparacaoPeriodos.variacao.margemBrutaPp !==
                        null &&
                      dados.comparacaoPeriodos.variacao.margemBrutaPp < 0
                        ? "is-negative"
                        : "is-positive"
                    }
                  >
                    {dados.comparacaoPeriodos.variacao.margemBrutaPp === null
                      ? "—"
                      : `${dados.comparacaoPeriodos.variacao.margemBrutaPp >= 0 ? "+" : ""}${dados.comparacaoPeriodos.variacao.margemBrutaPp.toFixed(1).replace(".", ",")} p.p.`}
                  </strong>
                </div>
                <div>
                  <span>Total comprado</span>
                  <strong
                    className={
                      dados.comparacaoPeriodos.variacao.totalComprado !==
                        null &&
                      dados.comparacaoPeriodos.variacao.totalComprado < 0
                        ? "is-positive"
                        : "is-negative"
                    }
                  >
                    {percentual(
                      dados.comparacaoPeriodos.variacao.totalComprado,
                    )}
                  </strong>
                </div>
                <div>
                  <span>Resultado financeiro</span>
                  <strong
                    className={
                      dados.comparacaoPeriodos.variacao.resultadoFinanceiro !==
                        null &&
                      dados.comparacaoPeriodos.variacao.resultadoFinanceiro < 0
                        ? "is-negative"
                        : "is-positive"
                    }
                  >
                    {percentual(
                      dados.comparacaoPeriodos.variacao.resultadoFinanceiro,
                    )}
                  </strong>
                </div>
              </div>
            </article>
          )}
        </section>

        <section className="analises-grid analises-estoque-section">
          <article className="analises-card analises-card-wide">
            <header className="analises-card-header">
              <div>
                <span>ESTOQUE</span>
                <h2>Visão de estoque e giro</h2>
              </div>
              <Warehouse size={20} />
            </header>

            <div className="analises-estoque-kpis">
              <div>
                <span>Valor investido em estoque</span>
                <strong>{moeda(dados.estoque.valorInvestido)}</strong>
              </div>
              <div>
                <span>Produtos monitorados</span>
                <strong>{inteiro(dados.estoque.quantidadeProdutos)}</strong>
              </div>
              <div>
                <span>Estoque baixo</span>
                <strong
                  className={
                    dados.estoque.estoqueBaixo.length
                      ? "is-negative"
                      : "is-positive"
                  }
                >
                  {inteiro(dados.estoque.estoqueBaixo.length)}
                </strong>
              </div>
              <div>
                <span>Produtos parados</span>
                <strong>{inteiro(dados.estoque.produtosParados.length)}</strong>
              </div>
            </div>
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>GIRO</span>
                <h2>Maior giro</h2>
              </div>
              <Gauge size={20} />
            </header>

            {dados.estoque.maiorGiro.length ? (
              <div className="analises-ranking">
                {dados.estoque.maiorGiro.slice(0, 8).map((produto, index) => (
                  <div className="analises-ranking-row" key={produto.id}>
                    <b>{index + 1}</b>
                    <div>
                      <strong>{produto.nome}</strong>
                      <small>
                        {inteiro(produto.quantidadeVendida)} un. vendidas ·
                        estoque {inteiro(produto.estoque)}
                      </small>
                    </div>
                    <span>{produto.giro.toFixed(1).replace(".", ",")}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analises-empty">
                <Gauge size={24} />
                Ainda não há vendas no período.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>ATENÇÃO</span>
                <h2>Estoque baixo</h2>
              </div>
              <AlertTriangle size={20} />
            </header>

            {dados.estoque.estoqueBaixo.length ? (
              <div className="analises-ranking">
                {dados.estoque.estoqueBaixo
                  .slice(0, 8)
                  .map((produto, index) => (
                    <div className="analises-ranking-row" key={produto.id}>
                      <b>{index + 1}</b>
                      <div>
                        <strong>{produto.nome}</strong>
                        <small>
                          Estoque {inteiro(produto.estoque)} · mínimo{" "}
                          {inteiro(produto.estoqueMinimo)}
                        </small>
                      </div>
                      <span>{moeda(produto.valorEstoque)}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="analises-empty">
                <AlertTriangle size={24} />
                Nenhum produto abaixo do mínimo.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>BAIXO GIRO</span>
                <h2>Produtos que exigem atenção</h2>
              </div>
              <Package size={20} />
            </header>

            {dados.estoque.menorGiro.length ? (
              <div className="analises-ranking">
                {dados.estoque.menorGiro.slice(0, 8).map((produto, index) => (
                  <div className="analises-ranking-row" key={produto.id}>
                    <b>{index + 1}</b>
                    <div>
                      <strong>{produto.nome}</strong>
                      <small>
                        {inteiro(produto.quantidadeVendida)} un. vendidas ·
                        estoque {inteiro(produto.estoque)}
                      </small>
                    </div>
                    <span>{produto.giro.toFixed(2).replace(".", ",")}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="analises-empty">
                <Package size={24} />
                Nenhum produto com vendas no período.
              </div>
            )}
          </article>

          <article className="analises-card">
            <header className="analises-card-header">
              <div>
                <span>PRODUTOS PARADOS</span>
                <h2>Estoque sem vendas</h2>
              </div>
              <AlertTriangle size={20} />
            </header>

            {dados.estoque.produtosParados.length ? (
              <div className="analises-ranking">
                {dados.estoque.produtosParados
                  .slice(0, 8)
                  .map((produto, index) => (
                    <div className="analises-ranking-row" key={produto.id}>
                      <b>{index + 1}</b>
                      <div>
                        <strong>{produto.nome}</strong>
                        <small>
                          {inteiro(produto.estoque)} em estoque ·{" "}
                          {moeda(produto.valorEstoque)} investidos
                        </small>
                      </div>
                      <span>0 vendas</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="analises-empty">
                <Package size={24} />
                Não há produtos parados no período.
              </div>
            )}
          </article>
        </section>
      </main>
    </AppShell>
  );
}
