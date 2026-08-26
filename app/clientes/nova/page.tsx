"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  FileText,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";

import {
  criarCliente,
  documentoClienteJaCadastrado,
  formatarDocumento,
  normalizarDocumento,
  validarDadosCliente,
  type TipoCliente,
} from "../../../data/clientesStore";

export default function NovoClientePage() {
  const router = useRouter();

  const [tipo, setTipo] = useState<TipoCliente>("fisica");

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

  const [erro, setErro] = useState("");

  const [salvando, setSalvando] = useState(false);

  /* =========================================================
     TROCAR TIPO DE CLIENTE
     ========================================================= */

  function alterarTipoCliente(novoTipo: TipoCliente) {
    setTipo(novoTipo);

    /*
     * Limpamos o documento ao trocar
     * entre CPF e CNPJ para impedir
     * que um documento de um tipo
     * seja reaproveitado no outro.
     */
    setDocumento("");

    setErro("");
  }

  /* =========================================================
     DOCUMENTO — CPF / CNPJ
     ========================================================= */

  function alterarDocumento(valor: string) {
    /*
     * Remove tudo que não for número.
     */
    const somenteNumeros = normalizarDocumento(valor);

    /*
     * CPF = 11 dígitos
     * CNPJ = 14 dígitos
     */
    const limite = tipo === "fisica" ? 11 : 14;

    const limitado = somenteNumeros.slice(0, limite);

    /*
     * Aplica a máscara correspondente
     * ao tipo de cliente.
     */
    setDocumento(formatarDocumento(limitado, tipo));

    /*
     * Limpa a mensagem anterior
     * enquanto o usuário corrige o campo.
     */
    if (erro) {
      setErro("");
    }
  }

  /* =========================================================
     SALVAR CLIENTE
     ========================================================= */

  function salvarCliente(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

    const documentoNormalizado = normalizarDocumento(documento);

    const dados = {
      tipo,

      nome: nome.trim(),

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

      status: "ativo" as const,
    };

    /* =====================================================
       VALIDAÇÃO PRINCIPAL
       ===================================================== */

    const erroValidacao = validarDadosCliente(dados);

    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    /* =====================================================
       DOCUMENTO DUPLICADO
       ===================================================== */

    if (dados.documento && documentoClienteJaCadastrado(dados.documento)) {
      setErro("Já existe um cliente cadastrado com este CPF/CNPJ.");

      return;
    }

    /* =====================================================
       SALVAMENTO
       ===================================================== */

    setSalvando(true);

    try {
      const cliente = criarCliente(dados);

      router.push(`/clientes/${cliente.id}`);
    } catch (error) {
      console.error("Erro ao criar cliente:", error);

      /*
       * Mostra o erro real vindo
       * do clientesStore.ts.
       */
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro("Não foi possível cadastrar o cliente.");
      }

      setSalvando(false);
    }
  }

  return (
    <AppShell title="Novo cliente" description="Cadastre um novo cliente.">
      <section className="admin-page clientes-novo-page">
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Gestão comercial</span>

            <h2>Novo cliente</h2>

            <p>Cadastre os dados comerciais, contatos e endereço do cliente.</p>
          </div>

          <div className="admin-page-actions">
            <Link href="/clientes" className="btn">
              <ArrowLeft size={18} />
              Voltar
            </Link>
          </div>
        </div>

        {/* =====================================================
            ERRO
        ====================================================== */}

        {erro && (
          <div className="compras-form-error">
            <FileText size={18} />

            <span>{erro}</span>
          </div>
        )}

        {/* =====================================================
            FORMULÁRIO
        ====================================================== */}

        <form onSubmit={salvarCliente} className="clientes-novo-form">
          {/* ===================================================
              TIPO DE CLIENTE
          ==================================================== */}

          <article className="admin-card clientes-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Classificação</span>

                <h3>Tipo de cliente</h3>

                <p>Selecione se o cadastro é de pessoa física ou jurídica.</p>
              </div>

              <User size={24} />
            </div>

            <div className="clientes-tipo-grid">
              {/* PESSOA FÍSICA */}

              <button
                type="button"
                className={
                  tipo === "fisica"
                    ? "cliente-tipo-option ativo"
                    : "cliente-tipo-option"
                }
                onClick={() => alterarTipoCliente("fisica")}
              >
                <div className="cliente-tipo-icon">
                  <User size={21} />
                </div>

                <div>
                  <strong>Pessoa Física</strong>

                  <span>Cliente individual</span>
                </div>

                <div className="cliente-tipo-radio">
                  <span />
                </div>
              </button>

              {/* PESSOA JURÍDICA */}

              <button
                type="button"
                className={
                  tipo === "juridica"
                    ? "cliente-tipo-option ativo"
                    : "cliente-tipo-option"
                }
                onClick={() => alterarTipoCliente("juridica")}
              >
                <div className="cliente-tipo-icon">
                  <Building2 size={21} />
                </div>

                <div>
                  <strong>Pessoa Jurídica</strong>

                  <span>Empresa ou organização</span>
                </div>

                <div className="cliente-tipo-radio">
                  <span />
                </div>
              </button>
            </div>
          </article>

          {/* ===================================================
              DADOS PRINCIPAIS
          ==================================================== */}

          <article className="admin-card clientes-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Cadastro</span>

                <h3>Dados principais</h3>

                <p>Informe os dados de identificação do cliente.</p>
              </div>

              <FileText size={24} />
            </div>

            <div className="clientes-form-grid">
              {/* NOME / RAZÃO SOCIAL */}

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
                    placeholder={
                      tipo === "fisica" ? "Nome completo" : "Razão social"
                    }
                    required
                  />
                </div>
              </label>

              {/* NOME FANTASIA / SOCIAL */}

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
                  placeholder={
                    tipo === "fisica" ? "Opcional" : "Nome comercial"
                  }
                />
              </label>

              {/* CPF / CNPJ */}

              <label className="form-field">
                <span>{tipo === "fisica" ? "CPF" : "CNPJ"}</span>

                <div className="clientes-input-icon">
                  <FileText size={17} />

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={documento}
                    onChange={(event) => alterarDocumento(event.target.value)}
                    placeholder={
                      tipo === "fisica"
                        ? "000.000.000-00"
                        : "00.000.000/0000-00"
                    }
                    maxLength={tipo === "fisica" ? 14 : 18}
                  />
                </div>

                <small
                  style={{
                    marginTop: "5px",
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "10px",
                  }}
                >
                  {tipo === "fisica"
                    ? "Digite os 11 números do CPF."
                    : "Digite os 14 números do CNPJ."}
                </small>
              </label>
            </div>
          </article>

          {/* ===================================================
              CONTATOS
          ==================================================== */}

          <article className="admin-card clientes-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Comunicação</span>

                <h3>Contatos</h3>

                <p>Informe os canais de contato do cliente.</p>
              </div>

              <Phone size={24} />
            </div>

            <div className="clientes-form-grid">
              {/* E-MAIL */}

              <label className="form-field clientes-field-wide">
                <span>E-mail</span>

                <div className="clientes-input-icon">
                  <Mail size={17} />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="cliente@email.com"
                  />
                </div>
              </label>

              {/* TELEFONE */}

              <label className="form-field">
                <span>Telefone</span>

                <div className="clientes-input-icon">
                  <Phone size={17} />

                  <input
                    type="tel"
                    value={telefone}
                    onChange={(event) => setTelefone(event.target.value)}
                    placeholder="(00) 0000-0000"
                  />
                </div>
              </label>

              {/* CELULAR */}

              <label className="form-field">
                <span>Celular / WhatsApp</span>

                <div className="clientes-input-icon">
                  <Phone size={17} />

                  <input
                    type="tel"
                    value={celular}
                    onChange={(event) => setCelular(event.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </label>
            </div>
          </article>

          {/* ===================================================
              ENDEREÇO
          ==================================================== */}

          <article className="admin-card clientes-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Localização</span>

                <h3>Endereço</h3>

                <p>Informe o endereço do cliente.</p>
              </div>

              <MapPin size={24} />
            </div>

            <div className="clientes-form-grid">
              {/* CEP */}

              <label className="form-field clientes-field-small">
                <span>CEP</span>

                <input
                  type="text"
                  value={cep}
                  onChange={(event) => setCep(event.target.value)}
                  placeholder="00000-000"
                />
              </label>

              {/* ENDEREÇO */}

              <label className="form-field clientes-field-wide">
                <span>Endereço</span>

                <div className="clientes-input-icon">
                  <MapPin size={17} />

                  <input
                    type="text"
                    value={endereco}
                    onChange={(event) => setEndereco(event.target.value)}
                    placeholder="Rua, avenida, rodovia..."
                  />
                </div>
              </label>

              {/* NÚMERO */}

              <label className="form-field clientes-field-small">
                <span>Número</span>

                <input
                  type="text"
                  value={numero}
                  onChange={(event) => setNumero(event.target.value)}
                  placeholder="Número"
                />
              </label>

              {/* COMPLEMENTO */}

              <label className="form-field">
                <span>Complemento</span>

                <input
                  type="text"
                  value={complemento}
                  onChange={(event) => setComplemento(event.target.value)}
                  placeholder="Sala, lote, bloco..."
                />
              </label>

              {/* BAIRRO */}

              <label className="form-field">
                <span>Bairro</span>

                <input
                  type="text"
                  value={bairro}
                  onChange={(event) => setBairro(event.target.value)}
                />
              </label>

              {/* CIDADE */}

              <label className="form-field">
                <span>Cidade</span>

                <input
                  type="text"
                  value={cidade}
                  onChange={(event) => setCidade(event.target.value)}
                />
              </label>

              {/* ESTADO */}

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

          {/* ===================================================
              OBSERVAÇÕES
          ==================================================== */}

          <article className="admin-card clientes-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Informações adicionais</span>

                <h3>Observações</h3>

                <p>Adicione informações importantes sobre o cliente.</p>
              </div>

              <FileText size={24} />
            </div>

            <label className="form-field">
              <span>Observação</span>

              <textarea
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                rows={5}
                placeholder="Observações comerciais, preferências, informações adicionais..."
              />
            </label>
          </article>

          {/* ===================================================
              AÇÕES
          ==================================================== */}

          <div className="clientes-novo-actions">
            <Link href="/clientes" className="btn">
              Cancelar
            </Link>

            <button type="submit" className="btn primary" disabled={salvando}>
              <Save size={17} />

              {salvando ? "Salvando..." : "Salvar cliente"}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
