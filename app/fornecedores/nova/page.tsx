"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  FileText,
  Mail,
  MapPin,
  Phone,
  Save,
} from "lucide-react";

import { AppShell } from "../../../components/layout/AppShell";
import {
  criarFornecedor,
  fornecedorDocumentoJaCadastrado,
  formatarDocumento,
  normalizarDocumento,
  validarDocumentoFornecedor,
} from "../../../data/fornecedoresStore";

export default function NovoFornecedorPage() {
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

  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");

  function alterarDocumento(valor: string) {
    const somenteNumeros = normalizarDocumento(valor).slice(0, 14);
    setDocumento(formatarDocumento(somenteNumeros));
    if (erro) setErro("");
  }

  function salvarFornecedor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");

    if (!razaoSocial.trim()) {
      setErro("Informe a razão social do fornecedor.");
      return;
    }

    const documentoNormalizado = normalizarDocumento(documento);
    const erroDocumento = validarDocumentoFornecedor(documentoNormalizado);

    if (erroDocumento) {
      setErro(erroDocumento);
      return;
    }

    if (
      documentoNormalizado &&
      fornecedorDocumentoJaCadastrado(documentoNormalizado)
    ) {
      setErro("Já existe um fornecedor cadastrado com este CPF/CNPJ.");
      return;
    }

    setSalvando(true);

    try {
      criarFornecedor({
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

        status: "ativo",
      });

      window.location.href = "/fornecedores";
    } catch (error) {
      console.error("Erro ao criar fornecedor:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o fornecedor. Tente novamente.",
      );

      setSalvando(false);
    }
  }

  return (
    <AppShell
      title="Novo fornecedor"
      description="Cadastre um novo fornecedor no sistema."
    >
      <section className="admin-page fornecedores-novo-page">
        {/* =====================================================
            CABEÇALHO
        ====================================================== */}

        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Gestão comercial</span>

            <h2>Novo fornecedor</h2>

            <p>
              Cadastre os dados comerciais, contatos e endereço do fornecedor.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/fornecedores" className="btn">
              <ArrowLeft size={18} />
              Voltar para fornecedores
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

        <form onSubmit={salvarFornecedor} className="fornecedores-novo-form">
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
                    placeholder="Ex.: Agro Comércio Ltda."
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
                  placeholder="Nome comercial"
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

                <p>Telefones e e-mail para contato com o fornecedor.</p>
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
                    placeholder="contato@empresa.com.br"
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
                    placeholder="(65) 0000-0000"
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
                    placeholder="(65) 90000-0000"
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
                  placeholder="78000-000"
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
                    placeholder="Rua, avenida, rodovia..."
                  />
                </div>
              </label>

              <label className="form-field fornecedores-field-small">
                <span>Número</span>

                <input
                  type="text"
                  value={numero}
                  onChange={(event) => setNumero(event.target.value)}
                  placeholder="123"
                />
              </label>

              <label className="form-field">
                <span>Complemento</span>

                <input
                  type="text"
                  value={complemento}
                  onChange={(event) => setComplemento(event.target.value)}
                  placeholder="Sala, galpão..."
                />
              </label>

              <label className="form-field">
                <span>Bairro</span>

                <input
                  type="text"
                  value={bairro}
                  onChange={(event) => setBairro(event.target.value)}
                  placeholder="Bairro"
                />
              </label>

              <label className="form-field">
                <span>Cidade</span>

                <input
                  type="text"
                  value={cidade}
                  onChange={(event) => setCidade(event.target.value)}
                  placeholder="Cidade"
                />
              </label>

              <label className="form-field fornecedores-field-small">
                <span>Estado</span>

                <select
                  value={estado}
                  onChange={(event) => setEstado(event.target.value)}
                >
                  <option value="">UF</option>

                  <option value="AC">AC</option>

                  <option value="AL">AL</option>

                  <option value="AP">AP</option>

                  <option value="AM">AM</option>

                  <option value="BA">BA</option>

                  <option value="CE">CE</option>

                  <option value="DF">DF</option>

                  <option value="ES">ES</option>

                  <option value="GO">GO</option>

                  <option value="MA">MA</option>

                  <option value="MT">MT</option>

                  <option value="MS">MS</option>

                  <option value="MG">MG</option>

                  <option value="PA">PA</option>

                  <option value="PB">PB</option>

                  <option value="PR">PR</option>

                  <option value="PE">PE</option>

                  <option value="PI">PI</option>

                  <option value="RJ">RJ</option>

                  <option value="RN">RN</option>

                  <option value="RS">RS</option>

                  <option value="RO">RO</option>

                  <option value="RR">RR</option>

                  <option value="SC">SC</option>

                  <option value="SP">SP</option>

                  <option value="SE">SE</option>

                  <option value="TO">TO</option>
                </select>
              </label>
            </div>
          </article>

          {/* ===================================================
              OBSERVAÇÃO
          ==================================================== */}

          <article className="admin-card fornecedores-form-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Informações adicionais</span>

                <h3>Observações</h3>

                <p>Registre informações úteis sobre este fornecedor.</p>
              </div>

              <FileText size={24} />
            </div>

            <label className="form-field">
              <span>Observação</span>

              <textarea
                value={observacao}
                onChange={(event) => setObservacao(event.target.value)}
                placeholder="Ex.: condições de pagamento, contato comercial, informações de entrega..."
                rows={5}
              />
            </label>
          </article>

          {/* ===================================================
              AÇÕES
          ==================================================== */}

          <div className="fornecedores-form-actions">
            <Link href="/fornecedores" className="btn">
              Cancelar
            </Link>

            <button type="submit" className="btn primary" disabled={salvando}>
              {salvando ? (
                <>Salvando...</>
              ) : (
                <>
                  <Save size={18} />
                  Salvar fornecedor
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </AppShell>
  );
}
