"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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
  UserCheck,
  UserX,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";

import {
  alterarStatusFornecedor,
  fornecedorDocumentoJaCadastrado,
  formatarDocumento,
  normalizarDocumento,
  validarDocumentoFornecedor,
  obterFornecedorPorId,
  obterStatusFornecedorLabel,
  atualizarFornecedor,
  type Fornecedor,
} from "../../../data/fornecedoresStore";

import {
  obterCompras,
  obterStatusCompraLabel,
  type Compra,
} from "../../../data/comprasStore";

export default function FornecedorDetalhesPage() {
  const params = useParams();

  const id = typeof params.id === "string" ? decodeURIComponent(params.id) : "";

  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);

  const [carregando, setCarregando] = useState(true);

  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");

  const [mensagem, setMensagem] = useState("");

  const [comprasFornecedor, setComprasFornecedor] = useState<Compra[]>([]);

  const [razaoSocial, setRazaoSocial] = useState("");

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

  function alterarDocumento(valor: string) {
    const somenteNumeros = normalizarDocumento(valor).slice(0, 14);
    setDocumento(formatarDocumento(somenteNumeros));
    if (erro) setErro("");
  }

  /*
   * =====================================================
   * CARREGAMENTO
   * =====================================================
   */

  useEffect(() => {
    if (!id) {
      setCarregando(false);
      return;
    }

    const encontrado = obterFornecedorPorId(id);

    const compras = obterCompras();

    setComprasFornecedor(
      compras.filter((compra) => compra.fornecedorId === id),
    );

    if (!encontrado) {
      setFornecedor(null);
      setCarregando(false);
      return;
    }

    setFornecedor(encontrado);

    setRazaoSocial(encontrado.razaoSocial);

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

  /*
   * =====================================================
   * RESUMO DAS COMPRAS
   *
   * IMPORTANTE:
   * Estes cálculos precisam ficar FORA do if
   * de carregamento, pois são utilizados pelo JSX
   * principal da página.
   * =====================================================
   */

  const totalComprasFornecedor = comprasFornecedor.length;

  const valorTotalComprado = comprasFornecedor
    .filter((compra) => compra.status !== "cancelada")
    .reduce((total, compra) => total + compra.total, 0);

  const comprasPendentes = comprasFornecedor.filter(
    (compra) => compra.status === "pendente" || compra.status === "parcial",
  ).length;

  const comprasRecebidas = comprasFornecedor.filter(
    (compra) => compra.status === "recebida",
  ).length;

  const comprasCanceladas = comprasFornecedor.filter(
    (compra) => compra.status === "cancelada",
  ).length;

  /*
   * =====================================================
   * SALVAR ALTERAÇÕES
   * =====================================================
   */

  function salvarAlteracoes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (!razaoSocial.trim()) {
      setErro("Informe a razão social do fornecedor.");

      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      return;
    }

    const documentoNormalizado = normalizarDocumento(documento);
    const erroDocumento = validarDocumentoFornecedor(documentoNormalizado);

    if (erroDocumento) {
      setErro(erroDocumento);
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      return;
    }

    if (
      documentoNormalizado &&
      fornecedorDocumentoJaCadastrado(documentoNormalizado, id)
    ) {
      setErro("Já existe outro fornecedor cadastrado com este CPF/CNPJ.");
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      return;
    }

    setSalvando(true);

    try {
      const atualizado = atualizarFornecedor(id, {
        razaoSocial: razaoSocial.trim(),

        nomeFantasia: nomeFantasia.trim() || undefined,

        documento: documentoNormalizado || undefined,

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
        throw new Error("Fornecedor não encontrado.");
      }

      setFornecedor(atualizado);

      setMensagem("Fornecedor atualizado com sucesso.");

      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    } catch (error) {
      console.error("Erro ao atualizar fornecedor:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o fornecedor.",
      );

      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    } finally {
      setSalvando(false);
    }
  }

  /*
   * =====================================================
   * ALTERAR STATUS
   * =====================================================
   */

  function alternarStatus() {
    if (!fornecedor) {
      return;
    }

    setErro("");
    setMensagem("");

    try {
      const novoStatus = fornecedor.status === "ativo" ? "inativo" : "ativo";

      const atualizado = alterarStatusFornecedor(fornecedor.id, novoStatus);

      if (!atualizado) {
        throw new Error("Não foi possível alterar o status.");
      }

      setFornecedor(atualizado);

      setMensagem(
        novoStatus === "ativo"
          ? "Fornecedor ativado com sucesso."
          : "Fornecedor inativado com sucesso.",
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

  /*
   * =====================================================
   * CARREGANDO
   * =====================================================
   */

  if (carregando) {
    return (
      <AppShell title="Fornecedor" description="Carregando informações.">
        <section className="admin-page">
          <div className="admin-card">
            <div className="admin-empty">
              <Building2 size={30} />

              <strong>Carregando fornecedor...</strong>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  /*
   * =====================================================
   * NÃO ENCONTRADO
   * =====================================================
   */

  if (!fornecedor) {
    return (
      <AppShell
        title="Fornecedor não encontrado"
        description="Não foi possível localizar este fornecedor."
      >
        <section className="admin-page fornecedores-detalhes-page">
          <div className="admin-page-header">
            <div>
              <span className="admin-eyebrow">Gestão comercial</span>

              <h2>Fornecedor não encontrado</h2>

              <p>O fornecedor solicitado não existe ou foi removido.</p>
            </div>

            <Link href="/fornecedores" className="btn">
              <ArrowLeft size={18} />
              Voltar
            </Link>
          </div>

          <div className="admin-card">
            <div className="admin-empty">
              <Building2 size={30} />

              <strong>Nenhum fornecedor encontrado.</strong>

              <span>Verifique o endereço ou retorne para a lista.</span>
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  /*
   * =====================================================
   * PÁGINA PRINCIPAL
   * =====================================================
   */

  return (
    <AppShell
      title={fornecedor.nomeFantasia || fornecedor.razaoSocial}
      description="Visualize e edite os dados do fornecedor."
    >
      <section className="admin-page fornecedores-detalhes-page">
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">
              Fornecedor #{fornecedor.codigo}
            </span>

            <h2>{fornecedor.nomeFantasia || fornecedor.razaoSocial}</h2>

            <p>
              Gerencie os dados cadastrais, contatos e status do fornecedor.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/fornecedores" className="btn">
              <ArrowLeft size={18} />
              Voltar
            </Link>
          </div>
        </div>

        {/* =====================================================
            MENSAGENS
        ====================================================== */}

        {erro && (
          <div className="compras-form-error">
            <FileText size={18} />

            <span>{erro}</span>
          </div>
        )}

        {mensagem && (
          <div className="fornecedores-detalhes-success">
            <CheckCircle2 size={18} />

            <span>{mensagem}</span>
          </div>
        )}

        {/* =====================================================
            RESUMO DO FORNECEDOR
        ====================================================== */}

        <div className="fornecedores-detalhes-resumo">
          <article className="admin-card">
            <div className="fornecedores-detalhes-icon">
              <Building2 size={20} />
            </div>

            <div>
              <span>Código</span>

              <strong>#{fornecedor.codigo}</strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="fornecedores-detalhes-icon">
              {fornecedor.status === "ativo" ? (
                <UserCheck size={20} />
              ) : (
                <UserX size={20} />
              )}
            </div>

            <div>
              <span>Status</span>

              <strong
                className={
                  fornecedor.status === "ativo" ? "text-success" : "text-muted"
                }
              >
                {obterStatusFornecedorLabel(fornecedor.status)}
              </strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="fornecedores-detalhes-icon">
              <FileText size={20} />
            </div>

            <div>
              <span>Documento</span>

              <strong>{fornecedor.documento || "Não informado"}</strong>
            </div>
          </article>
        </div>

        {/* =====================================================
            RESUMO DAS COMPRAS
        ====================================================== */}

        <div className="fornecedores-compras-resumo">
          <article className="admin-card">
            <div className="fornecedores-compras-resumo-icon">
              <FileText size={20} />
            </div>

            <div>
              <span>Total de compras</span>

              <strong>{totalComprasFornecedor}</strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="fornecedores-compras-resumo-icon">
              <FileText size={20} />
            </div>

            <div>
              <span>Valor comprado</span>

              <strong>
                {valorTotalComprado.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              </strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="fornecedores-compras-resumo-icon">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <span>Recebidas</span>

              <strong className="text-success">{comprasRecebidas}</strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="fornecedores-compras-resumo-icon">
              <FileText size={20} />
            </div>

            <div>
              <span>Pendentes</span>

              <strong className="text-gold">{comprasPendentes}</strong>
            </div>
          </article>

          <article className="admin-card">
            <div className="fornecedores-compras-resumo-icon fornecedores-compras-canceladas-icon">
              <UserX size={20} />
            </div>

            <div>
              <span>Canceladas</span>

              <strong className="text-danger">{comprasCanceladas}</strong>
            </div>
          </article>
        </div>

        {/* =====================================================
            HISTÓRICO DE COMPRAS
        ====================================================== */}

        <section className="admin-card fornecedores-compras-card">
          <div className="admin-card-header">
            <div>
              <span className="admin-eyebrow">Histórico</span>

              <h3>Compras deste fornecedor</h3>

              <p>Consulte os pedidos realizados para este fornecedor.</p>
            </div>

            <FileText size={24} />
          </div>

          {comprasFornecedor.length === 0 ? (
            <div className="admin-empty fornecedores-compras-empty">
              <FileText size={30} />

              <strong>Nenhuma compra registrada</strong>

              <span>
                Ainda não existem compras vinculadas a este fornecedor.
              </span>
            </div>
          ) : (
            <div className="fornecedores-compras-lista">
              {comprasFornecedor.map((compra) => (
                <Link
                  key={compra.id}
                  href={`/compras/${compra.id}`}
                  className="fornecedor-compra-item"
                >
                  <div className="fornecedor-compra-principal">
                    <strong>{compra.numero}</strong>

                    <span>
                      {new Date(
                        `${compra.dataCompra}T00:00:00`,
                      ).toLocaleDateString("pt-BR")}
                    </span>
                  </div>

                  <div className="fornecedor-compra-itens">
                    <span>
                      {compra.itens.length}{" "}
                      {compra.itens.length === 1 ? "produto" : "produtos"}
                    </span>
                  </div>

                  <div className="fornecedor-compra-total">
                    <strong>
                      {compra.total.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </strong>
                  </div>

                  <div
                    className={`fornecedor-compra-status status-${compra.status}`}
                  >
                    {obterStatusCompraLabel(compra.status)}
                  </div>

                  <div className="fornecedor-compra-arrow">→</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            FORMULÁRIO
        ====================================================== */}

        <form
          onSubmit={salvarAlteracoes}
          className="fornecedores-detalhes-form"
        >
          {/* ===================================================
              DADOS COMERCIAIS
          ==================================================== */}

          <article className="admin-card fornecedores-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Cadastro</span>

                <h3>Dados comerciais</h3>

                <p>Informações principais do fornecedor.</p>
              </div>

              <Building2 size={24} />
            </div>

            <div className="fornecedores-form-grid">
              <label className="form-field fornecedores-field-wide">
                <span>Razão social *</span>

                <div className="fornecedores-input-icon">
                  <Building2 size={17} />

                  <input
                    type="text"
                    value={razaoSocial}
                    onChange={(event) => setRazaoSocial(event.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="form-field">
                <span>Nome fantasia</span>

                <input
                  type="text"
                  value={nomeFantasia}
                  onChange={(event) => setNomeFantasia(event.target.value)}
                />
              </label>

              <label className="form-field">
                <span>CNPJ / CPF</span>

                <div className="fornecedores-input-icon">
                  <FileText size={17} />

                  <input
                    type="text"
                    value={documento}
                    onChange={(event) => alterarDocumento(event.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={18}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </label>
            </div>
          </article>

          {/* ===================================================
              CONTATOS
          ==================================================== */}

          <article className="admin-card fornecedores-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Comunicação</span>

                <h3>Contatos</h3>

                <p>Telefones e e-mail do fornecedor.</p>
              </div>

              <Phone size={24} />
            </div>

            <div className="fornecedores-form-grid">
              <label className="form-field">
                <span>E-mail</span>

                <div className="fornecedores-input-icon">
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

                <div className="fornecedores-input-icon">
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

                <div className="fornecedores-input-icon">
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

          {/* ===================================================
              ENDEREÇO
          ==================================================== */}

          <article className="admin-card fornecedores-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Localização</span>

                <h3>Endereço</h3>

                <p>Endereço comercial do fornecedor.</p>
              </div>

              <MapPin size={24} />
            </div>

            <div className="fornecedores-form-grid">
              <label className="form-field fornecedores-field-small">
                <span>CEP</span>

                <input
                  type="text"
                  value={cep}
                  onChange={(event) => setCep(event.target.value)}
                />
              </label>

              <label className="form-field fornecedores-field-wide">
                <span>Endereço</span>

                <div className="fornecedores-input-icon">
                  <MapPin size={17} />

                  <input
                    type="text"
                    value={endereco}
                    onChange={(event) => setEndereco(event.target.value)}
                  />
                </div>
              </label>

              <label className="form-field fornecedores-field-small">
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

              <label className="form-field fornecedores-field-small">
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

          {/* ===================================================
              OBSERVAÇÕES
          ==================================================== */}

          <article className="admin-card fornecedores-form-card">
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

          {/* ===================================================
              AÇÕES
          ==================================================== */}

          <div className="fornecedores-detalhes-actions">
            <button
              type="button"
              className={
                fornecedor.status === "ativo"
                  ? "btn fornecedores-status-btn danger"
                  : "btn fornecedores-status-btn success"
              }
              onClick={alternarStatus}
            >
              {fornecedor.status === "ativo" ? (
                <>
                  <UserX size={17} />
                  Inativar fornecedor
                </>
              ) : (
                <>
                  <UserCheck size={17} />
                  Ativar fornecedor
                </>
              )}
            </button>

            <div>
              <Link href="/fornecedores" className="btn">
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
