"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Calculator, PackagePlus, Save } from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";

import {
  adicionarProduto,
  obterProximoCodigo,
} from "../../../data/produtosStore";

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

export default function NovoProdutoPage() {
  const router = useRouter();

  /*
    O código agora é obtido pelo produtosStore.

    Exemplo:
    ABR-036 existe
    ↓
    Próximo código: ABR-037
  */
  const [codigo] = useState(() => obterProximoCodigo());

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

  const [salvando, setSalvando] = useState(false);

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

  const salvarProduto = (event: React.FormEvent<HTMLFormElement>) => {
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
      /*
        O código exibido é apenas uma prévia.

        O adicionarProduto() gera novamente
        o código no momento da gravação,
        evitando problemas de sequência.
      */
      const produtoSalvo = adicionarProduto({
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

      alert(`Produto ${produtoSalvo.codigo} cadastrado com sucesso!`);

      /*
        Após salvar, vai para a lista.

        A página /produtos carrega os dados
        diretamente do produtosStore.
      */
      router.push("/produtos");
    } catch (error) {
      console.error("Erro ao salvar produto:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o produto.",
      );

      setSalvando(false);
    }
  };

  return (
    <AppShell
      title="Novo produto"
      description="Cadastre um novo produto no catálogo."
    >
      <section className="admin-page">
        <div className="admin-page-header">
          <div>
            <Link href="/produtos" className="back-link">
              <ArrowLeft size={17} />
              Voltar para produtos
            </Link>

            <span className="admin-eyebrow">Cadastro</span>

            <h2>Novo produto</h2>

            <p>
              Preencha as informações para adicionar um novo produto ao
              catálogo.
            </p>
          </div>
        </div>

        <form className="product-form" onSubmit={salvarProduto}>
          {/* INFORMAÇÕES PRINCIPAIS */}

          <article className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Informações principais</span>

                <h3>Dados do produto</h3>

                <p>
                  Informações utilizadas para identificar e organizar o produto.
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
                  placeholder="Ex.: Ração Balanceada Equino Sport"
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
                  Código gerado automaticamente pelo sistema.
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
                  placeholder="Ex.: Das Neves"
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

                <p>Informe a quantidade atual e o nível mínimo recomendado.</p>
              </div>
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>Quantidade inicial</span>

                <input
                  type="number"
                  min="0"
                  value={estoque}
                  onChange={(event) => setEstoque(event.target.value)}
                  placeholder="0"
                />
              </label>

              <label className="form-field">
                <span>Estoque mínimo</span>

                <input
                  type="number"
                  min="0"
                  value={estoqueMinimo}
                  onChange={(event) => setEstoqueMinimo(event.target.value)}
                  placeholder="Ex.: 5"
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

                <p>O sistema calcula automaticamente o lucro e a margem.</p>
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
                  placeholder="Ex.: 90,50"
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
                  placeholder="Ex.: 129,90"
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

                <p>Adicione informações importantes sobre este produto.</p>
              </div>
            </div>

            <label className="form-field">
              <span>Observações internas</span>

              <textarea
                value={observacoes}
                onChange={(event) => setObservacoes(event.target.value)}
                placeholder="Digite informações adicionais sobre o produto..."
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

              {salvando ? "Salvando..." : "Salvar produto"}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
