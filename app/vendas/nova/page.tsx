"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  FileText,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User,
  X,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";

import {
  criarVenda,
  calcularSubtotalItem,
  calcularSubtotalVenda,
  calcularTotalVenda,
  type FormaPagamento,
  type CondicaoPagamentoVenda,
  type ItemVenda,
} from "../../../data/vendasStore";

import { obterClientes, type Cliente } from "../../../data/clientesStore";

import { obterProdutos, type Produto } from "../../../data/produtosStore";
import { obterConfiguracoes } from "../../../data/configuracoesStore";

/* =========================================================
   TIPOS AUXILIARES
   ========================================================= */

type ProdutoSelecionado = Produto & {
  estoqueDisponivel?: number;
};

const FORMAS_PAGAMENTO_LABELS: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  boleto: "Boleto",
  transferencia: "Transferência",
  outro: "Outro",
};

/* =========================================================
   PÁGINA
   ========================================================= */

export default function NovaVendaPage() {
  const router = useRouter();

  /* =======================================================
     CLIENTE
     ======================================================= */

  const [clientes, setClientes] = useState<Cliente[]>(() => obterClientes());

  const [clienteId, setClienteId] = useState("");

  const [buscaCliente, setBuscaCliente] = useState("");

  const [mostrarClientes, setMostrarClientes] = useState(false);

  /* =======================================================
     PRODUTOS
     ======================================================= */

  const [produtos, setProdutos] = useState<Produto[]>(() => obterProdutos());

  const [buscaProduto, setBuscaProduto] = useState("");

  const [mostrarProdutos, setMostrarProdutos] = useState(false);

  const [itens, setItens] = useState<ItemVenda[]>([]);

  /* =======================================================
     DESCONTO
     ======================================================= */

  const [desconto, setDesconto] = useState("0");

  /* =======================================================
     PAGAMENTO
     ======================================================= */

  const configuracoes = useMemo(() => obterConfiguracoes(), []);

  const formasPagamentoAtivas = useMemo(
    () =>
      configuracoes.comercial.formasPagamento.filter(
        (forma) => FORMAS_PAGAMENTO_LABELS[forma],
      ) as FormaPagamento[],
    [configuracoes],
  );

  const formaPagamentoInicial = formasPagamentoAtivas[0] ?? "";

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | "">(
    formaPagamentoInicial,
  );

  const [tipoCondicaoPagamento, setTipoCondicaoPagamento] =
    useState<CondicaoPagamentoVenda["tipo"]>("avista");

  const [quantidadeParcelas, setQuantidadeParcelas] = useState("2");

  const [intervaloParcelas, setIntervaloParcelas] = useState(
    String(Math.max(1, configuracoes.financeira.prazoPadraoReceberDias || 30)),
  );

  const [primeiroVencimento, setPrimeiroVencimento] = useState(() => {
    const data = new Date();
    data.setDate(
      data.getDate() +
        Math.max(0, configuracoes.financeira.prazoPadraoReceberDias || 0),
    );
    return data.toISOString().slice(0, 10);
  });

  /* =======================================================
     OBSERVAÇÃO
     ======================================================= */

  const [observacao, setObservacao] = useState("");

  /* =======================================================
     ESTADO
     ======================================================= */

  const [erro, setErro] = useState("");

  const [salvando, setSalvando] = useState(false);

  /* =========================================================
     CLIENTE SELECIONADO
     ========================================================= */

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteId) ?? null,
    [clientes, clienteId],
  );

  /* =========================================================
     PRODUTOS FILTRADOS
     ========================================================= */

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();

    if (!termo) {
      return produtos;
    }

    return produtos.filter((produto) => {
      const nome = String(produto.nome ?? "").toLowerCase();

      const codigo = String(produto.codigo ?? "").toLowerCase();

      return nome.includes(termo) || codigo.includes(termo);
    });
  }, [produtos, buscaProduto]);

  /* =========================================================
     CLIENTES FILTRADOS
     ========================================================= */

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase();

    return clientes
      .filter((cliente) => cliente.status === "ativo")
      .filter((cliente) => {
        if (!termo) {
          return true;
        }

        const nome = cliente.nome.toLowerCase();

        const codigo = cliente.codigo.toLowerCase();

        const documento = (cliente.documento ?? "").toLowerCase();

        return (
          nome.includes(termo) ||
          codigo.includes(termo) ||
          documento.includes(termo)
        );
      })
      .slice(0, 10);
  }, [clientes, buscaCliente]);

  /* =========================================================
     SUBTOTAL
     ========================================================= */

  const subtotal = useMemo(() => calcularSubtotalVenda(itens), [itens]);

  /* =========================================================
     DESCONTO NUMÉRICO
     ========================================================= */

  const descontoNumerico = useMemo(() => {
    const valor = Number(desconto.replace(",", "."));

    if (!Number.isFinite(valor) || valor < 0) {
      return 0;
    }

    return valor;
  }, [desconto]);

  /* =========================================================
     TOTAL
     ========================================================= */

  const total = useMemo(
    () => calcularTotalVenda(subtotal, descontoNumerico),
    [subtotal, descontoNumerico],
  );

  const quantidadeParcelasNumerica = useMemo(() => {
    const valor = Math.floor(Number(quantidadeParcelas));
    return Number.isFinite(valor) && valor > 0 ? valor : 1;
  }, [quantidadeParcelas]);

  const intervaloParcelasNumerico = useMemo(() => {
    const valor = Math.floor(Number(intervaloParcelas));
    return Number.isFinite(valor) && valor > 0 ? valor : 30;
  }, [intervaloParcelas]);

  const vencimentoPadrao = useMemo(() => {
    const data = new Date();
    data.setDate(data.getDate() + intervaloParcelasNumerico);
    return data.toISOString().slice(0, 10);
  }, [intervaloParcelasNumerico]);

  const condicaoPagamento = useMemo<CondicaoPagamentoVenda>(() => {
    const quantidade =
      tipoCondicaoPagamento === "avista" ? 1 : quantidadeParcelasNumerica;

    const intervalo =
      tipoCondicaoPagamento === "avista" ? 0 : intervaloParcelasNumerico;

    const dataBase = (() => {
      if (tipoCondicaoPagamento === "avista") {
        return new Date();
      }

      const valor = primeiroVencimento || vencimentoPadrao;
      const partes = valor.split("-").map(Number);

      if (partes.length === 3 && partes.every(Number.isFinite)) {
        const [ano, mes, dia] = partes;
        const data = new Date(ano, mes - 1, dia, 12, 0, 0, 0);

        if (
          data.getFullYear() === ano &&
          data.getMonth() === mes - 1 &&
          data.getDate() === dia
        ) {
          return data;
        }
      }

      const fallback = new Date();
      fallback.setDate(fallback.getDate() + intervalo);
      return fallback;
    })();

    const totalParcela = Math.round((total / quantidade) * 100) / 100;
    const parcelas = Array.from({ length: quantidade }, (_, index) => {
      const data = new Date(dataBase.getTime());

      if (tipoCondicaoPagamento === "parcelado") {
        data.setDate(data.getDate() + index * intervalo);
      }

      const valor =
        index === quantidade - 1
          ? Math.round((total - totalParcela * (quantidade - 1)) * 100) / 100
          : totalParcela;

      return {
        id: `parcela-${Date.now()}-${index}`,
        numero: index + 1,
        valor,
        vencimento: data.toISOString(),
        valorRecebido: 0,
        status: "pendente" as const,
      };
    });

    return {
      tipo: tipoCondicaoPagamento,
      quantidadeParcelas: quantidade,
      intervaloDias: intervalo,
      entrada: tipoCondicaoPagamento === "avista" ? total : 0,
      parcelas,
    };
  }, [
    tipoCondicaoPagamento,
    quantidadeParcelasNumerica,
    intervaloParcelasNumerico,
    primeiroVencimento,
    vencimentoPadrao,
    total,
  ]);

  const valorRecebidoInicial = tipoCondicaoPagamento === "avista" ? total : 0;

  /* =========================================================
     FORMATAÇÃO
     ========================================================= */

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  /* =========================================================
     PRODUTO — PREÇO
     ========================================================= */

  function obterPrecoProduto(produto: Produto): number {
    const preco = produto.preco;

    if (!preco) {
      return 0;
    }

    const numero = Number(
      String(preco)
        .replace("R$", "")
        .replace(/\s/g, "")
        .replace(/\./g, "")
        .replace(",", "."),
    );

    return Number.isFinite(numero) ? numero : 0;
  }

  /* =========================================================
     PRODUTO — ESTOQUE
     ========================================================= */

  function obterEstoqueProduto(produto: Produto): number {
    const produtoGenerico = produto as Produto & {
      estoque?: number;
      estoqueAtual?: number;
      quantidadeEstoque?: number;
      quantidade?: number;
    };

    const estoque =
      produtoGenerico.estoqueAtual ??
      produtoGenerico.estoque ??
      produtoGenerico.quantidadeEstoque ??
      produtoGenerico.quantidade ??
      0;

    return Number.isFinite(Number(estoque)) ? Number(estoque) : 0;
  }

  function obterEstoqueDoItem(item: ItemVenda): number {
    const produto = produtos.find(
      (produtoAtual) => String(produtoAtual.id) === String(item.produtoId),
    );

    if (produto) {
      return obterEstoqueProduto(produto);
    }

    const produtoDoItem = item as ItemVenda & {
      estoqueDisponivel?: number;
    };

    return Number.isFinite(Number(produtoDoItem.estoqueDisponivel))
      ? Number(produtoDoItem.estoqueDisponivel)
      : 0;
  }

  const itensComEstoqueInsuficiente = useMemo(() => {
    if (configuracoes.estoque.permitirEstoqueNegativo) {
      return [];
    }

    return itens.filter((item) => {
      const estoque = obterEstoqueDoItem(item);
      return item.quantidade > estoque;
    });
  }, [itens, produtos, configuracoes.estoque.permitirEstoqueNegativo]);

  /* =========================================================
     SELECIONAR CLIENTE
     ========================================================= */

  function selecionarCliente(cliente: Cliente) {
    setClienteId(cliente.id);

    setBuscaCliente(cliente.nome);

    setMostrarClientes(false);

    setErro("");
  }

  /* =========================================================
     LIMPAR CLIENTE
     ========================================================= */

  function limparCliente() {
    setClienteId("");

    setBuscaCliente("");

    setMostrarClientes(false);
  }

  /* =========================================================
     ADICIONAR PRODUTO
     ========================================================= */

  function adicionarProduto(produto: Produto) {
    setErro("");

    const estoque = obterEstoqueProduto(produto);

    if (estoque <= 0) {
      setErro(`O produto "${produto.nome}" está sem estoque disponível.`);
      return;
    }

    const itemExistente = itens.find(
      (item) => String(item.produtoId) === String(produto.id),
    );

    if (itemExistente) {
      if (itemExistente.quantidade >= estoque) {
        setErro(
          `Estoque insuficiente para "${produto.nome}". Disponível: ${estoque} unidade(s).`,
        );
        return;
      }

      atualizarQuantidade(itemExistente.id, itemExistente.quantidade + 1);

      setBuscaProduto("");

      setMostrarProdutos(false);

      return;
    }

    const novoItem: ItemVenda = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,

      produtoId: String(produto.id),

      produtoNome: produto.nome,

      quantidade: 1,

      precoUnitario: obterPrecoProduto(produto),

      desconto: 0,

      subtotal: calcularSubtotalItem(1, obterPrecoProduto(produto), 0),
    };

    setItens((atuais) => [...atuais, novoItem]);

    setBuscaProduto("");

    setMostrarProdutos(false);
  }

  /* =========================================================
     ATUALIZAR QUANTIDADE
     ========================================================= */

  function atualizarQuantidade(itemId: string, quantidade: number) {
    setItens((atuais) =>
      atuais.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        const novaQuantidade = Math.max(1, Math.floor(quantidade));

        return {
          ...item,

          quantidade: novaQuantidade,

          subtotal: calcularSubtotalItem(
            novaQuantidade,
            item.precoUnitario,
            item.desconto,
          ),
        };
      }),
    );
  }

  /* =========================================================
     ATUALIZAR PREÇO
     ========================================================= */

  function atualizarPreco(itemId: string, valor: string) {
    const numero = Number(valor.replace(",", "."));

    const novoPreco = Number.isFinite(numero) && numero >= 0 ? numero : 0;

    setItens((atuais) =>
      atuais.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,

          precoUnitario: novoPreco,

          subtotal: calcularSubtotalItem(
            item.quantidade,
            novoPreco,
            item.desconto,
          ),
        };
      }),
    );
  }

  /* =========================================================
     ATUALIZAR DESCONTO DO ITEM
     ========================================================= */

  function atualizarDescontoItem(itemId: string, valor: string) {
    const numero = Number(valor.replace(",", "."));

    const novoDesconto = Number.isFinite(numero) && numero >= 0 ? numero : 0;

    setItens((atuais) =>
      atuais.map((item) => {
        if (item.id !== itemId) {
          return item;
        }

        return {
          ...item,

          desconto: novoDesconto,

          subtotal: calcularSubtotalItem(
            item.quantidade,
            item.precoUnitario,
            novoDesconto,
          ),
        };
      }),
    );
  }

  /* =========================================================
     REMOVER ITEM
     ========================================================= */

  function removerItem(itemId: string) {
    setItens((atuais) => atuais.filter((item) => item.id !== itemId));
  }

  /* =========================================================
     LIMPAR VENDA
     ========================================================= */

  function limparVenda() {
    setClienteId("");

    setBuscaCliente("");

    setItens([]);

    setDesconto("0");

    setFormaPagamento("");
    setTipoCondicaoPagamento("avista");
    setQuantidadeParcelas("2");
    setIntervaloParcelas("30");
    setPrimeiroVencimento("");

    setObservacao("");

    setErro("");
  }

  /* =========================================================
     SALVAR
     ========================================================= */

  function salvar(
    event: FormEvent<HTMLFormElement>,
    status: "rascunho" | "pendente" | "concluida",
  ) {
    event.preventDefault();

    setErro("");

    if (!clienteSelecionado) {
      setErro("Selecione um cliente antes de salvar a venda.");

      return;
    }

    if (itens.length === 0) {
      setErro("Adicione pelo menos um produto à venda.");

      return;
    }

    if (status === "concluida" && itensComEstoqueInsuficiente.length > 0) {
      const itemComProblema = itensComEstoqueInsuficiente[0];
      const estoqueDisponivel = obterEstoqueDoItem(itemComProblema);

      setErro(
        `Estoque insuficiente para "${itemComProblema.produtoNome}". ` +
          `Disponível: ${estoqueDisponivel} unidade(s).`,
      );

      return;
    }

    if (status === "concluida" && !formaPagamento) {
      setErro("Selecione a forma de pagamento para concluir a venda.");

      return;
    }

    setSalvando(true);

    try {
      const venda = criarVenda({
        clienteId: clienteSelecionado.id,

        clienteNome: clienteSelecionado.nome,

        itens,

        subtotal,

        desconto: descontoNumerico,

        total,

        formaPagamento: formaPagamento || undefined,

        condicaoPagamento,

        valorRecebido: valorRecebidoInicial,

        saldoReceber: Math.max(
          0,
          Math.round((total - valorRecebidoInicial) * 100) / 100,
        ),

        status,

        observacao: observacao.trim() || undefined,
      });

      router.push(`/vendas/${venda.id}`);
    } catch (error) {
      console.error("Erro ao criar venda:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a venda.",
      );

      setSalvando(false);
    }
  }

  /* =========================================================
     RECARREGAR DADOS
     ========================================================= */

  function recarregarDados() {
    setClientes(obterClientes());

    setProdutos(obterProdutos());
  }

  /* =========================================================
     PÁGINA
     ========================================================= */

  return (
    <AppShell
      title="Nova venda"
      description="Registre uma nova venda para um cliente."
    >
      <section className="admin-page vendas-nova-page">
        {/* =================================================
            CABEÇALHO
        ================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Gestão comercial</span>

            <h2>Nova venda</h2>

            <p>Selecione o cliente, adicione os produtos e finalize a venda.</p>
          </div>

          <div className="admin-page-actions">
            <Link href="/vendas" className="btn">
              <ArrowLeft size={18} />
              Voltar
            </Link>
          </div>
        </div>

        {/* =================================================
            ERRO
        ================================================== */}

        {erro && (
          <div className="vendas-form-error">
            <X size={18} />

            <span>{erro}</span>
          </div>
        )}

        {/* =================================================
            FORMULÁRIO
        ================================================== */}

        <form
          className="vendas-nova-layout"
          onSubmit={(event) => salvar(event, "concluida")}
        >
          {/* =================================================
              COLUNA PRINCIPAL
          ================================================== */}

          <div className="vendas-nova-main">
            {/* =================================================
                CLIENTE
            ================================================== */}

            <article className="admin-card vendas-nova-card">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Cliente</span>

                  <h3>Cliente da venda</h3>

                  <p>Selecione o cliente que realizará a compra.</p>
                </div>

                <User size={24} />
              </div>

              <div className="vendas-cliente-selector">
                <div className="vendas-selector-input">
                  <Search size={17} />

                  <input
                    type="text"
                    value={buscaCliente}
                    onChange={(event) => {
                      setBuscaCliente(event.target.value);

                      setClienteId("");

                      setMostrarClientes(true);
                    }}
                    onFocus={() => setMostrarClientes(true)}
                    placeholder="Buscar cliente por nome, código ou documento..."
                  />

                  {clienteSelecionado && (
                    <button
                      type="button"
                      onClick={limparCliente}
                      className="vendas-selector-clear"
                      aria-label="Limpar cliente"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {mostrarClientes && (
                  <div className="vendas-selector-dropdown">
                    {clientesFiltrados.length === 0 ? (
                      <div className="vendas-selector-empty">
                        <User size={21} />

                        <span>Nenhum cliente encontrado.</span>

                        <Link href="/clientes/nova" className="btn">
                          <Plus size={15} />
                          Novo cliente
                        </Link>
                      </div>
                    ) : (
                      clientesFiltrados.map((cliente) => (
                        <button
                          type="button"
                          key={cliente.id}
                          className="vendas-selector-option"
                          onClick={() => selecionarCliente(cliente)}
                        >
                          <div className="vendas-selector-avatar">
                            <User size={17} />
                          </div>

                          <div>
                            <strong>{cliente.nome}</strong>

                            <span>
                              #{cliente.codigo}
                              {cliente.documento
                                ? ` • ${cliente.documento}`
                                : ""}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {clienteSelecionado && (
                  <div className="vendas-cliente-selecionado">
                    <div className="vendas-cliente-avatar">
                      <User size={20} />
                    </div>

                    <div>
                      <span>Cliente selecionado</span>

                      <strong>{clienteSelecionado.nome}</strong>
                    </div>

                    <button
                      type="button"
                      className="btn"
                      onClick={limparCliente}
                    >
                      Alterar
                    </button>
                  </div>
                )}
              </div>
            </article>

            {/* =================================================
                PRODUTOS
            ================================================== */}

            <article className="admin-card vendas-nova-card">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Produtos</span>

                  <h3>Itens da venda</h3>

                  <p>Adicione os produtos que serão vendidos.</p>
                </div>

                <Package size={24} />
              </div>

              {/* BUSCA PRODUTO */}

              <div className="vendas-produto-busca">
                <div className="vendas-selector-input">
                  <Search size={17} />

                  <input
                    type="text"
                    value={buscaProduto}
                    onChange={(event) => {
                      setBuscaProduto(event.target.value);

                      setMostrarProdutos(true);
                    }}
                    onFocus={() => setMostrarProdutos(true)}
                    placeholder="Buscar produto por nome ou código..."
                  />

                  <button
                    type="button"
                    className="vendas-recarregar-btn"
                    onClick={() => {
                      recarregarDados();
                      setMostrarProdutos((atual) => !atual);
                    }}
                    title={
                      mostrarProdutos ? "Fechar produtos" : "Mostrar produtos"
                    }
                    aria-label={
                      mostrarProdutos ? "Fechar produtos" : "Mostrar produtos"
                    }
                  >
                    <ChevronDown
                      size={16}
                      className={
                        mostrarProdutos ? "vendas-produtos-chevron-aberta" : ""
                      }
                    />
                  </button>
                </div>

                {mostrarProdutos && (
                  <div className="vendas-selector-dropdown">
                    {produtosFiltrados.length === 0 ? (
                      <div className="vendas-selector-empty">
                        <Package size={21} />

                        <span>Nenhum produto encontrado.</span>
                      </div>
                    ) : (
                      produtosFiltrados.map((produto) => {
                        const estoque = obterEstoqueProduto(produto);

                        const jaAdicionado = itens.some(
                          (item) =>
                            String(item.produtoId) === String(produto.id),
                        );

                        return (
                          <button
                            type="button"
                            key={produto.id}
                            className="vendas-selector-option"
                            onClick={() => adicionarProduto(produto)}
                          >
                            <div className="vendas-selector-avatar produto">
                              <Package size={17} />
                            </div>

                            <div>
                              <strong>{produto.nome}</strong>

                              <span>
                                #{produto.codigo}
                                {" • "}
                                {formatarMoeda(obterPrecoProduto(produto))}
                                {" • "}
                                Estoque: {estoque}
                              </span>
                            </div>

                            {jaAdicionado && (
                              <CheckCircle2
                                size={17}
                                className="vendas-produto-ja-adicionado"
                              />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* LISTA DE ITENS */}

              {itens.length === 0 ? (
                <div className="vendas-itens-vazio">
                  <div className="vendas-itens-vazio-icon">
                    <ShoppingCart size={27} />
                  </div>

                  <strong>Nenhum produto adicionado</strong>

                  <span>Busque um produto acima para adicioná-lo à venda.</span>
                </div>
              ) : (
                <div className="vendas-itens-lista">
                  {itens.map((item) => (
                    <div key={item.id} className="vendas-item">
                      {/* PRODUTO */}

                      <div className="vendas-item-produto">
                        <div className="vendas-item-icon">
                          <Package size={18} />
                        </div>

                        <div>
                          <strong>{item.produtoNome}</strong>

                          <span>ID: {item.produtoId}</span>
                        </div>
                      </div>

                      {/* QUANTIDADE */}

                      <div className="vendas-item-campo">
                        <span>Quantidade</span>

                        <div className="vendas-quantidade">
                          <button
                            type="button"
                            onClick={() =>
                              atualizarQuantidade(item.id, item.quantidade - 1)
                            }
                            disabled={item.quantidade <= 1}
                          >
                            <Minus size={14} />
                          </button>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantidade}
                            aria-invalid={
                              item.quantidade > obterEstoqueDoItem(item)
                            }
                            onChange={(event) =>
                              atualizarQuantidade(
                                item.id,
                                Number(event.target.value),
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const estoque = obterEstoqueDoItem(item);

                              if (item.quantidade >= estoque) {
                                setErro(
                                  `Estoque insuficiente para "${item.produtoNome}". ` +
                                    `Disponível: ${estoque} unidade(s).`,
                                );
                                return;
                              }

                              atualizarQuantidade(item.id, item.quantidade + 1);
                              setErro("");
                            }}
                            disabled={
                              item.quantidade >= obterEstoqueDoItem(item)
                            }
                            title={
                              item.quantidade >= obterEstoqueDoItem(item)
                                ? "Quantidade máxima disponível em estoque"
                                : "Adicionar unidade"
                            }
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <small
                          className={
                            item.quantidade > obterEstoqueDoItem(item)
                              ? "vendas-estoque-indisponivel"
                              : "vendas-estoque-disponivel"
                          }
                        >
                          Estoque disponível: {obterEstoqueDoItem(item)}
                        </small>
                      </div>

                      {/* PREÇO */}

                      <label className="vendas-item-campo">
                        <span>Preço unitário</span>

                        <input
                          type="text"
                          inputMode="decimal"
                          value={String(item.precoUnitario).replace(".", ",")}
                          onChange={(event) =>
                            atualizarPreco(item.id, event.target.value)
                          }
                        />
                      </label>

                      {/* DESCONTO */}

                      <label className="vendas-item-campo">
                        <span>Desconto</span>

                        <input
                          type="text"
                          inputMode="decimal"
                          value={String(item.desconto).replace(".", ",")}
                          onChange={(event) =>
                            atualizarDescontoItem(item.id, event.target.value)
                          }
                        />
                      </label>

                      {/* SUBTOTAL */}

                      <div className="vendas-item-subtotal">
                        <span>Subtotal</span>

                        <strong>{formatarMoeda(item.subtotal)}</strong>
                      </div>

                      {/* REMOVER */}

                      <button
                        type="button"
                        className="vendas-item-remover"
                        onClick={() => removerItem(item.id)}
                        title="Remover produto"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </article>

            {/* =================================================
                OBSERVAÇÃO
            ================================================== */}

            <article className="admin-card vendas-nova-card">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Informações adicionais</span>

                  <h3>Observação</h3>
                </div>

                <FileText size={23} />
              </div>

              <textarea
                className="vendas-observacao"
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                placeholder="Adicione uma observação sobre esta venda..."
                rows={4}
              />
            </article>
          </div>

          {/* =================================================
              SIDEBAR
          ================================================== */}

          <aside className="vendas-nova-sidebar">
            {/* =================================================
                RESUMO
            ================================================== */}

            <article className="admin-card vendas-resumo-final">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Resumo</span>

                  <h3>Total da venda</h3>
                </div>

                <ShoppingCart size={22} />
              </div>

              <div className="vendas-resumo-linhas">
                <div>
                  <span>Produtos</span>

                  <strong>{itens.length}</strong>
                </div>

                <div>
                  <span>Subtotal</span>

                  <strong>{formatarMoeda(subtotal)}</strong>
                </div>

                <div>
                  <span>Desconto</span>

                  <strong className="vendas-desconto-valor">
                    {formatarMoeda(descontoNumerico)}
                  </strong>
                </div>

                <div className="vendas-resumo-total">
                  <span>Total</span>

                  <strong>{formatarMoeda(total)}</strong>
                </div>
              </div>
            </article>

            {/* =================================================
                DESCONTO
            ================================================== */}

            <article className="admin-card vendas-desconto-card">
              <label className="form-field">
                <span>
                  Desconto geral
                  <small
                    style={{ display: "block", marginTop: 4, opacity: 0.45 }}
                  >
                    Limite configurado:{" "}
                    {configuracoes.comercial.descontoMaximoPercentual}%
                  </small>
                </span>

                <div className="vendas-input-prefix">
                  <span>R$</span>

                  <input
                    type="text"
                    inputMode="decimal"
                    value={desconto}
                    onChange={(event) => setDesconto(event.target.value)}
                    placeholder="0,00"
                  />
                </div>
              </label>
            </article>

            {/* =================================================
                PAGAMENTO
            ================================================== */}

            <article className="admin-card vendas-pagamento-card">
              <div className="admin-card-header">
                <div>
                  <span className="admin-eyebrow">Pagamento</span>

                  <h3>Forma de pagamento</h3>
                </div>

                <CircleDollarSign size={22} />
              </div>

              <label className="form-field">
                <span>Forma de pagamento</span>

                <select
                  value={formaPagamento}
                  onChange={(event) => {
                    const forma = event.target.value as FormaPagamento | "";
                    setFormaPagamento(forma);

                    if (
                      forma === "pix" ||
                      forma === "dinheiro" ||
                      forma === "cartao_debito" ||
                      forma === "transferencia"
                    ) {
                      setTipoCondicaoPagamento("avista");
                    }

                    if (forma === "cartao_credito" || forma === "boleto") {
                      setTipoCondicaoPagamento("parcelado");
                    }
                  }}
                >
                  <option value="">Selecione...</option>
                  {formasPagamentoAtivas.map((forma) => (
                    <option key={forma} value={forma}>
                      {FORMAS_PAGAMENTO_LABELS[forma]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Condição de pagamento</span>

                <select
                  value={tipoCondicaoPagamento}
                  onChange={(event) =>
                    setTipoCondicaoPagamento(
                      event.target.value as CondicaoPagamentoVenda["tipo"],
                    )
                  }
                >
                  <option value="avista">À vista</option>
                  <option value="parcelado">Parcelado</option>
                </select>
              </label>

              {tipoCondicaoPagamento === "parcelado" && (
                <>
                  <div className="vendas-pagamento-grid">
                    <label className="form-field">
                      <span>Quantidade de parcelas</span>

                      <input
                        type="number"
                        min="2"
                        max="60"
                        step="1"
                        value={quantidadeParcelas}
                        onChange={(event) =>
                          setQuantidadeParcelas(event.target.value)
                        }
                      />
                    </label>

                    <label className="form-field">
                      <span>Intervalo entre parcelas</span>

                      <div className="vendas-input-sufixo">
                        <input
                          type="number"
                          min="1"
                          max="365"
                          step="1"
                          value={intervaloParcelas}
                          onChange={(event) =>
                            setIntervaloParcelas(event.target.value)
                          }
                        />
                        <span>dias</span>
                      </div>
                    </label>
                  </div>

                  <label className="form-field">
                    <span>Primeiro vencimento</span>

                    <input
                      type="date"
                      value={primeiroVencimento}
                      onChange={(event) =>
                        setPrimeiroVencimento(event.target.value)
                      }
                    />
                  </label>

                  <div className="vendas-pagamento-resumo">
                    <div>
                      <span>Parcelas</span>
                      <strong>{quantidadeParcelasNumerica}x</strong>
                    </div>

                    <div>
                      <span>Valor por parcela</span>
                      <strong>
                        {formatarMoeda(
                          Math.round(
                            (total / quantidadeParcelasNumerica) * 100,
                          ) / 100,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Primeiro vencimento</span>
                      <strong>
                        {(() => {
                          const valor = primeiroVencimento || vencimentoPadrao;
                          const [ano, mes, dia] = valor.split("-").map(Number);
                          const data =
                            Number.isFinite(ano) &&
                            Number.isFinite(mes) &&
                            Number.isFinite(dia)
                              ? new Date(ano, mes - 1, dia, 12, 0, 0)
                              : new Date();

                          return data.toLocaleDateString("pt-BR");
                        })()}
                      </strong>
                    </div>
                  </div>
                </>
              )}

              {tipoCondicaoPagamento === "avista" && (
                <div className="vendas-pagamento-resumo">
                  <div>
                    <span>Valor recebido na conclusão</span>
                    <strong>{formatarMoeda(total)}</strong>
                  </div>

                  <div>
                    <span>Saldo a receber</span>
                    <strong>R$ 0,00</strong>
                  </div>
                </div>
              )}
            </article>

            {/* =================================================
                AÇÕES
            ================================================== */}

            <article className="admin-card vendas-acoes-card">
              <button
                type="submit"
                className="btn primary vendas-finalizar-btn"
                disabled={salvando || itensComEstoqueInsuficiente.length > 0}
              >
                <CheckCircle2 size={18} />

                {salvando ? "Salvando..." : "Finalizar venda"}
              </button>

              <button
                type="button"
                className="btn vendas-rascunho-btn"
                disabled={salvando}
                onClick={() => {
                  const formulario = document.querySelector(
                    "form.vendas-nova-layout",
                  );

                  if (formulario instanceof HTMLFormElement) {
                    salvar(
                      {
                        preventDefault: () => {},
                      } as FormEvent<HTMLFormElement>,
                      "rascunho",
                    );
                  }
                }}
              >
                <FileText size={17} />
                Salvar rascunho
              </button>

              <button
                type="button"
                className="btn vendas-cancelar-btn"
                disabled={salvando}
                onClick={() => limparVenda()}
              >
                <X size={17} />
                Limpar venda
              </button>
            </article>

            {/* =================================================
                INFORMAÇÃO
            ================================================== */}

            <div className="vendas-seguranca-info">
              <CheckCircle2 size={15} />

              <span>
                A venda será registrada no histórico após o salvamento.
              </span>
            </div>
          </aside>
        </form>
      </section>
    </AppShell>
  );
}
