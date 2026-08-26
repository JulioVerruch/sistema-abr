"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  FileText,
  ReceiptText,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";

import { AppShell } from "../../../../components/layout/AppShell";
import {
  obterContaReceber,
  registrarRecebimento,
  type ContaReceber,
  type StatusContaReceber,
} from "@/data/contasReceberStore";

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function dataBR(data: string) {
  const d = new Date(data);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
}

function statusLabel(status: StatusContaReceber) {
  return {
    pendente: "Pendente",
    parcial: "Parcial",
    recebida: "Recebida",
    vencida: "Vencida",
    cancelada: "Cancelada",
  }[status];
}

function statusClass(status: StatusContaReceber) {
  return `financeiro-status financeiro-status-${status}`;
}

export default function ContaReceberDetalhesPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const id = params?.id;

  const [conta, setConta] = useState<ContaReceber | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [modalRecebimento, setModalRecebimento] = useState(false);
  const [valor, setValor] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("");
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [observacao, setObservacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  function carregar() {
    if (!id) return;

    setCarregando(true);
    setConta(obterContaReceber(id));
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, [id]);

  const parcelaAberta = useMemo(
    () =>
      conta?.parcelas.find(
        (parcela) => parcela.saldo > 0 && parcela.status !== "cancelada",
      ),
    [conta],
  );

  function abrirRecebimento() {
    if (!conta || conta.saldo <= 0) return;

    setMensagem("");
    setErro("");
    setValor(
      parcelaAberta
        ? parcelaAberta.saldo.toFixed(2).replace(".", ",")
        : conta.saldo.toFixed(2).replace(".", ","),
    );
    setFormaPagamento(conta.formaPagamento);
    setDataRecebimento(new Date().toISOString().slice(0, 10));
    setObservacao("");
    setModalRecebimento(true);
  }

  function fecharRecebimento() {
    if (mensagem) {
      carregar();
    }

    setModalRecebimento(false);
    setErro("");
    setMensagem("");
  }

  function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!conta) return;

    const valorNumerico = Number(valor.replace(/\./g, "").replace(",", "."));

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro("Informe um valor de recebimento válido.");
      return;
    }

    if (valorNumerico > conta.saldo + 0.001) {
      setErro(
        `O valor não pode ser maior que o saldo de ${moeda(conta.saldo)}.`,
      );
      return;
    }

    if (!formaPagamento) {
      setErro("Selecione a forma de recebimento.");
      return;
    }

    const resultado = registrarRecebimento({
      contaId: conta.id,
      parcelaId: parcelaAberta?.id,
      valor: valorNumerico,
      formaPagamento: formaPagamento as never,
      data: dataRecebimento
        ? new Date(`${dataRecebimento}T12:00:00`).toISOString()
        : undefined,
      observacao: observacao.trim() || undefined,
    });

    if (!resultado.sucesso) {
      setErro(resultado.mensagem);
      return;
    }

    setConta(resultado.conta ?? null);
    setMensagem(resultado.mensagem);
    setErro("");
  }

  if (carregando) {
    return (
      <AppShell
        title="Conta a receber"
        description="Detalhes financeiros da conta."
      >
        <main className="admin-page financeiro-detalhe-page">
          <div className="financeiro-estado">Carregando conta...</div>
        </main>
      </AppShell>
    );
  }

  if (!conta) {
    return (
      <AppShell
        title="Conta a receber"
        description="Detalhes financeiros da conta."
      >
        <main className="admin-page financeiro-detalhe-page">
          <section className="admin-card financeiro-estado financeiro-estado-vazio">
            <div className="financeiro-estado-icon">
              <XCircle size={25} />
            </div>
            <strong>Conta não encontrada</strong>
            <p>A conta a receber solicitada não existe ou foi removida.</p>
            <Link href="/financeiro" className="btn btn-primary">
              Voltar para o financeiro
            </Link>
          </section>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Conta a receber"
      description={`Venda #${conta.vendaNumero}`}
    >
      <main className="admin-page financeiro-detalhe-page">
        <header className="admin-page-header financeiro-detalhe-header">
          <div>
            <Link href="/financeiro" className="financeiro-voltar">
              <ArrowLeft size={16} />
              Voltar para o financeiro
            </Link>

            <span className="admin-eyebrow">CONTA A RECEBER</span>

            <h1>Venda #{conta.vendaNumero}</h1>

            <p>{conta.descricao}</p>
          </div>

          <span className={statusClass(conta.status)}>
            {statusLabel(conta.status)}
          </span>
        </header>

        <section className="financeiro-detalhe-grid">
          <div className="financeiro-detalhe-main">
            <section className="admin-card financeiro-detalhe-card">
              <div className="financeiro-detalhe-card-header">
                <div>
                  <span className="admin-eyebrow">RESUMO FINANCEIRO</span>
                  <h2>Valores da conta</h2>
                </div>
                <CircleDollarSign size={22} />
              </div>

              <div className="financeiro-valores-grid">
                <div>
                  <span>Valor original</span>
                  <strong>{moeda(conta.valorOriginal)}</strong>
                </div>

                <div>
                  <span>Recebido</span>
                  <strong className="financeiro-valor-recebido">
                    {moeda(conta.valorRecebido)}
                  </strong>
                </div>

                <div>
                  <span>Saldo</span>
                  <strong className="financeiro-valor-saldo">
                    {moeda(conta.saldo)}
                  </strong>
                </div>
              </div>

              <div className="financeiro-progress">
                <div
                  style={{
                    width: `${
                      conta.valorOriginal > 0
                        ? Math.min(
                            100,
                            (conta.valorRecebido / conta.valorOriginal) * 100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </section>

            <section className="admin-card financeiro-detalhe-card">
              <div className="financeiro-detalhe-card-header">
                <div>
                  <span className="admin-eyebrow">PARCELAMENTO</span>
                  <h2>Parcelas</h2>
                </div>
                <ReceiptText size={22} />
              </div>

              <div className="financeiro-parcelas">
                {conta.parcelas.map((parcela) => (
                  <div key={parcela.id} className="financeiro-parcela">
                    <div className="financeiro-parcela-numero">
                      <strong>{parcela.numero}</strong>
                    </div>

                    <div className="financeiro-parcela-info">
                      <strong>Parcela {parcela.numero}</strong>
                      <small>Vencimento: {dataBR(parcela.vencimento)}</small>
                    </div>

                    <div className="financeiro-parcela-valores">
                      <strong>{moeda(parcela.valorOriginal)}</strong>
                      <small>Saldo: {moeda(parcela.saldo)}</small>
                    </div>

                    <span className={statusClass(parcela.status)}>
                      {statusLabel(parcela.status)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="financeiro-detalhe-sidebar">
            <section className="admin-card financeiro-detalhe-card">
              <div className="financeiro-detalhe-card-header">
                <div>
                  <span className="admin-eyebrow">CLIENTE</span>
                  <h2>Dados</h2>
                </div>
                <UserRound size={22} />
              </div>

              <div className="financeiro-detalhe-info">
                <div>
                  <span>Cliente</span>
                  <strong>{conta.clienteNome}</strong>
                </div>

                <div>
                  <span>Forma de pagamento</span>
                  <strong>{conta.formaPagamento}</strong>
                </div>

                <div>
                  <span>Emissão</span>
                  <strong>{dataBR(conta.dataEmissao)}</strong>
                </div>

                <div>
                  <span>Próximo vencimento</span>
                  <strong>
                    {parcelaAberta
                      ? dataBR(parcelaAberta.vencimento)
                      : dataBR(conta.dataVencimento)}
                  </strong>
                </div>
              </div>
            </section>

            {conta.saldo > 0 && conta.status !== "cancelada" ? (
              <section className="admin-card financeiro-receber-card">
                <div className="financeiro-receber-icon">
                  <Wallet size={21} />
                </div>

                <span className="admin-eyebrow">RECEBIMENTO</span>

                <h2>Registrar recebimento</h2>

                <p>
                  Registre um recebimento parcial ou quite o saldo da conta.
                </p>

                <button
                  type="button"
                  className="btn btn-primary financeiro-receber-btn"
                  onClick={abrirRecebimento}
                >
                  <CircleDollarSign size={17} />
                  Receber {moeda(conta.saldo)}
                </button>
              </section>
            ) : (
              <section className="admin-card financeiro-receber-card financeiro-receber-concluido">
                <CheckCircle2 size={28} />
                <strong>
                  {conta.status === "cancelada"
                    ? "Conta cancelada"
                    : "Conta totalmente recebida"}
                </strong>
                <p>Não existem valores pendentes nesta conta.</p>
              </section>
            )}
          </aside>
        </section>

        {modalRecebimento && (
          <div
            className="financeiro-modal-overlay"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                fecharRecebimento();
              }
            }}
          >
            <div
              className="financeiro-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="recebimento-title"
            >
              <div className="financeiro-modal-header">
                <div>
                  <span className="admin-eyebrow">NOVO RECEBIMENTO</span>
                  <h2 id="recebimento-title">Registrar recebimento</h2>
                </div>

                <button
                  type="button"
                  className="financeiro-modal-close"
                  onClick={fecharRecebimento}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>

              <div className="financeiro-modal-saldo">
                <span>Saldo atual</span>
                <strong>{moeda(conta.saldo)}</strong>
              </div>

              {mensagem && (
                <div className="financeiro-feedback financeiro-feedback-success">
                  <CheckCircle2 size={17} />
                  {mensagem}
                </div>
              )}

              {erro && (
                <div className="financeiro-feedback financeiro-feedback-error">
                  <XCircle size={17} />
                  {erro}
                </div>
              )}

              {!mensagem && (
                <form
                  onSubmit={registrar}
                  className="financeiro-recebimento-form"
                >
                  <label className="form-field">
                    <span>Valor recebido</span>
                    <div className="financeiro-money-input">
                      <span>R$</span>
                      <input
                        value={valor}
                        onChange={(event) => setValor(event.target.value)}
                        inputMode="decimal"
                        placeholder="0,00"
                        autoFocus
                      />
                    </div>
                  </label>

                  <label className="form-field">
                    <span>Forma de recebimento</span>
                    <select
                      value={formaPagamento}
                      onChange={(event) =>
                        setFormaPagamento(event.target.value)
                      }
                    >
                      <option value="">Selecione...</option>
                      <option value="pix">PIX</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_credito">Cartão de crédito</option>
                      <option value="cartao_debito">Cartão de débito</option>
                      <option value="boleto">Boleto</option>
                      <option value="transferencia">Transferência</option>
                      <option value="outro">Outro</option>
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Data do recebimento</span>
                    <div className="financeiro-date-input">
                      <CalendarClock size={16} />
                      <input
                        type="date"
                        value={dataRecebimento}
                        onChange={(event) =>
                          setDataRecebimento(event.target.value)
                        }
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

                  <div className="financeiro-modal-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={fecharRecebimento}
                    >
                      Cancelar
                    </button>

                    <button type="submit" className="btn btn-primary">
                      <CheckCircle2 size={17} />
                      Confirmar recebimento
                    </button>
                  </div>
                </form>
              )}

              {mensagem && (
                <div className="financeiro-modal-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={fecharRecebimento}
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
