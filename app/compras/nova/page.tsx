"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleDollarSign,
  Package,
  Plus,
  Save,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";
import { obterProdutos, type Produto } from "@/data/produtosStore";
import {
  criarCompra,
  type FormaPagamentoCompra,
  type ItemCompra,
  type CondicaoPagamentoCompra,
} from "@/data/comprasStore";
import { obterFornecedores, type Fornecedor } from "@/data/fornecedoresStore";
import { obterConfiguracoes } from "@/data/configuracoesStore";

const FORMAS_PAGAMENTO_LABELS: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  boleto: "Boleto",
  transferencia: "Transferência",
  outro: "Outro",
};

type ItemFormulario = {
  id: string;
  produtoId: string;
  produtoCodigo: string;
  produtoNome: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  subtotal: number;
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function converterMoeda(valor: string) {
  if (!valor.trim()) {
    return 0;
  }

  const numero = Number(
    valor
      .replace("R$", "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );

  return Number.isFinite(numero) ? numero : 0;
}

function gerarIdItem() {
  return `item-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export default function NovaCompraPage() {
  const configuracoes = useMemo(() => obterConfiguracoes(), []);

  const formasPagamentoAtivas = useMemo(
    () =>
      configuracoes.comercial.formasPagamento.filter(
        (forma) => FORMAS_PAGAMENTO_LABELS[forma],
      ) as FormaPagamentoCompra[],
    [configuracoes],
  );

  const [produtos] = useState<Produto[]>(() => obterProdutos());

  const [fornecedores] = useState<Fornecedor[]>(() => obterFornecedores());

  const [fornecedorId, setFornecedorId] = useState("");

  const [dataCompra, setDataCompra] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [observacao, setObservacao] = useState("");

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamentoCompra>(
    formasPagamentoAtivas[0] ?? "outro",
  );

  const [tipoCondicaoPagamento, setTipoCondicaoPagamento] =
    useState<CondicaoPagamentoCompra["tipo"]>("avista");

  const [quantidadeParcelas, setQuantidadeParcelas] = useState("2");

  const [intervaloParcelas, setIntervaloParcelas] = useState(
    String(Math.max(1, configuracoes.financeira.prazoPadraoPagarDias || 30)),
  );

  const [primeiroVencimento, setPrimeiroVencimento] = useState(() => {
    const data = new Date();
    data.setDate(
      data.getDate() +
        Math.max(0, configuracoes.financeira.prazoPadraoPagarDias || 0),
    );
    return data.toISOString().slice(0, 10);
  });

  const [produtoSelecionado, setProdutoSelecionado] = useState("");

  const [quantidade, setQuantidade] = useState("1");

  const [valorUnitario, setValorUnitario] = useState("");

  const [itens, setItens] = useState<ItemFormulario[]>([]);

  const [desconto, setDesconto] = useState("");

  const [frete, setFrete] = useState("");

  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");

  const produtoAtual = useMemo(() => {
    return produtos.find(
      (produto) => String(produto.id) === produtoSelecionado,
    );
  }, [produtos, produtoSelecionado]);

  const subtotal = useMemo(() => {
    return itens.reduce((total, item) => total + item.subtotal, 0);
  }, [itens]);

  const descontoNumerico = converterMoeda(desconto);
  const freteNumerico = converterMoeda(frete);

  const total = Math.max(0, subtotal - descontoNumerico + freteNumerico);

  function selecionarProduto(valor: string) {
    setProdutoSelecionado(valor);

    const produto = produtos.find((item) => String(item.id) === valor);

    if (produto) {
      setValorUnitario(String(produto.custo ?? ""));
    } else {
      setValorUnitario("");
    }

    setErro("");
  }

  function adicionarItem() {
    setErro("");

    if (!produtoAtual) {
      setErro("Selecione um produto.");
      return;
    }

    const quantidadeNumerica = Number(quantidade);
    const valorNumerico = converterMoeda(valorUnitario);

    if (!Number.isFinite(quantidadeNumerica) || quantidadeNumerica <= 0) {
      setErro("Informe uma quantidade válida.");
      return;
    }

    if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
      setErro("Informe um valor unitário válido.");
      return;
    }

    const itemExistente = itens.find(
      (item) => item.produtoId === String(produtoAtual.id),
    );

    if (itemExistente) {
      setItens((itensAtuais) =>
        itensAtuais.map((item) => {
          if (item.produtoId !== String(produtoAtual.id)) {
            return item;
          }

          const novaQuantidade = item.quantidade + quantidadeNumerica;

          return {
            ...item,
            quantidade: novaQuantidade,
            valorUnitario: valorNumerico,
            subtotal: novaQuantidade * valorNumerico - item.desconto,
          };
        }),
      );
    } else {
      const novoItem: ItemFormulario = {
        id: gerarIdItem(),
        produtoId: String(produtoAtual.id),
        produtoCodigo: produtoAtual.codigo,
        produtoNome: produtoAtual.nome,
        quantidade: quantidadeNumerica,
        valorUnitario: valorNumerico,
        desconto: 0,
        subtotal: quantidadeNumerica * valorNumerico,
      };

      setItens((itensAtuais) => [...itensAtuais, novoItem]);
    }

    setProdutoSelecionado("");
    setQuantidade("1");
    setValorUnitario("");
  }

  function removerItem(id: string) {
    setItens((itensAtuais) => itensAtuais.filter((item) => item.id !== id));
  }

  function alterarQuantidade(id: string, valor: string) {
    const novaQuantidade = Number(valor);

    if (!Number.isFinite(novaQuantidade) || novaQuantidade <= 0) {
      return;
    }

    setItens((itensAtuais) =>
      itensAtuais.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          quantidade: novaQuantidade,
          subtotal: novaQuantidade * item.valorUnitario - item.desconto,
        };
      }),
    );
  }

  function alterarValorUnitario(id: string, valor: string) {
    const novoValor = converterMoeda(valor);

    if (!Number.isFinite(novoValor) || novoValor < 0) {
      return;
    }

    setItens((itensAtuais) =>
      itensAtuais.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          valorUnitario: novoValor,
          subtotal: item.quantidade * novoValor - item.desconto,
        };
      }),
    );
  }
  const quantidadeParcelasNumerica = Math.max(
    1,
    Math.floor(Number(quantidadeParcelas) || 1),
  );

  const intervaloParcelasNumerico = Math.max(
    1,
    Math.floor(Number(intervaloParcelas) || 30),
  );

  const condicaoPagamento = useMemo<CondicaoPagamentoCompra>(() => {
    const quantidade =
      tipoCondicaoPagamento === "avista" ? 1 : quantidadeParcelasNumerica;

    const dataBase = new Date(`${primeiroVencimento || dataCompra}T12:00:00`);

    if (Number.isNaN(dataBase.getTime())) {
      dataBase.setTime(new Date().getTime());
    }

    const valorParcela = Math.round((total / quantidade) * 100) / 100;

    const parcelas = Array.from({ length: quantidade }, (_, index) => {
      const data = new Date(dataBase.getTime());

      if (tipoCondicaoPagamento === "parcelado") {
        data.setDate(data.getDate() + index * intervaloParcelasNumerico);
      }

      const valor =
        index === quantidade - 1
          ? Math.round((total - valorParcela * (quantidade - 1)) * 100) / 100
          : valorParcela;

      return {
        id: `parcela-compra-${Date.now()}-${index}`,
        numero: index + 1,
        valor,
        vencimento: data.toISOString(),
      };
    });

    return {
      tipo: tipoCondicaoPagamento,
      quantidadeParcelas: quantidade,
      intervaloDias:
        tipoCondicaoPagamento === "avista" ? 0 : intervaloParcelasNumerico,
      parcelas,
    };
  }, [
    tipoCondicaoPagamento,
    quantidadeParcelasNumerica,
    intervaloParcelasNumerico,
    primeiroVencimento,
    dataCompra,
    total,
  ]);

  const fornecedorSelecionado = fornecedores.find(
    (fornecedor) => fornecedor.id === fornecedorId,
  );

  function salvarCompra(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

    if (!fornecedorId) {
      setErro("Selecione um fornecedor.");
      return;
    }

    if (!dataCompra) {
      setErro("Informe a data da compra.");
      return;
    }

    if (itens.length === 0) {
      setErro("Adicione pelo menos um produto à compra.");
      return;
    }

    if (total <= 0) {
      setErro("O valor total da compra precisa ser maior que zero.");
      return;
    }

    if (!fornecedorSelecionado) {
      setErro("O fornecedor selecionado não foi encontrado.");
      return;
    }

    if (
      tipoCondicaoPagamento === "parcelado" &&
      quantidadeParcelasNumerica < 2
    ) {
      setErro("Informe pelo menos 2 parcelas para uma compra parcelada.");
      return;
    }

    setSalvando(true);

    try {
      const itensParaSalvar: ItemCompra[] = itens.map((item) => ({
        produtoId: item.produtoId,
        produtoCodigo: item.produtoCodigo,
        produtoNome: item.produtoNome,
        quantidade: item.quantidade,
        quantidadeRecebida: 0,
        valorUnitario: item.valorUnitario,
        desconto: item.desconto,
        subtotal: Math.max(
          0,
          item.quantidade * item.valorUnitario - item.desconto,
        ),
      }));

      criarCompra({
        fornecedorId: fornecedorSelecionado.id,

        fornecedorNome:
          fornecedorSelecionado.nomeFantasia ||
          fornecedorSelecionado.razaoSocial,

        itens: itensParaSalvar,

        desconto: descontoNumerico,

        frete: freteNumerico,

        formaPagamento,

        condicaoPagamento,

        dataPrevisao: condicaoPagamento.parcelas[0]?.vencimento,

        observacao: observacao.trim() || undefined,

        dataCompra,

        status: "pendente",
      });

      window.location.href = "/compras";
    } catch (error) {
      console.error("Erro ao criar compra:", error);

      setErro("Não foi possível salvar a compra. Tente novamente.");

      setSalvando(false);
    }
  }

  return (
    <AppShell
      title="Nova compra"
      description="Registre uma nova compra e acompanhe seu recebimento."
    >
      <section className="admin-page compras-nova-page">
        {/* CABEÇALHO */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Gestão de compras</span>

            <h2>Registrar nova compra</h2>

            <p>
              Informe o fornecedor, adicione os produtos e registre os valores
              da compra.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/compras" className="btn">
              <ArrowLeft size={18} />
              Voltar para compras
            </Link>
          </div>
        </div>

        {/* ERRO */}

        {erro && (
          <div className="compras-form-error">
            <strong>Atenção</strong>

            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={salvarCompra}>
          <div className="compras-nova-grid">
            {/* =================================================
                COLUNA PRINCIPAL
            ================================================= */}

            <div className="compras-nova-main">
              {/* DADOS DA COMPRA */}

              <article className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <span className="admin-eyebrow">Compra</span>

                    <h3>Informações da compra</h3>

                    <p>Preencha os dados básicos do pedido.</p>
                  </div>

                  <ShoppingCart size={25} />
                </div>

                <div className="form-grid">
                  <label className="form-field">
                    <span>Fornecedor *</span>

                    <div className="compras-input-icon">
                      <Truck size={17} />

                      <select
                        value={fornecedorId}
                        onChange={(event) => {
                          setFornecedorId(event.target.value);

                          setErro("");
                        }}
                        required
                      >
                        <option value="">Selecione um fornecedor</option>

                        {fornecedores
                          .filter((fornecedor) => fornecedor.status === "ativo")
                          .map((fornecedor) => (
                            <option key={fornecedor.id} value={fornecedor.id}>
                              {fornecedor.nomeFantasia ||
                                fornecedor.razaoSocial}
                            </option>
                          ))}
                      </select>
                    </div>
                  </label>

                  <label className="form-field">
                    <span>Data da compra *</span>

                    <div className="compras-input-icon">
                      <CalendarDays size={17} />

                      <input
                        type="date"
                        value={dataCompra}
                        onChange={(event) => setDataCompra(event.target.value)}
                        required
                      />
                    </div>
                  </label>
                </div>

                <label className="form-field compras-observacao-field">
                  <span>Observação</span>

                  <textarea
                    value={observacao}
                    onChange={(event) => setObservacao(event.target.value)}
                    placeholder="Adicione uma observação sobre esta compra..."
                    rows={4}
                  />
                </label>
              </article>

              {/* PAGAMENTO */}

              <article className="admin-card compras-pagamento-card">
                <div className="admin-card-header">
                  <div>
                    <span className="admin-eyebrow">Financeiro</span>

                    <h3>Condição de pagamento</h3>

                    <p>Defina como esta compra será paga.</p>
                  </div>

                  <CircleDollarSign size={25} />
                </div>

                <div className="form-grid">
                  <label className="form-field">
                    <span>Forma de pagamento *</span>

                    {formasPagamentoAtivas.length === 0 && (
                      <small style={{ color: "#ff7272" }}>
                        Nenhuma forma de pagamento está habilitada nas
                        configurações.
                      </small>
                    )}

                    <select
                      value={formaPagamento}
                      onChange={(event) =>
                        setFormaPagamento(
                          event.target.value as FormaPagamentoCompra,
                        )
                      }
                    >
                      {formasPagamentoAtivas.map((forma) => (
                        <option key={forma} value={forma}>
                          {FORMAS_PAGAMENTO_LABELS[forma]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Condição *</span>

                    <select
                      value={tipoCondicaoPagamento}
                      onChange={(event) =>
                        setTipoCondicaoPagamento(
                          event.target.value as CondicaoPagamentoCompra["tipo"],
                        )
                      }
                    >
                      <option value="avista">À vista</option>
                      <option value="parcelado">Parcelado</option>
                    </select>
                  </label>

                  {tipoCondicaoPagamento === "parcelado" && (
                    <>
                      <label className="form-field">
                        <span>Quantidade de parcelas *</span>

                        <input
                          type="number"
                          min="2"
                          step="1"
                          value={quantidadeParcelas}
                          onChange={(event) =>
                            setQuantidadeParcelas(event.target.value)
                          }
                        />
                      </label>

                      <label className="form-field">
                        <span>Intervalo entre parcelas (dias) *</span>

                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={intervaloParcelas}
                          onChange={(event) =>
                            setIntervaloParcelas(event.target.value)
                          }
                        />
                      </label>
                    </>
                  )}

                  <label className="form-field">
                    <span>Primeiro vencimento *</span>

                    <div className="compras-input-icon">
                      <CalendarDays size={17} />

                      <input
                        type="date"
                        value={primeiroVencimento}
                        onChange={(event) =>
                          setPrimeiroVencimento(event.target.value)
                        }
                      />
                    </div>
                  </label>
                </div>

                <div className="compras-parcelas-preview">
                  {condicaoPagamento.parcelas.map((parcela) => (
                    <div key={parcela.id}>
                      <span>Parcela {parcela.numero}</span>
                      <strong>{formatarMoeda(parcela.valor)}</strong>
                      <small>
                        {new Date(parcela.vencimento).toLocaleDateString(
                          "pt-BR",
                        )}
                      </small>
                    </div>
                  ))}
                </div>

                {tipoCondicaoPagamento === "avista" && (
                  <div className="compras-pagamento-alerta">
                    <Check size={16} />
                    <span>
                      À vista: o pagamento será registrado automaticamente no
                      Caixa após salvar a compra.
                    </span>
                  </div>
                )}
              </article>

              {/* PRODUTOS */}

              <article className="admin-card">
                <div className="admin-card-header">
                  <div>
                    <span className="admin-eyebrow">Produtos</span>

                    <h3>Itens da compra</h3>

                    <p>
                      Adicione os produtos e informe as quantidades e custos.
                    </p>
                  </div>

                  <Package size={25} />
                </div>

                {/* ADICIONAR PRODUTO */}

                <div className="compras-item-adicionar">
                  <label className="form-field">
                    <span>Produto *</span>

                    <select
                      value={produtoSelecionado}
                      onChange={(event) =>
                        selecionarProduto(event.target.value)
                      }
                    >
                      <option value="">Selecione um produto</option>

                      {produtos
                        .filter((produto) => produto.status !== "inativo")
                        .map((produto) => (
                          <option key={produto.id} value={produto.id}>
                            {produto.codigo} — {produto.nome}
                          </option>
                        ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span>Quantidade *</span>

                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={quantidade}
                      onChange={(event) => setQuantidade(event.target.value)}
                    />
                  </label>

                  <label className="form-field">
                    <span>Custo unitário *</span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={valorUnitario}
                      onChange={(event) => setValorUnitario(event.target.value)}
                      placeholder="Ex.: 120,00"
                    />
                  </label>

                  <button
                    type="button"
                    className="btn primary compras-adicionar-btn"
                    onClick={adicionarItem}
                  >
                    <Plus size={18} />
                    Adicionar
                  </button>
                </div>

                {/* ITENS */}

                {itens.length === 0 ? (
                  <div className="compras-itens-vazio">
                    <Package size={27} />

                    <strong>Nenhum produto adicionado</strong>

                    <span>
                      Selecione um produto acima para começar a montar a compra.
                    </span>
                  </div>
                ) : (
                  <div className="compras-itens-lista">
                    {itens.map((item) => (
                      <div className="compras-item-row" key={item.id}>
                        <div className="compras-item-produto">
                          <div className="compras-item-icon">
                            <Package size={18} />
                          </div>

                          <div>
                            <strong>{item.produtoNome}</strong>

                            <small>{item.produtoCodigo}</small>
                          </div>
                        </div>

                        <div className="compras-item-quantidade">
                          <span>Quantidade</span>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantidade}
                            onChange={(event) =>
                              alterarQuantidade(item.id, event.target.value)
                            }
                          />
                        </div>

                        <div className="compras-item-custo">
                          <span>Custo unit.</span>

                          <strong>{formatarMoeda(item.valorUnitario)}</strong>
                        </div>

                        <div className="compras-item-subtotal">
                          <span>Subtotal</span>

                          <strong>{formatarMoeda(item.subtotal)}</strong>
                        </div>

                        <button
                          type="button"
                          className="compras-remover-item"
                          onClick={() => removerItem(item.id)}
                          aria-label={`Remover ${item.produtoNome}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>

            {/* =================================================
                RESUMO
            ================================================= */}

            <aside className="compras-nova-sidebar">
              <article className="admin-card compras-resumo-card">
                <div className="admin-card-header">
                  <div>
                    <span className="admin-eyebrow">Resumo</span>

                    <h3>Resumo da compra</h3>
                  </div>
                </div>

                <div className="compras-resumo-linhas">
                  <div>
                    <span>Produtos</span>

                    <strong>{itens.length}</strong>
                  </div>

                  <div>
                    <span>Subtotal</span>

                    <strong>{formatarMoeda(subtotal)}</strong>
                  </div>

                  <label className="compras-resumo-input">
                    <span>Desconto</span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={desconto}
                      onChange={(event) => setDesconto(event.target.value)}
                      placeholder="R$ 0,00"
                    />
                  </label>

                  <label className="compras-resumo-input">
                    <span>Frete</span>

                    <input
                      type="text"
                      inputMode="decimal"
                      value={frete}
                      onChange={(event) => setFrete(event.target.value)}
                      placeholder="R$ 0,00"
                    />
                  </label>
                </div>

                <div className="compras-total-final">
                  <span>Total da compra</span>

                  <strong>{formatarMoeda(total)}</strong>
                </div>

                <div className="compras-status-info">
                  <div>
                    <Check size={16} />
                  </div>

                  <span>
                    A compra será registrada como
                    <strong> Pendente</strong> até que o recebimento seja
                    realizado.
                  </span>
                </div>

                <div className="compras-form-actions">
                  <Link href="/compras" className="btn">
                    Cancelar
                  </Link>

                  <button
                    type="submit"
                    className="btn primary"
                    disabled={salvando || itens.length === 0}
                  >
                    <Save size={18} />

                    {salvando ? "Salvando..." : "Salvar compra"}
                  </button>
                </div>
              </article>
            </aside>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
