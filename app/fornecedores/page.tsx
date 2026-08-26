"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Users,
  UserCheck,
  UserX,
} from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";

import {
  obterFornecedores,
  obterStatusFornecedorLabel,
  type Fornecedor,
} from "../../data/fornecedoresStore";

function formatarDocumento(documento?: string) {
  if (!documento) {
    return "—";
  }

  return documento;
}

function formatarLocalizacao(fornecedor: Fornecedor) {
  const partes = [fornecedor.cidade, fornecedor.estado].filter(Boolean);

  return partes.length > 0 ? partes.join(" / ") : "—";
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  const [busca, setBusca] = useState("");

  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativo" | "inativo"
  >("todos");

  /*
   * =====================================================
   * CARREGAMENTO DOS FORNECEDORES
   *
   * Importante:
   * Não carregamos localStorage durante a renderização.
   * Primeiro o servidor e o cliente renderizam com [].
   * Depois o navegador carrega os fornecedores.
   * Isso evita Hydration Error.
   * =====================================================
   */

  function carregarFornecedores() {
    setFornecedores(obterFornecedores());
  }

  useEffect(() => {
    carregarFornecedores();

    const atualizar = () => {
      carregarFornecedores();
    };

    window.addEventListener("abr-agro-fornecedores-atualizados", atualizar);

    return () => {
      window.removeEventListener(
        "abr-agro-fornecedores-atualizados",
        atualizar,
      );
    };
  }, []);

  /*
   * =====================================================
   * RESUMO
   *
   * O resumo agora é calculado diretamente do estado.
   * Não chamamos obterResumoFornecedores() aqui,
   * pois ele pode acessar localStorage durante a
   * renderização e causar erro de hidratação.
   * =====================================================
   */

  const resumo = useMemo(() => {
    const total = fornecedores.length;

    const ativos = fornecedores.filter(
      (fornecedor) => fornecedor.status === "ativo",
    ).length;

    const inativos = fornecedores.filter(
      (fornecedor) => fornecedor.status === "inativo",
    ).length;

    return {
      total,
      ativos,
      inativos,
    };
  }, [fornecedores]);

  /*
   * =====================================================
   * FILTROS
   * =====================================================
   */

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return fornecedores.filter((fornecedor) => {
      const correspondeBusca =
        !termo ||
        fornecedor.codigo.toLowerCase().includes(termo) ||
        fornecedor.razaoSocial.toLowerCase().includes(termo) ||
        fornecedor.nomeFantasia?.toLowerCase().includes(termo) ||
        fornecedor.documento?.toLowerCase().includes(termo) ||
        fornecedor.email?.toLowerCase().includes(termo) ||
        fornecedor.cidade?.toLowerCase().includes(termo);

      const correspondeStatus =
        filtroStatus === "todos" || fornecedor.status === filtroStatus;

      return correspondeBusca && correspondeStatus;
    });
  }, [fornecedores, busca, filtroStatus]);

  return (
    <AppShell
      title="Fornecedores"
      description="Gerencie fornecedores, contatos e informações comerciais."
    >
      <section className="admin-page fornecedores-page">
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Gestão comercial</span>

            <h2>Fornecedores</h2>

            <p>
              Cadastre e acompanhe os fornecedores utilizados nas compras do
              sistema.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/fornecedores/nova" className="btn primary">
              <Plus size={18} />
              Novo fornecedor
            </Link>
          </div>
        </div>

        {/* =====================================================
            INDICADORES
        ====================================================== */}

        <div className="fornecedores-resumo-grid">
          <article className="admin-card fornecedores-resumo-card">
            <div className="fornecedores-resumo-icon">
              <Users size={20} />
            </div>

            <div>
              <span>Total</span>

              <strong>{resumo.total}</strong>
            </div>
          </article>

          <article className="admin-card fornecedores-resumo-card">
            <div className="fornecedores-resumo-icon">
              <UserCheck size={20} />
            </div>

            <div>
              <span>Ativos</span>

              <strong>{resumo.ativos}</strong>
            </div>
          </article>

          <article className="admin-card fornecedores-resumo-card">
            <div className="fornecedores-resumo-icon">
              <UserX size={20} />
            </div>

            <div>
              <span>Inativos</span>

              <strong>{resumo.inativos}</strong>
            </div>
          </article>
        </div>

        {/* =====================================================
            FILTROS
        ====================================================== */}

        <div className="admin-card fornecedores-filtros-card">
          <div className="fornecedores-filtros">
            <label className="fornecedores-busca">
              <Search size={18} />

              <input
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por fornecedor, código, documento, cidade..."
              />
            </label>

            <div className="fornecedores-status-filtros">
              <button
                type="button"
                className={
                  filtroStatus === "todos"
                    ? "fornecedor-filtro ativo"
                    : "fornecedor-filtro"
                }
                onClick={() => setFiltroStatus("todos")}
              >
                Todos
              </button>

              <button
                type="button"
                className={
                  filtroStatus === "ativo"
                    ? "fornecedor-filtro ativo"
                    : "fornecedor-filtro"
                }
                onClick={() => setFiltroStatus("ativo")}
              >
                Ativos
              </button>

              <button
                type="button"
                className={
                  filtroStatus === "inativo"
                    ? "fornecedor-filtro ativo"
                    : "fornecedor-filtro"
                }
                onClick={() => setFiltroStatus("inativo")}
              >
                Inativos
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            LISTA
        ====================================================== */}

        <div className="admin-card fornecedores-lista-card">
          <div className="admin-card-header">
            <div>
              <span className="admin-eyebrow">Cadastro</span>

              <h3>Lista de fornecedores</h3>

              <p>
                {fornecedoresFiltrados.length} fornecedor
                {fornecedoresFiltrados.length !== 1 ? "es" : ""} encontrado
                {fornecedoresFiltrados.length !== 1 ? "s" : ""}
              </p>
            </div>

            <Building2 size={24} />
          </div>

          {fornecedoresFiltrados.length === 0 ? (
            <div className="fornecedores-vazio">
              <div className="fornecedores-vazio-icon">
                <Building2 size={28} />
              </div>

              <strong>Nenhum fornecedor encontrado</strong>

              <span>
                {busca || filtroStatus !== "todos"
                  ? "Tente alterar os filtros utilizados."
                  : "Cadastre seu primeiro fornecedor para começar."}
              </span>

              {!busca && filtroStatus === "todos" && (
                <Link href="/fornecedores/nova" className="btn primary">
                  <Plus size={17} />
                  Cadastrar fornecedor
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* CABEÇALHO DA TABELA */}

              <div className="fornecedores-tabela-header">
                <span>Código</span>

                <span>Fornecedor</span>

                <span>Documento</span>

                <span>Contato</span>

                <span>Localização</span>

                <span>Status</span>

                <span />
              </div>

              {/* LINHAS */}

              <div className="fornecedores-tabela">
                {fornecedoresFiltrados.map((fornecedor) => (
                  <Link
                    href={`/fornecedores/${fornecedor.id}`}
                    className="fornecedor-linha"
                    key={fornecedor.id}
                  >
                    <div className="fornecedor-codigo">
                      <span>#{fornecedor.codigo}</span>
                    </div>

                    <div className="fornecedor-nome">
                      <div className="fornecedor-avatar">
                        <Building2 size={17} />
                      </div>

                      <div>
                        <strong>
                          {fornecedor.nomeFantasia || fornecedor.razaoSocial}
                        </strong>

                        {fornecedor.nomeFantasia &&
                          fornecedor.razaoSocial !==
                            fornecedor.nomeFantasia && (
                            <small>{fornecedor.razaoSocial}</small>
                          )}
                      </div>
                    </div>

                    <div className="fornecedor-documento">
                      <span>{formatarDocumento(fornecedor.documento)}</span>
                    </div>

                    <div className="fornecedor-contato">
                      {fornecedor.email && (
                        <span>
                          <Mail size={14} />
                          {fornecedor.email}
                        </span>
                      )}

                      {(fornecedor.telefone || fornecedor.celular) && (
                        <span>
                          <Phone size={14} />
                          {fornecedor.telefone || fornecedor.celular}
                        </span>
                      )}

                      {!fornecedor.email &&
                        !fornecedor.telefone &&
                        !fornecedor.celular && <span>—</span>}
                    </div>

                    <div className="fornecedor-localizacao">
                      <span>
                        <MapPin size={14} />

                        {formatarLocalizacao(fornecedor)}
                      </span>
                    </div>

                    <div>
                      <span
                        className={
                          fornecedor.status === "ativo"
                            ? "fornecedor-status ativo"
                            : "fornecedor-status inativo"
                        }
                      >
                        {obterStatusFornecedorLabel(fornecedor.status)}
                      </span>
                    </div>

                    <div className="fornecedor-acesso">
                      <ChevronRight size={18} />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </AppShell>
  );
}
