"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { ArrowLeft, Calculator, PackagePlus, Save } from "lucide-react";

import { AppShell } from "../../../../components/layout/AppShell";

import {
  obterProdutos,
  atualizarProduto,
  type Produto,
} from "../../../../data/produtosStore";

const categorias = [
  "Ração para Peixes",
  "Ração para Gatos",
  "Ração para Cães",
  "Ração Bovina",
  "Ração Equina",
  "Ração Suína",
  "Ração para Aves",
  "Suplementação Animal",
  "Outros",
];

const unidades = ["UN", "KG", "SC", "CX", "FD", "LT"];

const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
};

function converterMoedaParaNumero(valor: string | number) {
  if (typeof valor === "number") {
    return valor;
  }

  return Number(
    valor.replace("R$", "").replace(/\./g, "").replace(",", ".").trim(),
  );
}

function formatarNumeroInput(valor: string | number) {
  const numero = converterMoedaParaNumero(valor);

  if (Number.isNaN(numero)) {
    return "";
  }

  return numero.toFixed(2).replace(".", ",");
}

export default function EditarProdutoPage() {
  const router = useRouter();

  const params = useParams();

  const codigo =
    typeof params.codigo === "string" ? decodeURIComponent(params.codigo) : "";

  const [produto, setProduto] = useState<Produto | null>(null);

  const [carregando, setCarregando] = useState(true);

  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState("");

  const [categoria, setCategoria] = useState("");

  const [marca, setMarca] = useState("");

  const [unidade, setUnidade] = useState("UN");

  const [estoque, setEstoque] = useState("");

  const [estoqueMinimo, setEstoqueMinimo] = useState("");

  const [custo, setCusto] = useState("");

  const [preco, setPreco] = useState("");

  const [status, setStatus] = useState("ativo");

  const [observacoes, setObservacoes] = useState("");

  /*
    Carrega o produto de acordo
    com o código presente na URL.

    Exemplo:
    /produtos/ABR-037/editar

    código encontrado:
    ABR-037
  */
  useEffect(() => {
    if (!codigo) {
      return;
    }

    const produtos = obterProdutos();

    const produtoEncontrado = produtos.find((item) => item.codigo === codigo);

    if (!produtoEncontrado) {
      setCarregando(false);

      return;
    }

    setProduto(produtoEncontrado);

    setNome(produtoEncontrado.nome);

    setCategoria(produtoEncontrado.categoria);

    setMarca(produtoEncontrado.marca || "");

    setUnidade(produtoEncontrado.unidade || "UN");

    setEstoque(String(produtoEncontrado.estoque));

    setEstoqueMinimo(String(produtoEncontrado.estoqueMinimo ?? 2));

    setCusto(formatarNumeroInput(produtoEncontrado.custo));

    setPreco(formatarNumeroInput(produtoEncontrado.preco));

    setStatus(produtoEncontrado.status === "inativo" ? "inativo" : "ativo");

    setObservacoes(produtoEncontrado.observacoes || "");

    setCarregando(false);
  }, [codigo]);

  const custoNumerico = useMemo(() => {
    const valor = Number(custo.replace(/\./g, "").replace(",", "."));

    return Number.isNaN(valor) ? 0 : valor;
  }, [custo]);

  const precoNumerico = useMemo(() => {
    const valor = Number(preco.replace(/\./g, "").replace(",", "."));

    return Number.isNaN(valor) ? 0 : valor;
  }, [preco]);

  const lucroUnitario = precoNumerico - custoNumerico;

  const margem = precoNumerico > 0 ? (lucroUnitario / precoNumerico) * 100 : 0;

  const salvarAlteracoes = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (salvando) {
      return;
    }

    if (
      !nome.trim() ||
      !categoria ||
      custoNumerico <= 0 ||
      precoNumerico <= 0
    ) {
      alert("Preencha todos os campos obrigatórios.");

      return;
    }

    setSalvando(true);

    try {
      const produtoAtualizado = atualizarProduto(codigo, {
        nome: nome.trim(),
        categoria,
        marca: marca.trim(),
        unidade,
        estoque: Number(estoque || 0),
        estoqueMinimo: Number(estoqueMinimo || 0),
        custo: custoNumerico,
        preco: precoNumerico,
        status: status === "inativo" ? "inativo" : "ativo",
        observacoes: observacoes.trim(),
      });

      if (!produtoAtualizado) {
        alert("Produto não encontrado.");

        setSalvando(false);

        return;
      }

      alert(`Produto ${codigo} atualizado com sucesso!`);

      router.push("/produtos");
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o produto.",
      );

      setSalvando(false);
    }
  };

  /*
    Enquanto o produto está sendo
    carregado.
  */
  if (carregando) {
    return (
      <AppShell
        title="Editar produto"
        description="Carregando informações do produto..."
      >
        <section className="admin-page">
          <div className="admin-card">
            <p>Carregando produto...</p>
          </div>
        </section>
      </AppShell>
    );
  }

  /*
    Caso o código da URL não exista.
  */
  if (!produto) {
    return (
      <AppShell
        title="Produto não encontrado"
        description="O produto solicitado não foi encontrado."
      >
        <section className="admin-page">
          <div className="admin-card">
            <span className="admin-eyebrow">Erro</span>

            <h2>Produto não encontrado</h2>

            <p>
              Não foi possível encontrar o produto com o código{" "}
              <strong>{codigo}</strong>.
            </p>

            <div className="product-form-actions">
              <Link href="/produtos" className="btn primary">
                <ArrowLeft size={18} />
                Voltar para produtos
              </Link>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Editar produto"
      description={`Atualize as informações de ${produto.nome}.`}
    >
      <section className="admin-page">
        <div className="admin-page-header">
          <div>
            <Link href="/produtos" className="back-link">
              <ArrowLeft size={17} />
              Voltar para produtos
            </Link>

            <span className="admin-eyebrow">Edição</span>

            <h2>Editar produto</h2>

            <p>Atualize as informações, estoque e precificação do produto.</p>
          </div>
        </div>

        <form className="product-form" onSubmit={salvarAlteracoes}>
          {/* INFORMAÇÕES PRINCIPAIS */}

          <article className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Informações principais</span>

                <h3>Dados do produto</h3>

                <p>
                  Atualize as informações de identificação e organização do
                  produto.
                </p>
              </div>

              <PackagePlus size={26} />
            </div>

            <div className="form-grid">
              <label className="form-field form-field-full">
                <span>Nome do produto *</span>

                <input
                  type="text"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span>Código do produto</span>

                <input
                  type="text"
                  value={codigo}
                  readOnly
                  className="auto-code-input"
                />

                <small className="form-help">
                  O código do produto não pode ser alterado.
                </small>
              </label>

              <label className="form-field">
                <span>Categoria *</span>

                <select
                  value={categoria}
                  onChange={(event) => setCategoria(event.target.value)}
                  required
                >
                  <option value="">Selecione uma categoria</option>

                  {categorias.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Marca</span>

                <input
                  type="text"
                  value={marca}
                  onChange={(event) => setMarca(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Unidade de medida</span>

                <select
                  value={unidade}
                  onChange={(event) => setUnidade(event.target.value)}
                >
                  {unidades.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span>Status do produto</span>

                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="ativo">Ativo</option>

                  <option value="inativo">Inativo</option>
                </select>
              </label>
            </div>
          </article>

          {/* ESTOQUE */}

          <article className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Estoque</span>

                <h3>Controle de estoque</h3>

                <p>Atualize a quantidade disponível e o estoque mínimo.</p>
              </div>
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>Quantidade em estoque</span>

                <input
                  type="number"
                  min="0"
                  value={estoque}
                  onChange={(event) => setEstoque(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Estoque mínimo</span>

                <input
                  type="number"
                  min="0"
                  value={estoqueMinimo}
                  onChange={(event) => setEstoqueMinimo(event.target.value)}
                />
              </label>
            </div>
          </article>

          {/* PRECIFICAÇÃO */}

          <article className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Precificação</span>

                <h3>Custos e preço de venda</h3>

                <p>O lucro e a margem são recalculados automaticamente.</p>
              </div>

              <Calculator size={26} />
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>Custo unitário *</span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={custo}
                  onChange={(event) => setCusto(event.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span>Preço de venda *</span>

                <input
                  type="text"
                  inputMode="decimal"
                  value={preco}
                  onChange={(event) => setPreco(event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="pricing-summary">
              <div>
                <span>Custo unitário</span>

                <strong>{formatarMoeda(custoNumerico)}</strong>
              </div>

              <div>
                <span>Preço de venda</span>

                <strong>{formatarMoeda(precoNumerico)}</strong>
              </div>

              <div>
                <span>Lucro unitário</span>

                <strong className="text-green">
                  {formatarMoeda(lucroUnitario)}
                </strong>
              </div>

              <div>
                <span>Margem de lucro</span>

                <strong className="text-gold">{margem.toFixed(1)}%</strong>
              </div>
            </div>
          </article>

          {/* OBSERVAÇÕES */}

          <article className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Informações adicionais</span>

                <h3>Observações</h3>

                <p>Adicione ou altere informações internas sobre o produto.</p>
              </div>
            </div>

            <label className="form-field">
              <span>Observações internas</span>

              <textarea
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                rows={5}
              />
            </label>
          </article>

          {/* AÇÕES */}

          <div className="product-form-actions">
            <Link href="/produtos" className="btn">
              Cancelar
            </Link>

            <button type="submit" className="btn primary" disabled={salvando}>
              <Save size={18} />

              {salvando ? "Salvando alterações..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
