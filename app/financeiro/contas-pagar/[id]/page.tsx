"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FileText,
  Receipt,
  Wallet,
  X,
} from "lucide-react";

import { AppShell } from "../../../../components/layout/AppShell";

import {
  obterContaPagar,
  registrarPagamento,
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

function dataInput(data: string) {
  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return valor.toISOString().slice(0, 10);
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
  return `contas-pagar-detalhe-status ${status}`;
}

export default function ContaPagarDetalhePage() {
  const params = useParams();
  const router = useRouter();

  const id = String(params.id);

  const [conta, setConta] = useState<ContaPagar | null>(null);

  const [carregando, setCarregando] = useState(true);

  const [modalPagamento, setModalPagamento] = useState(false);

  const [valorPagamento, setValorPagamento] = useState("");

  const [formaPagamento, setFormaPagamento] = useState("");

  const [dataPagamento, setDataPagamento] = useState("");

  const [observacao, setObservacao] = useState("");

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] = useState("");

  const [salvando, setSalvando] = useState(false);

  function carregarConta() {
    setCarregando(true);

    const encontrada = obterContaPagar(id);

    setConta(encontrada);

    if (encontrada) {
      setFormaPagamento(encontrada.formaPagamento || "Não informado");

      setDataPagamento(dataInput(new Date().toISOString()));
    }

    setCarregando(false);
  }

  useEffect(() => {
    carregarConta();

    const atualizar = () => {
      carregarConta();
    };

    window.addEventListener("abr-agro-contas-pagar-atualizadas", atualizar);

    return () => {
      window.removeEventListener(
        "abr-agro-contas-pagar-atualizadas",
        atualizar,
      );
    };
  }, [id]);

  const percentualPago = useMemo(() => {
    if (!conta || conta.valorOriginal <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, (conta.valorPago / conta.valorOriginal) * 100),
    );
  }, [conta]);

  function abrirPagamento() {
    if (!conta) {
      return;
    }

    if (conta.saldo <= 0) {
      return;
    }

    setErro("");
    setSucesso("");

    setValorPagamento(conta.saldo.toFixed(2).replace(".", ","));

    setFormaPagamento(conta.formaPagamento || "Não informado");

    setDataPagamento(dataInput(new Date().toISOString()));

    setObservacao("");

    setModalPagamento(true);
  }

  function fecharPagamento() {
    if (salvando) {
      return;
    }

    setModalPagamento(false);
    setErro("");
  }

  function converterValor(valor: string): number {
    const limpo = valor.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");

    return Number(limpo);
  }

  function confirmarPagamento() {
    if (!conta) {
      return;
    }

    setErro("");
    setSucesso("");

    const valor = converterValor(valorPagamento);

    if (!Number.isFinite(valor) || valor <= 0) {
      setErro("Informe um valor de pagamento válido.");
      return;
    }

    if (valor > conta.saldo + 0.001) {
      setErro(
        `O pagamento não pode ser maior que o saldo de ${moeda(conta.saldo)}.`,
      );
      return;
    }

    if (!formaPagamento.trim()) {
      setErro("Informe a forma de pagamento.");
      return;
    }

    if (!dataPagamento) {
      setErro("Informe a data do pagamento.");
      return;
    }

    setSalvando(true);

    try {
      const resultado = registrarPagamento({
        contaId: conta.id,

        valor,

        formaPagamento: formaPagamento.trim(),

        data: new Date(`${dataPagamento}T12:00:00`).toISOString(),

        observacao: observacao.trim() || undefined,
      });

      if (!resultado.sucesso) {
        setErro(resultado.mensagem);
        setSalvando(false);
        return;
      }

      if (resultado.conta) {
        setConta(resultado.conta);
      }

      setSucesso(resultado.mensagem);

      setModalPagamento(false);
      setSalvando(false);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível registrar o pagamento.",
      );

      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <AppShell
        title="Conta a Pagar"
        description="Detalhes da obrigação financeira."
      >
        <main className="admin-page contas-pagar-detalhe-page">
          <div className="contas-pagar-detalhe-estado">Carregando conta...</div>
        </main>
      </AppShell>
    );
  }

  if (!conta) {
    return (
      <AppShell
        title="Conta a Pagar"
        description="Detalhes da obrigação financeira."
      >
        <main className="admin-page contas-pagar-detalhe-page">
          <div className="contas-pagar-detalhe-estado vazio">
            <Receipt size={28} />

            <strong>Conta não encontrada</strong>

            <p>A conta solicitada não existe ou foi removida.</p>

            <Link href="/financeiro/contas-pagar" className="btn btn-primary">
              Voltar para Contas a Pagar
            </Link>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Conta a Pagar"
      description={`Detalhes da conta ${conta.id}.`}
    >
      <main className="admin-page contas-pagar-detalhe-page">
        <header className="admin-page-header contas-pagar-detalhe-header">
          <div>
            <Link
              href="/financeiro/contas-pagar"
              className="contas-pagar-detalhe-voltar"
            >
              <ArrowLeft size={16} />
              Voltar para Contas a Pagar
            </Link>

            <span className="admin-eyebrow">CONTA A PAGAR</span>

            <h1>{conta.fornecedorNome}</h1>

            <p>
              {conta.descricao}
              {conta.compraNumero ? ` · Compra #${conta.compraNumero}` : ""}
            </p>
          </div>

          <span className={statusClasse(conta.status)}>
            {statusLabel(conta.status)}
          </span>
        </header>

        {sucesso && (
          <div className="contas-pagar-feedback sucesso">
            <CheckCircle2 size={18} />

            <span>{sucesso}</span>
          </div>
        )}

        <section className="contas-pagar-detalhe-grid">
          <div className="contas-pagar-detalhe-main">
            <section className="admin-card contas-pagar-financeiro-card">
              <div className="contas-pagar-card-heading">
                <div>
                  <span className="admin-eyebrow">RESUMO FINANCEIRO</span>

                  <h2>Situação da conta</h2>
                </div>

                <CircleDollarSign size={22} />
              </div>

              <div className="contas-pagar-valores-grid">
                <div>
                  <span>Valor original</span>
                  <strong>{moeda(conta.valorOriginal)}</strong>
                </div>

                <div>
                  <span>Valor pago</span>
                  <strong className="pago">{moeda(conta.valorPago)}</strong>
                </div>

                <div>
                  <span>Saldo</span>
                  <strong className="saldo">{moeda(conta.saldo)}</strong>
                </div>
              </div>

              <div className="contas-pagar-progress">
                <div
                  style={{
                    width: `${percentualPago}%`,
                  }}
                />
              </div>

              <div className="contas-pagar-progress-info">
                <span>{percentualPago.toFixed(0)}% pago</span>

                <span>{moeda(conta.saldo)} restante</span>
              </div>
            </section>

            <section className="admin-card contas-pagar-parcelas-card">
              <div className="contas-pagar-card-heading">
                <div>
                  <span className="admin-eyebrow">PARCELAMENTO</span>

                  <h2>Parcelas</h2>
                </div>

                <CalendarDays size={22} />
              </div>

              <div className="contas-pagar-parcelas">
                {conta.parcelas.map((parcela) => (
                  <div key={parcela.id} className="contas-pagar-parcela">
                    <div className="contas-pagar-parcela-numero">
                      <strong>{parcela.numero}</strong>
                    </div>

                    <div className="contas-pagar-parcela-info">
                      <strong>Parcela {parcela.numero}</strong>

                      <small>Vencimento {dataBR(parcela.vencimento)}</small>
                    </div>

                    <div className="contas-pagar-parcela-valores">
                      <strong>{moeda(parcela.valorOriginal)}</strong>

                      <small>Pago: {moeda(parcela.valorPago)}</small>
                    </div>

                    <div>
                      <span className={statusClasse(parcela.status)}>
                        {statusLabel(parcela.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-card contas-pagar-pagamentos-card">
              <div className="contas-pagar-card-heading">
                <div>
                  <span className="admin-eyebrow">HISTÓRICO</span>

                  <h2>Pagamentos</h2>
                </div>

                <CreditCard size={22} />
              </div>

              {conta.pagamentos.length === 0 ? (
                <div className="contas-pagar-sem-pagamentos">
                  <FileText size={22} />

                  <strong>Nenhum pagamento registrado</strong>

                  <p>Os pagamentos realizados aparecerão aqui.</p>
                </div>
              ) : (
                <div className="contas-pagar-historico">
                  {conta.pagamentos
                    .slice()
                    .reverse()
                    .map((pagamento) => (
                      <div
                        key={pagamento.id}
                        className="contas-pagar-historico-item"
                      >
                        <div className="contas-pagar-historico-icon">
                          <CheckCircle2 size={17} />
                        </div>

                        <div className="contas-pagar-historico-info">
                          <strong>{moeda(pagamento.valor)}</strong>

                          <small>
                            {dataBR(pagamento.data)} ·{" "}
                            {pagamento.formaPagamento}
                          </small>

                          {pagamento.observacao && (
                            <small>{pagamento.observacao}</small>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>

          <aside className="contas-pagar-detalhe-sidebar">
            <section className="admin-card contas-pagar-pagar-card">
              {conta.saldo > 0 && conta.status !== "cancelada" ? (
                <>
                  <div className="contas-pagar-pagar-icon">
                    <Wallet size={23} />
                  </div>

                  <span className="admin-eyebrow">PAGAMENTO</span>

                  <h2>Registrar pagamento</h2>

                  <p>
                    Registre um pagamento parcial ou quite o saldo total desta
                    conta.
                  </p>

                  <div className="contas-pagar-pagar-saldo">
                    <span>Saldo atual</span>

                    <strong>{moeda(conta.saldo)}</strong>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary contas-pagar-pagar-btn"
                    onClick={abrirPagamento}
                  >
                    Registrar pagamento
                  </button>
                </>
              ) : (
                <div className="contas-pagar-paga-box">
                  <CheckCircle2 size={30} />

                  <strong>
                    {conta.status === "cancelada"
                      ? "Conta cancelada"
                      : "Conta totalmente paga"}
                  </strong>

                  <p>
                    {conta.status === "cancelada"
                      ? "Esta obrigação não possui mais pagamentos pendentes."
                      : "Não existem valores pendentes para esta conta."}
                  </p>
                </div>
              )}
            </section>

            <section className="admin-card contas-pagar-dados-card">
              <div className="contas-pagar-card-heading">
                <div>
                  <span className="admin-eyebrow">INFORMAÇÕES</span>

                  <h2>Dados da conta</h2>
                </div>
              </div>

              <div className="contas-pagar-dados">
                <div>
                  <span>Fornecedor</span>

                  <strong>{conta.fornecedorNome}</strong>
                </div>

                <div>
                  <span>Compra</span>

                  <strong>
                    {conta.compraNumero ? `#${conta.compraNumero}` : "—"}
                  </strong>
                </div>

                <div>
                  <span>Emissão</span>

                  <strong>{dataBR(conta.dataEmissao)}</strong>
                </div>

                <div>
                  <span>Vencimento</span>

                  <strong>{dataBR(conta.dataVencimento)}</strong>
                </div>

                <div>
                  <span>Forma de pagamento</span>

                  <strong>{conta.formaPagamento || "Não informado"}</strong>
                </div>

                {conta.observacao && (
                  <div>
                    <span>Observação</span>

                    <strong>{conta.observacao}</strong>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </section>

        {modalPagamento && (
          <div
            className="contas-pagar-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                fecharPagamento();
              }
            }}
          >
            <div className="contas-pagar-modal">
              <div className="contas-pagar-modal-header">
                <div>
                  <span className="admin-eyebrow">NOVO PAGAMENTO</span>

                  <h2>Registrar pagamento</h2>
                </div>

                <button
                  type="button"
                  className="contas-pagar-modal-close"
                  onClick={fecharPagamento}
                  disabled={salvando}
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="contas-pagar-modal-saldo">
                <span>Saldo disponível</span>

                <strong>{moeda(conta.saldo)}</strong>
              </div>

              {erro && (
                <div className="contas-pagar-feedback erro">
                  <span>{erro}</span>
                </div>
              )}

              <div className="contas-pagar-form">
                <label className="form-field">
                  <span>Valor do pagamento</span>

                  <div className="contas-pagar-money">
                    <span>R$</span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={valorPagamento}
                      onChange={(event) =>
                        setValorPagamento(event.target.value)
                      }
                      placeholder="0,00"
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span>Forma de pagamento</span>

                  <select
                    value={formaPagamento}
                    onChange={(event) => setFormaPagamento(event.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de débito">Cartão de débito</option>
                    <option value="Cartão de crédito">Cartão de crédito</option>
                    <option value="Transferência">Transferência</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Data do pagamento</span>

                  <div className="contas-pagar-date">
                    <CalendarDays size={16} />

                    <input
                      type="date"
                      value={dataPagamento}
                      onChange={(event) => setDataPagamento(event.target.value)}
                    />
                  </div>
                </label>

                <label className="form-field">
                  <span>Observação</span>

                  <textarea
                    value={observacao}
                    onChange={(event) => setObservacao(event.target.value)}
                    placeholder="Observação opcional..."
                    rows={3}
                  />
                </label>
              </div>

              <div className="contas-pagar-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={fecharPagamento}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmarPagamento}
                  disabled={salvando}
                >
                  {salvando ? "Registrando..." : "Confirmar pagamento"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
