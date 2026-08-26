"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  UserCheck,
  UserX,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";

import {
  alterarStatusCliente,
  atualizarCliente,
  obterClientePorId,
  obterStatusClienteLabel,
  obterTipoClienteLabel,
  type Cliente,
} from "../../../data/clientesStore";

export default function ClienteDetalhesPage() {
  const params = useParams();

  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";

  const [cliente, setCliente] = useState<Cliente | null>(null);

  const [carregando, setCarregando] = useState(true);

  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  const mensagemRef = useRef<HTMLDivElement>(null);

  /* =========================================================
     FORMULÁRIO
     ========================================================= */

  const [tipo, setTipo] = useState<Cliente["tipo"]>("fisica");

  const [nome, setNome] = useState("");

  const [nomeFantasia, setNomeFantasia] = useState("");

  const [documento, setDocumento] = useState("");

  const [email, setEmail] = useState("");

  const [telefone, setTelefone] = useState("");

  const [celular, setCelular] = useState("");

  const [cep, setCep] = useState("");

  const [endereco, setEndereco] = useState("");

  const [numero, setNumero] = useState("");

  const [complemento, setComplemento] = useState("");

  const [bairro, setBairro] = useState("");

  const [cidade, setCidade] = useState("");

  const [estado, setEstado] = useState("");

  const [observacao, setObservacao] = useState("");

  /* =========================================================
     CARREGAMENTO
     ========================================================= */

  useEffect(() => {
    if (!id) {
      setCarregando(false);
      return;
    }

    const encontrado = obterClientePorId(id);

    if (!encontrado) {
      setCliente(null);
      setCarregando(false);
      return;
    }

    setCliente(encontrado);

    setTipo(encontrado.tipo);

    setNome(encontrado.nome);

    setNomeFantasia(encontrado.nomeFantasia ?? "");

    setDocumento(encontrado.documento ?? "");

    setEmail(encontrado.email ?? "");

    setTelefone(encontrado.telefone ?? "");

    setCelular(encontrado.celular ?? "");

    setCep(encontrado.cep ?? "");

    setEndereco(encontrado.endereco ?? "");

    setNumero(encontrado.numero ?? "");

    setComplemento(encontrado.complemento ?? "");

    setBairro(encontrado.bairro ?? "");

    setCidade(encontrado.cidade ?? "");

    setEstado(encontrado.estado ?? "");

    setObservacao(encontrado.observacao ?? "");

    setCarregando(false);
  }, [id]);

  /* =========================================================
     SALVAR ALTERAÇÕES
     ========================================================= */

  function salvarAlteracoes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (!nome.trim()) {
      setErro(
        tipo === "fisica"
          ? "Informe o nome completo do cliente."
          : "Informe a razão social do cliente.",
      );

      return;
    }

    setSalvando(true);

    try {
      const atualizado = atualizarCliente(id, {
        tipo,

        nome: nome.trim(),

        nomeFantasia: nomeFantasia.trim() || undefined,

        documento: documento.trim() || undefined,

        email: email.trim() || undefined,

        telefone: telefone.trim() || undefined,

        celular: celular.trim() || undefined,

        cep: cep.trim() || undefined,

        endereco: endereco.trim() || undefined,

        numero: numero.trim() || undefined,

        complemento: complemento.trim() || undefined,

        bairro: bairro.trim() || undefined,

        cidade: cidade.trim() || undefined,

        estado: estado.trim() || undefined,

        observacao: observacao.trim() || undefined,
      });

      if (!atualizado) {
        throw new Error("Cliente não encontrado.");
      }

      setCliente(atualizado);

      setMensagem("Cliente atualizado com sucesso.");

      requestAnimationFrame(() => {
        mensagemRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o cliente.",
      );

      requestAnimationFrame(() => {
        mensagemRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } finally {
      setSalvando(false);
    }
  }

  /* =========================================================
     ALTERAR STATUS
     ========================================================= */

  function alternarStatus() {
    if (!cliente) {
      return;
    }

    setErro("");
    setMensagem("");

    try {
      const novoStatus = cliente.status === "ativo" ? "inativo" : "ativo";

      const atualizado = alterarStatusCliente(cliente.id, novoStatus);

      if (!atualizado) {
        throw new Error("Não foi possível alterar o status.");
      }

      setCliente(atualizado);

      setMensagem(
        novoStatus === "ativo"
          ? "Cliente ativado com sucesso."
          : "Cliente inativado com sucesso.",
      );
    } catch (error) {
      console.error("Erro ao alterar status:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o status.",
      );
    }
  }

  /* =========================================================
     CARREGANDO
     ========================================================= */

  if (carregando) {
    return (
      <AppShell title="Cliente" description="Carregando informações.">
        <section className="admin-page">
          <div className="admin-card">
            <div className="admin-empty">
              <User size={30} />

              <strong>Carregando cliente...</strong>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  /* =========================================================
     NÃO ENCONTRADO
     ========================================================= */

  if (!cliente) {
    return (
      <AppShell
        title="Cliente não encontrado"
        description="Não foi possível localizar este cliente."
      >
        <section className="admin-page clientes-detalhes-page">
          <div className="admin-page-header">
            <div>
              <span className="admin-eyebrow">Gestão comercial</span>

              <h2>Cliente não encontrado</h2>

              <p>O cliente solicitado não existe ou foi removido.</p>
            </div>

            <Link href="/clientes" className="btn">
              <ArrowLeft size={18} />
              Voltar
            </Link>
          </div>

          <div className="admin-card">
            <div className="admin-empty">
              <User size={30} />

              <strong>Nenhum cliente encontrado.</strong>

              <span>Verifique o endereço ou retorne para a lista.</span>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  /* =========================================================
     PÁGINA PRINCIPAL
     ========================================================= */

  return (
    <AppShell
      title={cliente.nomeFantasia || cliente.nome}
      description="Visualize e edite os dados do cliente."
    >
      <section className="admin-page clientes-detalhes-page">
        {/* ===================================================
            CABEÇALHO
        ==================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Cliente #{cliente.codigo}</span>

            <h2>{cliente.nomeFantasia || cliente.nome}</h2>

            <p>
              Gerencie os dados cadastrais, contatos e informações comerciais.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/clientes" className="btn">
              <ArrowLeft size={18} />
              Voltar
            </Link>
          </div>
        </div>

        {/* ===================================================
            MENSAGENS
        ==================================================== */}

        <div ref={mensagemRef}>
          {erro && (
            <div className="clientes-detalhes-error">
              <FileText size={18} />

              <span>{erro}</span>
            </div>
          )}

          {mensagem && (
            <div className="clientes-detalhes-success">
              <CheckCircle2 size={18} />

              <span>{mensagem}</span>
            </div>
          )}
        </div>

        {/* ===================================================
            RESUMO
        ==================================================== */}

        <div className="clientes-detalhes-resumo">
          <article className="admin-card">
            <div className="clientes-detalhes-icon">
              {cliente.tipo === "juridica" ? (
                <Building2 size={20} />
              ) : (
                <User size={20} />
              )}
            </div>

            <div>
              <span>Tipo</span>

              <strong>{obterTipoClienteLabel(cliente.tipo)}</strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="clientes-detalhes-icon clientes-detalhes-icon-status">
              {cliente.status === "ativo" ? (
                <UserCheck size={20} />
              ) : (
                <UserX size={20} />
              )}
            </div>

            <div>
              <span>Status</span>

              <strong
                className={
                  cliente.status === "ativo" ? "text-success" : "text-danger"
                }
              >
                {obterStatusClienteLabel(cliente.status)}
              </strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="clientes-detalhes-icon">
              <FileText size={20} />
            </div>

            <div>
              <span>Código</span>

              <strong>#{cliente.codigo}</strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="clientes-detalhes-icon">
              <FileText size={20} />
            </div>

            <div>
              <span>Documento</span>

              <strong>{cliente.documento || "Não informado"}</strong>
            </div>
          </article>
        </div>

        {/* ===================================================
            RESUMO DE VENDAS
           
            O módulo de vendas ainda será criado.
            Por isso estes indicadores começam zerados.
        ==================================================== */}

        <div className="clientes-vendas-resumo">
          <article className="admin-card">
            <div className="clientes-vendas-icon">
              <FileText size={20} />
            </div>

            <div>
              <span>Total de vendas</span>

              <strong>0</strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="clientes-vendas-icon">
              <FileText size={20} />
            </div>

            <div>
              <span>Total comprado</span>

              <strong>R$ 0,00</strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="clientes-vendas-icon clientes-vendas-icon-success">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>Concluídas</span>

              <strong className="text-success">0</strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="clientes-vendas-icon">
              <FileText size={20} />
            </div>

            <div>
              <span>Pendentes</span>

              <strong className="text-gold">0</strong>
            </div>
          </article>
        </div>

        {/* ===================================================
            HISTÓRICO DE VENDAS
        ==================================================== */}

        <section className="admin-card clientes-vendas-card">
          <div className="admin-card-header">
            <div>
              <span className="admin-eyebrow">Histórico</span>

              <h3>Vendas deste cliente</h3>

              <p>As vendas realizadas para este cliente aparecerão aqui.</p>
            </div>

            <FileText size={24} />
          </div>

          <div className="clientes-vendas-empty">
            <div className="clientes-vendas-empty-icon">
              <FileText size={30} />
            </div>

            <strong>Nenhuma venda registrada</strong>

            <span>
              O histórico será preenchido automaticamente quando o módulo de
              vendas estiver disponível.
            </span>
          </div>
        </section>

        {/* ===================================================
            FORMULÁRIO
        ==================================================== */}

        <form onSubmit={salvarAlteracoes} className="clientes-detalhes-form">
          {/* =================================================
              DADOS PRINCIPAIS
          ================================================== */}

          <article className="admin-card clientes-detalhes-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Cadastro</span>

                <h3>Dados principais</h3>

                <p>Informações de identificação do cliente.</p>
              </div>

              {cliente.tipo === "juridica" ? (
                <Building2 size={24} />
              ) : (
                <User size={24} />
              )}
            </div>

            <div className="clientes-form-grid">
              <label className="form-field">
                <span>Tipo de cliente</span>

                <select
                  value={tipo}
                  onChange={(event) =>
                    setTipo(event.target.value as Cliente["tipo"])
                  }
                >
                  <option value="fisica">Pessoa Física</option>

                  <option value="juridica">Pessoa Jurídica</option>
                </select>
              </label>

              <label className="form-field">
                <span>{tipo === "fisica" ? "CPF" : "CNPJ"}</span>

                <div className="clientes-input-icon">
                  <FileText size={17} />

                  <input
                    type="text"
                    value={documento}
                    onChange={(event) => setDocumento(event.target.value)}
                  />
                </div>
              </label>

              <label className="form-field clientes-field-wide">
                <span>
                  {tipo === "fisica" ? "Nome completo *" : "Razão social *"}
                </span>

                <div className="clientes-input-icon">
                  {tipo === "fisica" ? (
                    <User size={17} />
                  ) : (
                    <Building2 size={17} />
                  )}

                  <input
                    type="text"
                    value={nome}
                    onChange={(event) => setNome(event.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="form-field">
                <span>
                  {tipo === "fisica"
                    ? "Nome social / apelido"
                    : "Nome fantasia"}
                </span>

                <input
                  type="text"
                  value={nomeFantasia}
                  onChange={(event) => setNomeFantasia(event.target.value)}
                />
              </label>
            </div>
          </article>

          {/* =================================================
              CONTATOS
          ================================================== */}

          <article className="admin-card clientes-detalhes-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Comunicação</span>

                <h3>Contatos</h3>

                <p>Telefones e canais de comunicação.</p>
              </div>

              <Phone size={24} />
            </div>

            <div className="clientes-form-grid">
              <label className="form-field clientes-field-wide">
                <span>E-mail</span>

                <div className="clientes-input-icon">
                  <Mail size={17} />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </label>

              <label className="form-field">
                <span>Telefone</span>

                <div className="clientes-input-icon">
                  <Phone size={17} />

                  <input
                    type="tel"
                    value={telefone}
                    onChange={(event) => setTelefone(event.target.value)}
                  />
                </div>
              </label>

              <label className="form-field">
                <span>Celular / WhatsApp</span>

                <div className="clientes-input-icon">
                  <Phone size={17} />

                  <input
                    type="tel"
                    value={celular}
                    onChange={(event) => setCelular(event.target.value)}
                  />
                </div>
              </label>
            </div>
          </article>

          {/* =================================================
              ENDEREÇO
          ================================================== */}

          <article className="admin-card clientes-detalhes-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Localização</span>

                <h3>Endereço</h3>

                <p>Endereço cadastrado do cliente.</p>
              </div>

              <MapPin size={24} />
            </div>

            <div className="clientes-form-grid">
              <label className="form-field clientes-field-small">
                <span>CEP</span>

                <input
                  type="text"
                  value={cep}
                  onChange={(event) => setCep(event.target.value)}
                />
              </label>

              <label className="form-field clientes-field-wide">
                <span>Endereço</span>

                <div className="clientes-input-icon">
                  <MapPin size={17} />

                  <input
                    type="text"
                    value={endereco}
                    onChange={(event) => setEndereco(event.target.value)}
                  />
                </div>
              </label>

              <label className="form-field clientes-field-small">
                <span>Número</span>

                <input
                  type="text"
                  value={numero}
                  onChange={(event) => setNumero(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Complemento</span>

                <input
                  type="text"
                  value={complemento}
                  onChange={(event) => setComplemento(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Bairro</span>

                <input
                  type="text"
                  value={bairro}
                  onChange={(event) => setBairro(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Cidade</span>

                <input
                  type="text"
                  value={cidade}
                  onChange={(event) => setCidade(event.target.value)}
                />
              </label>

              <label className="form-field clientes-field-small">
                <span>Estado</span>

                <select
                  value={estado}
                  onChange={(event) => setEstado(event.target.value)}
                >
                  <option value="">UF</option>

                  {[
                    "AC",
                    "AL",
                    "AP",
                    "AM",
                    "BA",
                    "CE",
                    "DF",
                    "ES",
                    "GO",
                    "MA",
                    "MT",
                    "MS",
                    "MG",
                    "PA",
                    "PB",
                    "PR",
                    "PE",
                    "PI",
                    "RJ",
                    "RN",
                    "RS",
                    "RO",
                    "RR",
                    "SC",
                    "SP",
                    "SE",
                    "TO",
                  ].map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </article>

          {/* =================================================
              OBSERVAÇÕES
          ================================================== */}

          <article className="admin-card clientes-detalhes-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Informações adicionais</span>

                <h3>Observações</h3>
              </div>

              <FileText size={24} />
            </div>

            <label className="form-field">
              <span>Observação</span>

              <textarea
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                rows={5}
              />
            </label>
          </article>

          {/* =================================================
              AÇÕES
          ================================================== */}

          <div className="clientes-detalhes-actions">
            <button
              type="button"
              className={
                cliente.status === "ativo"
                  ? "btn clientes-status-btn danger"
                  : "btn clientes-status-btn success"
              }
              onClick={alternarStatus}
            >
              {cliente.status === "ativo" ? (
                <>
                  <UserX size={17} />
                  Inativar cliente
                </>
              ) : (
                <>
                  <UserCheck size={17} />
                  Ativar cliente
                </>
              )}
            </button>

            <div>
              <Link href="/clientes" className="btn">
                Cancelar
              </Link>

              <button type="submit" className="btn primary" disabled={salvando}>
                <Save size={17} />

                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
