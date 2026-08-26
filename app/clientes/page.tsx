"use client";

import Link from "next/link";
import {
  Building2,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  User,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AppShell } from "../../components/layout/AppShell";

import {
  obterClientes,
  obterEventoClientesAtualizados,
  obterStatusClienteLabel,
  obterTipoClienteLabel,
  type Cliente,
} from "../../data/clientesStore";

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [busca, setBusca] = useState("");

  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativo" | "inativo"
  >("todos");

  /*
   * =====================================================
   * CARREGAMENTO
   *
   * Começamos com [] para evitar Hydration Error.
   * Os dados do localStorage são carregados somente
   * depois que o componente monta no navegador.
   * =====================================================
   */

  function carregarClientes() {
    setClientes(obterClientes());
  }

  useEffect(() => {
    carregarClientes();

    const atualizar = () => {
      carregarClientes();
    };

    const evento = obterEventoClientesAtualizados();

    window.addEventListener(evento, atualizar);

    return () => {
      window.removeEventListener(evento, atualizar);
    };
  }, []);

  /*
   * =====================================================
   * RESUMO
   *
   * Calculado diretamente do estado para evitar acesso
   * ao localStorage durante a renderização.
   * =====================================================
   */

  const resumo = useMemo(() => {
    const total = clientes.length;

    const ativos = clientes.filter(
      (cliente) => cliente.status === "ativo",
    ).length;

    const inativos = clientes.filter(
      (cliente) => cliente.status === "inativo",
    ).length;

    return {
      total,
      ativos,
      inativos,
    };
  }, [clientes]);

  /*
   * =====================================================
   * FILTROS
   * =====================================================
   */

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return clientes.filter((cliente) => {
      const correspondeBusca =
        !termo ||
        cliente.codigo.toLowerCase().includes(termo) ||
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.nomeFantasia?.toLowerCase().includes(termo) ||
        cliente.documento?.toLowerCase().includes(termo) ||
        cliente.email?.toLowerCase().includes(termo) ||
        cliente.telefone?.toLowerCase().includes(termo) ||
        cliente.celular?.toLowerCase().includes(termo) ||
        cliente.cidade?.toLowerCase().includes(termo);

      const correspondeStatus =
        filtroStatus === "todos" || cliente.status === filtroStatus;

      return correspondeBusca && correspondeStatus;
    });
  }, [clientes, busca, filtroStatus]);

  /*
   * =====================================================
   * FUNÇÕES VISUAIS
   * =====================================================
   */

  function obterNomeExibicao(cliente: Cliente) {
    return cliente.nomeFantasia || cliente.nome;
  }

  function obterLocalizacao(cliente: Cliente) {
    const partes = [cliente.cidade, cliente.estado].filter(Boolean);

    return partes.length > 0 ? partes.join(" / ") : "—";
  }

  function obterIconeCliente(cliente: Cliente) {
    if (cliente.tipo === "juridica") {
      return <Building2 size={17} />;
    }

    return <User size={17} />;
  }

  return (
    <AppShell
      title="Clientes"
      description="Gerencie clientes, contatos e informações comerciais."
    >
      <section className="admin-page clientes-page">
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Gestão comercial</span>

            <h2>Clientes</h2>

            <p>Cadastre e acompanhe os clientes da ABR Agro.</p>
          </div>

          <div className="admin-page-actions">
            <Link href="/clientes/nova" className="btn primary">
              <Plus size={18} />
              Novo cliente
            </Link>
          </div>
        </div>

        {/* =====================================================
            INDICADORES
        ====================================================== */}

        <div className="clientes-resumo-grid">
          <article className="admin-card clientes-resumo-card">
            <div className="clientes-resumo-icon">
              <Users size={20} />
            </div>

            <div>
              <span>Total de clientes</span>

              <strong>{resumo.total}</strong>

              <small>Clientes cadastrados</small>
            </div>
          </article>

          <article className="admin-card clientes-resumo-card">
            <div className="clientes-resumo-icon clientes-resumo-icon-success">
              <UserCheck size={20} />
            </div>

            <div>
              <span>Clientes ativos</span>

              <strong className="text-success">{resumo.ativos}</strong>

              <small>Clientes habilitados</small>
            </div>
          </article>

          <article className="admin-card clientes-resumo-card">
            <div className="clientes-resumo-icon clientes-resumo-icon-danger">
              <UserX size={20} />
            </div>

            <div>
              <span>Clientes inativos</span>

              <strong className="text-danger">{resumo.inativos}</strong>

              <small>Clientes desativados</small>
            </div>
          </article>
        </div>

        {/* =====================================================
            FILTROS
        ====================================================== */}

        <div className="admin-card clientes-filtros-card">
          <div className="clientes-filtros">
            <label className="clientes-busca">
              <Search size={18} />

              <input
                type="text"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por nome, código, CPF/CNPJ, telefone, e-mail..."
              />
            </label>

            <div className="clientes-status-filtros">
              <button
                type="button"
                className={
                  filtroStatus === "todos"
                    ? "cliente-filtro ativo"
                    : "cliente-filtro"
                }
                onClick={() => setFiltroStatus("todos")}
              >
                Todos
              </button>

              <button
                type="button"
                className={
                  filtroStatus === "ativo"
                    ? "cliente-filtro ativo"
                    : "cliente-filtro"
                }
                onClick={() => setFiltroStatus("ativo")}
              >
                Ativos
              </button>

              <button
                type="button"
                className={
                  filtroStatus === "inativo"
                    ? "cliente-filtro ativo"
                    : "cliente-filtro"
                }
                onClick={() => setFiltroStatus("inativo")}
              >
                Inativos
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            LISTA DE CLIENTES
        ====================================================== */}

        <div className="admin-card clientes-lista-card">
          <div className="admin-card-header">
            <div>
              <span className="admin-eyebrow">Cadastro</span>

              <h3>Clientes cadastrados</h3>

              <p>Consulte os dados dos clientes cadastrados.</p>
            </div>

            <Users size={24} />
          </div>

          {/* =================================================
              VAZIO
          ================================================== */}

          {clientesFiltrados.length === 0 ? (
            <div className="clientes-vazio">
              <div className="clientes-vazio-icon">
                <Users size={30} />
              </div>

              <strong>Nenhum cliente encontrado</strong>

              <span>
                {busca || filtroStatus !== "todos"
                  ? "Tente alterar os filtros utilizados."
                  : "Cadastre seu primeiro cliente para começar."}
              </span>

              {!busca && filtroStatus === "todos" && (
                <Link href="/clientes/nova" className="btn primary">
                  <Plus size={17} />
                  Cadastrar cliente
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* =============================================
                  CABEÇALHO DA LISTA
              ============================================== */}

              <div className="clientes-tabela-header">
                <span>Código</span>

                <span>Cliente</span>

                <span>Documento</span>

                <span>Contato</span>

                <span>Localização</span>

                <span>Status</span>

                <span />
              </div>

              {/* =============================================
                  LINHAS
              ============================================== */}

              <div className="clientes-tabela">
                {clientesFiltrados.map((cliente) => (
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="cliente-linha"
                    key={cliente.id}
                  >
                    {/* Código */}

                    <div className="cliente-codigo">
                      <span>#{cliente.codigo}</span>
                    </div>

                    {/* Cliente */}

                    <div className="cliente-nome">
                      <div className="cliente-avatar">
                        {obterIconeCliente(cliente)}
                      </div>

                      <div>
                        <strong>{obterNomeExibicao(cliente)}</strong>

                        <small>{obterTipoClienteLabel(cliente.tipo)}</small>
                      </div>
                    </div>

                    {/* Documento */}

                    <div className="cliente-documento">
                      <span>{cliente.documento || "Não informado"}</span>
                    </div>

                    {/* Contato */}

                    <div className="cliente-contato">
                      {cliente.email && (
                        <span>
                          <Mail size={14} />

                          {cliente.email}
                        </span>
                      )}

                      {(cliente.telefone || cliente.celular) && (
                        <span>
                          <Phone size={14} />

                          {cliente.telefone || cliente.celular}
                        </span>
                      )}

                      {!cliente.email &&
                        !cliente.telefone &&
                        !cliente.celular && <span>—</span>}
                    </div>

                    {/* Localização */}

                    <div className="cliente-localizacao">
                      <span>
                        <MapPin size={14} />

                        {obterLocalizacao(cliente)}
                      </span>
                    </div>

                    {/* Status */}

                    <div>
                      <span
                        className={
                          cliente.status === "ativo"
                            ? "cliente-status ativo"
                            : "cliente-status inativo"
                        }
                      >
                        {obterStatusClienteLabel(cliente.status)}
                      </span>
                    </div>

                    {/* Acesso */}

                    <div className="cliente-acesso">
                      <ChevronRight size={18} />
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        {/* =====================================================
            RODAPÉ DA LISTA
        ====================================================== */}

        {clientesFiltrados.length > 0 && (
          <div className="clientes-lista-footer">
            <span>
              Exibindo <strong>{clientesFiltrados.length}</strong> de{" "}
              <strong>{clientes.length}</strong> clientes
            </span>
          </div>
        )}
      </section>
    </AppShell>
  );
}
