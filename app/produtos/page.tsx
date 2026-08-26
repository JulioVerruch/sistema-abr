"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  Download,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  TriangleAlert,
  X,
} from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";

import {
  excluirProduto,
  obterProdutos,
  type Produto,
} from "../../data/produtosStore";

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

const converterMoeda = (valor: string | number) => {
  if (typeof valor === "number") {
    return valor;
  }

  return Number(
    valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
  );
};

const obterStatusEstoque = (produto: Produto) => {
  if (produto.status === "inativo") {
    return "inativo";
  }

  const estoqueMinimo = produto.estoqueMinimo ?? 2;

  if (produto.estoque <= 0) {
    return "sem-estoque";
  }

  if (produto.estoque <= estoqueMinimo) {
    return "baixo";
  }

  return "normal";
};

const itensPorPagina = 10;

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [busca, setBusca] = useState("");

  const [categoriaSelecionada, setCategoriaSelecionada] = useState("todos");

  const [statusSelecionado, setStatusSelecionado] = useState("todos");

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState<Produto | null>(
    null,
  );

  const [excluindoProduto, setExcluindoProduto] = useState(false);

  const [mensagemSucesso, setMensagemSucesso] = useState("");

  /*
    Carrega todos os produtos.

    Aqui entram:
    - Os produtos originais;
    - Todos os novos produtos
      cadastrados pelo sistema.
  */
  useEffect(() => {
    const carregarProdutos = () => {
      const produtosCarregados = obterProdutos();

      setProdutos(produtosCarregados);
    };

    carregarProdutos();

    const atualizarProdutos = (event: StorageEvent) => {
      if (event.key === "abr-agro-produtos") {
        carregarProdutos();
      }
    };

    window.addEventListener("storage", atualizarProdutos);

    return () => {
      window.removeEventListener("storage", atualizarProdutos);
    };
  }, []);

  const categorias = useMemo(() => {
    return Array.from(new Set(produtos.map((produto) => produto.categoria)));
  }, [produtos]);

  const produtosProcessados = useMemo(() => {
    return produtos.map((produto) => {
      const custoNumerico = converterMoeda(produto.custo);

      const precoNumerico = converterMoeda(produto.preco);

      const lucroUnitario = precoNumerico - custoNumerico;

      const custoTotal = custoNumerico * produto.estoque;

      const faturamentoPotencial = precoNumerico * produto.estoque;

      const lucroTotal = lucroUnitario * produto.estoque;

      const margem =
        precoNumerico > 0 ? (lucroUnitario / precoNumerico) * 100 : 0;

      return {
        ...produto,
        custoNumerico,
        precoNumerico,
        lucroUnitario,
        custoTotal,
        faturamentoPotencial,
        lucroTotal,
        margem,
        statusCalculado: obterStatusEstoque(produto),
      };
    });
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    return produtosProcessados.filter((produto) => {
      const correspondeBusca =
        produto.nome.toLowerCase().includes(termo) ||
        produto.codigo.toLowerCase().includes(termo) ||
        produto.categoria.toLowerCase().includes(termo);

      const correspondeCategoria =
        categoriaSelecionada === "todos" ||
        produto.categoria === categoriaSelecionada;

      const correspondeStatus =
        statusSelecionado === "todos" ||
        produto.statusCalculado === statusSelecionado;

      return correspondeBusca && correspondeCategoria && correspondeStatus;
    });
  }, [busca, categoriaSelecionada, statusSelecionado, produtosProcessados]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosFiltrados.length / itensPorPagina),
  );

  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  const inicio = (paginaSegura - 1) * itensPorPagina;

  const produtosDaPagina = produtosFiltrados.slice(
    inicio,
    inicio + itensPorPagina,
  );

  const resumo = useMemo(() => {
    const custoTotal = produtosProcessados.reduce(
      (total, produto) => total + produto.custoTotal,
      0,
    );

    const faturamentoPotencial = produtosProcessados.reduce(
      (total, produto) => total + produto.faturamentoPotencial,
      0,
    );

    const lucroTotal = produtosProcessados.reduce(
      (total, produto) => total + produto.lucroTotal,
      0,
    );

    const margem =
      faturamentoPotencial > 0 ? (lucroTotal / faturamentoPotencial) * 100 : 0;

    const estoqueBaixo = produtosProcessados.filter(
      (produto) => produto.statusCalculado === "baixo",
    ).length;

    const semEstoque = produtosProcessados.filter(
      (produto) => produto.statusCalculado === "sem-estoque",
    ).length;

    const unidades = produtosProcessados.reduce(
      (total, produto) => total + produto.estoque,
      0,
    );

    return {
      custoTotal,
      faturamentoPotencial,
      lucroTotal,
      margem,
      estoqueBaixo,
      semEstoque,
      unidades,
    };
  }, [produtosProcessados]);

  const alterarBusca = (valor: string) => {
    setBusca(valor);
    setPaginaAtual(1);
  };

  const alterarCategoria = (valor: string) => {
    setCategoriaSelecionada(valor);
    setPaginaAtual(1);
  };

  const alterarStatus = (valor: string) => {
    setStatusSelecionado(valor);
    setPaginaAtual(1);
  };

  /*
    Exclui o produto do produtosStore
    e atualiza imediatamente a lista.
  */
  const abrirModalExcluir = (produto: Produto) => {
    setProdutoParaExcluir(produto);
  };

  const fecharModalExcluir = () => {
    if (excluindoProduto) return;

    setProdutoParaExcluir(null);
  };

  const removerProduto = () => {
    if (!produtoParaExcluir) return;

    try {
      setExcluindoProduto(true);

      const excluido = excluirProduto(produtoParaExcluir.codigo);

      if (!excluido) {
        alert("Produto não encontrado.");

        setProdutoParaExcluir(null);

        return;
      }

      const produtosAtualizados = obterProdutos();

      setProdutos(produtosAtualizados);

      const novaQuantidade = produtosAtualizados.length;

      const totalPaginasDepois = Math.max(
        1,
        Math.ceil(novaQuantidade / itensPorPagina),
      );

      if (paginaAtual > totalPaginasDepois) {
        setPaginaAtual(totalPaginasDepois);
      }

      setMensagemSucesso(
        `Produto ${produtoParaExcluir.codigo} excluído com sucesso.`,
      );

      setProdutoParaExcluir(null);

      setTimeout(() => {
        setMensagemSucesso("");
      }, 4000);
    } catch (error) {
      console.error("Erro ao excluir produto:", error);

      alert("Não foi possível excluir o produto.");
    } finally {
      setExcluindoProduto(false);
    }
  };

  const exportarProdutos = () => {
    const cabecalho = [
      "Código",
      "Produto",
      "Categoria",
      "Estoque",
      "Custo Unitário",
      "Preço de Venda",
      "Lucro Unitário",
      "Margem",
    ];

    const linhas = produtosFiltrados.map((produto) => [
      produto.codigo,
      produto.nome,
      produto.categoria,
      produto.estoque,
      produto.custoNumerico.toFixed(2),
      produto.precoNumerico.toFixed(2),
      produto.lucroUnitario.toFixed(2),
      `${produto.margem.toFixed(2)}%`,
    ]);

    const csv = [cabecalho, ...linhas]
      .map((linha) =>
        linha
          .map((valor) => `"${String(valor).replace(/"/g, '""')}"`)
          .join(";"),
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = "produtos-abr-agro.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AppShell
        title="Produtos"
        description="Gerencie produtos, custos, preços e estoque."
      >
        <section className="admin-page">
          {mensagemSucesso && (
            <div className="system-toast success">
              <div className="system-toast-icon">✓</div>

              <span>{mensagemSucesso}</span>

              <button
                type="button"
                onClick={() => setMensagemSucesso("")}
                aria-label="Fechar mensagem"
              >
                <X size={18} />
              </button>
            </div>
          )}
          <div className="admin-page-header">
            <div>
              <span className="admin-eyebrow">Catálogo</span>

              <h2>Gestão de produtos</h2>

              <p>Controle seus produtos, custos, preços, margem e estoque.</p>
            </div>

            <div className="admin-page-actions">
              <button type="button" className="btn" onClick={exportarProdutos}>
                <Download size={18} />
                Exportar
              </button>

              <Link href="/produtos/novo" className="btn primary">
                <Plus size={18} />
                Novo produto
              </Link>
            </div>
          </div>

          <div className="admin-kpi-grid">
            <article className="admin-kpi-card">
              <span>Produtos cadastrados</span>

              <strong>{produtos.length}</strong>

              <p className="text-muted">
                <Package size={14} />
                {resumo.unidades} unidades em estoque
              </p>
            </article>

            <article className="admin-kpi-card">
              <span>Custo total</span>

              <strong>{formatarMoeda(resumo.custoTotal)}</strong>

              <p className="text-muted">Investimento atual em estoque</p>
            </article>

            <article className="admin-kpi-card">
              <span>Faturamento potencial</span>

              <strong>{formatarMoeda(resumo.faturamentoPotencial)}</strong>

              <p className="text-green">
                <TrendingUp size={14} />
                Valor potencial de venda
              </p>
            </article>

            <article className="admin-kpi-card">
              <span>Lucro potencial</span>

              <strong>{formatarMoeda(resumo.lucroTotal)}</strong>

              <p className="text-gold">
                Margem média de {resumo.margem.toFixed(1)}%
              </p>
            </article>
          </div>

          {(resumo.estoqueBaixo > 0 || resumo.semEstoque > 0) && (
            <div className="product-alert">
              <TriangleAlert size={20} />

              <div>
                <strong>Atenção ao estoque</strong>

                <span>
                  {resumo.estoqueBaixo > 0 &&
                    `${resumo.estoqueBaixo} produto(s) com estoque baixo. `}

                  {resumo.semEstoque > 0 &&
                    `${resumo.semEstoque} produto(s) sem estoque.`}
                </span>
              </div>
            </div>
          )}

          <article className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Produtos cadastrados</span>

                <h3>Catálogo ABR Agro</h3>

                <p>Consulte custos, preços, margem e disponibilidade.</p>
              </div>
            </div>

            <div className="admin-list-toolbar">
              <div className="admin-list-search">
                <Search size={18} />

                <input
                  type="text"
                  value={busca}
                  onChange={(event) => alterarBusca(event.target.value)}
                  placeholder="Buscar por produto, código ou categoria..."
                />
              </div>

              <div className="admin-filter-group">
                <select
                  value={categoriaSelecionada}
                  onChange={(event) => alterarCategoria(event.target.value)}
                >
                  <option value="todos">Todas as categorias</option>

                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>

                <select
                  value={statusSelecionado}
                  onChange={(event) => alterarStatus(event.target.value)}
                >
                  <option value="todos">Todos os status</option>

                  <option value="normal">Estoque normal</option>

                  <option value="baixo">Estoque baixo</option>

                  <option value="sem-estoque">Sem estoque</option>

                  <option value="inativo">Inativo</option>
                </select>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Estoque</th>
                    <th>Custo</th>
                    <th>Venda</th>
                    <th>Lucro un.</th>
                    <th>Margem</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {produtosDaPagina.map((produto) => (
                    <tr key={produto.id}>
                      <td>
                        <div className="product-name">
                          <strong>{produto.nome}</strong>

                          <span>{produto.codigo}</span>
                        </div>
                      </td>

                      <td>{produto.categoria}</td>

                      <td>
                        <strong>{produto.estoque}</strong> unidades
                      </td>

                      <td>{formatarMoeda(produto.custoNumerico)}</td>

                      <td className="price sale">
                        {formatarMoeda(produto.precoNumerico)}
                      </td>

                      <td className="text-green">
                        {formatarMoeda(produto.lucroUnitario)}
                      </td>

                      <td>{produto.margem.toFixed(1)}%</td>

                      <td>
                        <span
                          className={`admin-status ${produto.statusCalculado}`}
                        >
                          <span className="admin-status-dot" />

                          {produto.statusCalculado === "normal" && "Normal"}

                          {produto.statusCalculado === "baixo" &&
                            "Estoque baixo"}

                          {produto.statusCalculado === "sem-estoque" &&
                            "Sem estoque"}

                          {produto.statusCalculado === "inativo" && "Inativo"}
                        </span>
                      </td>

                      <td>
                        <div className="product-actions">
                          <Link
                            href={`/produtos/${produto.codigo}/editar`}
                            className="product-action-btn edit"
                            title={`Editar ${produto.nome}`}
                          >
                            <Pencil size={17} />
                          </Link>

                          <button
                            type="button"
                            className="product-action-btn delete"
                            onClick={() => abrirModalExcluir(produto)}
                            title={`Excluir ${produto.nome}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {produtosDaPagina.length === 0 && (
                    <tr>
                      <td colSpan={9} className="empty-table">
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-table-footer">
              <span>
                Mostrando {produtosFiltrados.length === 0 ? 0 : inicio + 1} até{" "}
                {Math.min(inicio + itensPorPagina, produtosFiltrados.length)} de{" "}
                {produtosFiltrados.length} produto(s)
              </span>

              <div className="admin-pagination">
                <button
                  type="button"
                  className="btn"
                  disabled={paginaSegura === 1}
                  onClick={() => setPaginaAtual(paginaSegura - 1)}
                >
                  <ChevronLeft size={17} />
                  Anterior
                </button>

                <span className="pagination-info">
                  Página {paginaSegura} de {totalPaginas}
                </span>

                <button
                  type="button"
                  className="btn"
                  disabled={paginaSegura === totalPaginas}
                  onClick={() => setPaginaAtual(paginaSegura + 1)}
                >
                  Próximo
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </article>
        </section>
      </AppShell>

      {produtoParaExcluir && (
        <div className="confirm-modal-overlay" onMouseDown={fecharModalExcluir}>
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="confirm-modal-close"
              onClick={fecharModalExcluir}
              aria-label="Fechar"
              disabled={excluindoProduto}
            >
              <X size={20} />
            </button>

            <div className="confirm-modal-icon">
              <TriangleAlert size={30} />
            </div>

            <span className="admin-eyebrow">EXCLUIR PRODUTO</span>

            <h2 id="confirm-delete-title">Tem certeza que deseja excluir?</h2>

            <p>
              Você está prestes a excluir permanentemente este produto do
              sistema.
            </p>

            <div className="confirm-product-info">
              <div className="confirm-product-icon">
                <Package size={22} />
              </div>

              <div>
                <strong>{produtoParaExcluir.nome}</strong>

                <span>Código: {produtoParaExcluir.codigo}</span>
              </div>
            </div>

            <div className="confirm-modal-warning">
              <TriangleAlert size={17} />

              <span>Esta ação não poderá ser desfeita.</span>
            </div>

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="btn"
                onClick={fecharModalExcluir}
                disabled={excluindoProduto}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn danger"
                onClick={removerProduto}
                disabled={excluindoProduto}
              >
                <Trash2 size={18} />

                {excluindoProduto ? "Excluindo..." : "Excluir produto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
