"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Search,
  WalletCards,
  XCircle,
  AlertCircle,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";

import {
  atualizarStatusContasReceber,
  buscarContasReceber,
  listarContasReceber,
  obterResumoContasReceber,
  type ContaReceber,
  type StatusContaReceber,
} from "@/data/contasReceberStore";

type FiltroStatus =
  | "todas"
  | "pendente"
  | "parcial"
  | "vencida"
  | "recebida"
  | "cancelada";

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function formatarData(data: string): string {
  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "—";
  }

  return valor.toLocaleDateString("pt-BR");
}

function obterLabelStatus(status: StatusContaReceber): string {
  switch (status) {
    case "pendente":
      return "Pendente";
    case "parcial":
      return "Parcial";
    case "vencida":
      return "Vencida";
    case "recebida":
      return "Recebida";
    case "cancelada":
      return "Cancelada";
    default:
      return status;
  }
}

function obterClasseStatus(status: StatusContaReceber): string {
  switch (status) {
    case "pendente":
      return "financeiro-status financeiro-status-pendente";

    case "parcial":
      return "financeiro-status financeiro-status-parcial";

    case "vencida":
      return "financeiro-status financeiro-status-vencida";

    case "recebida":
      return "financeiro-status financeiro-status-recebida";

    case "cancelada":
      return "financeiro-status financeiro-status-cancelada";

    default:
      return "financeiro-status";
  }
}

function obterFormaPagamento(forma: string): string {
  const mapa: Record<string, string> = {
    pix: "PIX",
    dinheiro: "Dinheiro",
    debito: "Débito",
    credito: "Crédito",
    cartao_debito: "Cartão de débito",
    cartao_credito: "Cartão de crédito",
    boleto: "Boleto",
    transferencia: "Transferência",
    cheque: "Cheque",
    outro: "Outro",
  };

  return mapa[forma] ?? forma;
}

export default function ContasReceberPage() {
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [termo, setTermo] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("todas");
  const [carregando, setCarregando] = useState(true);

  function carregarDados() {
    setCarregando(true);

    atualizarStatusContasReceber();

    const dados = listarContasReceber();

    setContas(dados);
    setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const resumo = useMemo(() => {
    return obterResumoContasReceber();
  }, [contas]);

  const contasFiltradas = useMemo(() => {
    let resultado = termo ? buscarContasReceber(termo) : listarContasReceber();

    if (filtro !== "todas") {
      resultado = resultado.filter((conta) => conta.status === filtro);
    }

    return resultado;
  }, [termo, filtro, contas]);

  const filtros: Array<{
    id: FiltroStatus;
    label: string;
    quantidade: number;
  }> = [
    {
      id: "todas",
      label: "Todas",
      quantidade: resumo.total,
    },
    {
      id: "pendente",
      label: "Pendentes",
      quantidade: resumo.pendentes,
    },
    {
      id: "parcial",
      label: "Parciais",
      quantidade: resumo.parciais,
    },
    {
      id: "vencida",
      label: "Vencidas",
      quantidade: resumo.vencidas,
    },
    {
      id: "recebida",
      label: "Recebidas",
      quantidade: resumo.recebidas,
    },
    {
      id: "cancelada",
      label: "Canceladas",
      quantidade: resumo.canceladas,
    },
  ];

  return (
    <AppShell>
      <main className="admin-page financeiro-page">
        <div className="admin-page-header">
          <div>
            <div className="admin-eyebrow">
              <CircleDollarSign size={14} />
              RECEBIMENTOS
            </div>

            <h1>Contas a receber</h1>

            <p>Acompanhe os valores que sua empresa tem a receber.</p>
          </div>

          <div className="admin-page-header-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={carregarDados}
            >
              Atualizar
            </button>
          </div>
        </div>

        {/* RESUMO */}
        <section className="admin-stats financeiro-resumo">
          <div className="admin-stat-card">
            <div className="admin-stat-icon financeiro-icon-total">
              <CircleDollarSign size={19} />
            </div>

            <span>Total a receber</span>

            <strong>{formatarMoeda(resumo.saldoAberto)}</strong>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon financeiro-icon-aberto">
              <Clock3 size={19} />
            </div>

            <span>Em aberto</span>

            <strong>
              {formatarMoeda(
                contas
                  .filter(
                    (conta) =>
                      conta.status === "pendente" || conta.status === "parcial",
                  )
                  .reduce((total, conta) => total + conta.saldo, 0),
              )}
            </strong>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon financeiro-icon-recebido">
              <CheckCircle2 size={19} />
            </div>

            <span>Recebido</span>

            <strong>{formatarMoeda(resumo.valorRecebido)}</strong>
          </div>

          <div className="admin-stat-card">
            <div className="admin-stat-icon financeiro-icon-vencido">
              <AlertCircle size={19} />
            </div>

            <span>Vencido</span>

            <strong>
              {formatarMoeda(
                contas
                  .filter((conta) => conta.status === "vencida")
                  .reduce((total, conta) => total + conta.saldo, 0),
              )}
            </strong>
          </div>
        </section>

        {/* LISTAGEM */}
        <section className="admin-card financeiro-list-card">
          <div className="admin-card-header">
            <div>
              <div className="admin-eyebrow">
                <FileText size={14} />
                CONTAS
              </div>

              <h2>Contas a receber</h2>

              <p>
                {contasFiltradas.length === 1
                  ? "1 conta encontrada."
                  : `${contasFiltradas.length} contas encontradas.`}
              </p>
            </div>

            <WalletCards size={23} />
          </div>

          {/* BUSCA + FILTROS */}
          <div className="financeiro-filtros">
            <div className="financeiro-busca">
              <Search size={18} />

              <input
                type="text"
                value={termo}
                onChange={(event) => setTermo(event.target.value)}
                placeholder="Buscar venda, cliente ou forma de pagamento..."
              />

              {termo && (
                <button
                  type="button"
                  onClick={() => setTermo("")}
                  aria-label="Limpar busca"
                >
                  <XCircle size={17} />
                </button>
              )}
            </div>

            <div className="financeiro-filtros-tabs">
              {filtros.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    filtro === item.id
                      ? "financeiro-filtro ativo"
                      : "financeiro-filtro"
                  }
                  onClick={() => setFiltro(item.id)}
                >
                  {item.label}

                  <span>{item.quantidade}</span>
                </button>
              ))}
            </div>
          </div>

          {/* TABELA */}
          <div className="financeiro-tabela-wrapper">
            {carregando ? (
              <div className="financeiro-estado">
                Carregando contas a receber...
              </div>
            ) : contasFiltradas.length === 0 ? (
              <div className="financeiro-estado">
                <FileText size={32} />

                <strong>Nenhuma conta encontrada</strong>

                <span>
                  Tente alterar os filtros ou realizar uma nova busca.
                </span>
              </div>
            ) : (
              <div className="financeiro-tabela">
                <div className="financeiro-tabela-header">
                  <span>VENDA</span>
                  <span>CLIENTE</span>
                  <span>VENCIMENTO</span>
                  <span>VALOR</span>
                  <span>SALDO</span>
                  <span>STATUS</span>
                  <span />
                </div>

                {contasFiltradas.map((conta) => (
                  <Link
                    key={conta.id}
                    href={`/financeiro/contas-receber/${conta.id}`}
                    className="financeiro-tabela-row"
                  >
                    <div>
                      <strong>#{conta.vendaNumero}</strong>

                      <small>{conta.descricao}</small>
                    </div>

                    <div className="financeiro-cliente">
                      <span className="financeiro-avatar">
                        {conta.clienteNome.trim().charAt(0).toUpperCase()}
                      </span>

                      <div>
                        <strong>{conta.clienteNome}</strong>

                        <small>
                          {obterFormaPagamento(String(conta.formaPagamento))}
                        </small>
                      </div>
                    </div>

                    <div className="financeiro-data">
                      <CalendarDays size={15} />

                      <span>{formatarData(conta.dataVencimento)}</span>
                    </div>

                    <div className="financeiro-valor">
                      {formatarMoeda(conta.valorOriginal)}
                    </div>

                    <div
                      className={
                        conta.saldo > 0
                          ? "financeiro-saldo aberto"
                          : "financeiro-saldo"
                      }
                    >
                      {formatarMoeda(conta.saldo)}
                    </div>

                    <div>
                      <span className={obterClasseStatus(conta.status)}>
                        {obterLabelStatus(conta.status)}
                      </span>
                    </div>

                    <div className="financeiro-row-arrow">
                      <ArrowRight size={18} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RESUMO INFERIOR */}
        <section className="financeiro-resumo-inferior">
          <div className="admin-card">
            <span>Contas pendentes</span>
            <strong>{resumo.pendentes}</strong>
          </div>

          <div className="admin-card">
            <span>Contas parciais</span>
            <strong>{resumo.parciais}</strong>
          </div>

          <div className="admin-card">
            <span>Contas vencidas</span>
            <strong>{resumo.vencidas}</strong>
          </div>

          <div className="admin-card">
            <span>Recebidas</span>
            <strong>{resumo.recebidas}</strong>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
