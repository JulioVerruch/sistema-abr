"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  CircleDollarSign,
  Factory,
  FileText,
  Package,
  RotateCcw,
  Save,
  Settings,
  ShoppingCart,
  Store,
} from "lucide-react";

import { AppShell } from "../../components/layout/AppShell";
import {
  configuracoesPadrao,
  EVENTO_ATUALIZADO,
  obterConfiguracoes,
  restaurarConfiguracoesPadrao,
  salvarConfiguracoes,
  type ConfiguracoesSistema,
} from "../../data/configuracoesStore";

type AbaConfiguracao = "empresa" | "comercial" | "financeira" | "estoque";

const abas: Array<{
  id: AbaConfiguracao;
  titulo: string;
  descricao: string;
  icone: typeof Building2;
}> = [
  {
    id: "empresa",
    titulo: "Empresa",
    descricao: "Dados e endereço",
    icone: Building2,
  },
  {
    id: "comercial",
    titulo: "Comercial",
    descricao: "Vendas e compras",
    icone: ShoppingCart,
  },
  {
    id: "financeira",
    titulo: "Financeiro",
    descricao: "Prazos e cobrança",
    icone: CircleDollarSign,
  },
  {
    id: "estoque",
    titulo: "Estoque",
    descricao: "Regras operacionais",
    icone: Package,
  },
];

function numero(valor: string) {
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function ConfiguracoesPage() {
  const [aba, setAba] = useState<AbaConfiguracao>("empresa");
  const [dados, setDados] = useState<ConfiguracoesSistema>(configuracoesPadrao);
  const [salvoEm, setSalvoEm] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const config = obterConfiguracoes();
    setDados(config);
    setSalvoEm(config.atualizadoEm);

    const atualizar = () => {
      const atual = obterConfiguracoes();
      setDados(atual);
      setSalvoEm(atual.atualizadoEm);
    };

    window.addEventListener(EVENTO_ATUALIZADO, atualizar);

    return () => window.removeEventListener(EVENTO_ATUALIZADO, atualizar);
  }, []);

  const alterado = useMemo(
    () => JSON.stringify(dados) !== JSON.stringify(obterConfiguracoes()),
    [dados],
  );

  function salvar() {
    setSalvando(true);
    setMensagem("");

    const resultado = salvarConfiguracoes(dados);

    setDados(resultado);
    setSalvoEm(resultado.atualizadoEm);
    setMensagem("Configurações salvas com sucesso.");

    window.setTimeout(() => {
      setMensagem("");
      setSalvando(false);
    }, 2200);
  }

  function restaurar() {
    const confirmou = window.confirm(
      "Restaurar todas as configurações para os valores padrão?",
    );

    if (!confirmou) return;

    const resultado = restaurarConfiguracoesPadrao();

    setDados(resultado);
    setSalvoEm(resultado.atualizadoEm);
    setMensagem("Configurações padrão restauradas.");
  }

  function setEmpresa(
    campo: keyof ConfiguracoesSistema["empresa"],
    valor: string,
  ) {
    setDados((atual) => ({
      ...atual,
      empresa: {
        ...atual.empresa,
        [campo]: valor,
      },
    }));
  }

  function setComercial<K extends keyof ConfiguracoesSistema["comercial"]>(
    campo: K,
    valor: ConfiguracoesSistema["comercial"][K],
  ) {
    setDados((atual) => ({
      ...atual,
      comercial: {
        ...atual.comercial,
        [campo]: valor,
      },
    }));
  }

  function setFinanceira<K extends keyof ConfiguracoesSistema["financeira"]>(
    campo: K,
    valor: ConfiguracoesSistema["financeira"][K],
  ) {
    setDados((atual) => ({
      ...atual,
      financeira: {
        ...atual.financeira,
        [campo]: valor,
      },
    }));
  }

  function setEstoque<K extends keyof ConfiguracoesSistema["estoque"]>(
    campo: K,
    valor: ConfiguracoesSistema["estoque"][K],
  ) {
    setDados((atual) => ({
      ...atual,
      estoque: {
        ...atual.estoque,
        [campo]: valor,
      },
    }));
  }

  function alternarFormaPagamento(forma: string) {
    const atual = dados.comercial.formasPagamento;

    setComercial(
      "formasPagamento",
      atual.includes(forma)
        ? atual.filter((item) => item !== forma)
        : [...atual, forma],
    );
  }

  return (
    <AppShell
      title="Configurações"
      description="Configure a empresa e as regras operacionais do Sistema ABR."
    >
      <main className="admin-page configuracoes-page">
        <header className="configuracoes-header">
          <div>
            <span className="admin-eyebrow">SISTEMA</span>
            <h1>Configurações</h1>
            <p>
              Centralize as regras que serão usadas pelos módulos comerciais,
              financeiros e de estoque.
            </p>
          </div>

          <div className="configuracoes-actions">
            <button type="button" className="btn" onClick={restaurar}>
              <RotateCcw size={16} />
              Restaurar padrão
            </button>

            <button
              type="button"
              className="btn primary"
              onClick={salvar}
              disabled={salvando}
            >
              <Save size={16} />
              {salvando ? "Salvando..." : "Salvar configurações"}
            </button>
          </div>
        </header>

        {mensagem && (
          <div className="configuracoes-feedback">
            <Check size={17} />
            {mensagem}
          </div>
        )}

        <div className="configuracoes-layout">
          <aside className="configuracoes-menu">
            {abas.map((item) => {
              const Icone = item.icone;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={
                    aba === item.id
                      ? "configuracao-menu-item is-active"
                      : "configuracao-menu-item"
                  }
                  onClick={() => setAba(item.id)}
                >
                  <span className="configuracao-menu-icon">
                    <Icone size={17} />
                  </span>

                  <span>
                    <strong>{item.titulo}</strong>
                    <small>{item.descricao}</small>
                  </span>
                </button>
              );
            })}
          </aside>

          <section className="configuracoes-conteudo">
            {aba === "empresa" && (
              <>
                <div className="configuracao-secao-header">
                  <div>
                    <span>CADASTRO PRINCIPAL</span>
                    <h2>Dados da empresa</h2>
                    <p>Informações usadas na identificação do negócio.</p>
                  </div>
                  <Building2 size={21} />
                </div>

                <div className="configuracao-grid">
                  <label className="configuracao-field col-2">
                    <span>Razão social</span>
                    <input
                      value={dados.empresa.razaoSocial}
                      onChange={(e) =>
                        setEmpresa("razaoSocial", e.target.value)
                      }
                      placeholder="Razão social"
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Nome fantasia</span>
                    <input
                      value={dados.empresa.nomeFantasia}
                      onChange={(e) =>
                        setEmpresa("nomeFantasia", e.target.value)
                      }
                      placeholder="ABR Agro"
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>CNPJ</span>
                    <input
                      value={dados.empresa.cnpj}
                      onChange={(e) => setEmpresa("cnpj", e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Inscrição estadual</span>
                    <input
                      value={dados.empresa.inscricaoEstadual}
                      onChange={(e) =>
                        setEmpresa("inscricaoEstadual", e.target.value)
                      }
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Telefone</span>
                    <input
                      value={dados.empresa.telefone}
                      onChange={(e) => setEmpresa("telefone", e.target.value)}
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>E-mail</span>
                    <input
                      type="email"
                      value={dados.empresa.email}
                      onChange={(e) => setEmpresa("email", e.target.value)}
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Site</span>
                    <input
                      value={dados.empresa.site}
                      onChange={(e) => setEmpresa("site", e.target.value)}
                      placeholder="https://"
                    />
                  </label>
                </div>

                <div className="configuracao-subsecao">
                  <div className="configuracao-subsecao-title">
                    <FileText size={17} />
                    <span>Endereço</span>
                  </div>

                  <div className="configuracao-grid">
                    {(
                      [
                        ["cep", "CEP"],
                        ["logradouro", "Logradouro"],
                        ["numero", "Número"],
                        ["complemento", "Complemento"],
                        ["bairro", "Bairro"],
                        ["cidade", "Cidade"],
                        ["estado", "Estado"],
                      ] as Array<
                        [keyof ConfiguracoesSistema["empresa"], string]
                      >
                    ).map(([campo, titulo]) => (
                      <label
                        className={
                          campo === "logradouro" || campo === "cidade"
                            ? "configuracao-field col-2"
                            : "configuracao-field"
                        }
                        key={campo}
                      >
                        <span>{titulo}</span>
                        <input
                          value={dados.empresa[campo] as string}
                          onChange={(e) => setEmpresa(campo, e.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {aba === "comercial" && (
              <>
                <div className="configuracao-secao-header">
                  <div>
                    <span>OPERAÇÃO COMERCIAL</span>
                    <h2>Regras de vendas e compras</h2>
                    <p>
                      Defina padrões que serão usados pelos módulos comerciais.
                    </p>
                  </div>
                  <ShoppingCart size={21} />
                </div>

                <div className="configuracao-grid">
                  <label className="configuracao-field">
                    <span>Prefixo das vendas</span>
                    <input
                      value={dados.comercial.prefixoVenda}
                      maxLength={5}
                      onChange={(e) =>
                        setComercial(
                          "prefixoVenda",
                          e.target.value.toUpperCase(),
                        )
                      }
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Próximo número da venda</span>
                    <input
                      type="number"
                      min={1}
                      value={dados.comercial.proximoNumeroVenda}
                      onChange={(e) =>
                        setComercial(
                          "proximoNumeroVenda",
                          Math.max(1, Math.floor(numero(e.target.value))),
                        )
                      }
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Prefixo das compras</span>
                    <input
                      value={dados.comercial.prefixoCompra}
                      maxLength={5}
                      onChange={(e) =>
                        setComercial(
                          "prefixoCompra",
                          e.target.value.toUpperCase(),
                        )
                      }
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Próximo número da compra</span>
                    <input
                      type="number"
                      min={1}
                      value={dados.comercial.proximoNumeroCompra}
                      onChange={(e) =>
                        setComercial(
                          "proximoNumeroCompra",
                          Math.max(1, Math.floor(numero(e.target.value))),
                        )
                      }
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Desconto máximo (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={dados.comercial.descontoMaximoPercentual}
                      onChange={(e) =>
                        setComercial(
                          "descontoMaximoPercentual",
                          Math.min(100, Math.max(0, numero(e.target.value))),
                        )
                      }
                    />
                  </label>
                </div>

                <div className="configuracao-opcoes">
                  <label className="configuracao-switch">
                    <input
                      type="checkbox"
                      checked={dados.comercial.exigirClienteVenda}
                      onChange={(e) =>
                        setComercial("exigirClienteVenda", e.target.checked)
                      }
                    />
                    <span />
                    <div>
                      <strong>Exigir cliente na venda</strong>
                      <small>Impede a conclusão de vendas sem cliente.</small>
                    </div>
                  </label>

                  <label className="configuracao-switch">
                    <input
                      type="checkbox"
                      checked={dados.comercial.permitirVendaSemEstoque}
                      onChange={(e) =>
                        setComercial(
                          "permitirVendaSemEstoque",
                          e.target.checked,
                        )
                      }
                    />
                    <span />
                    <div>
                      <strong>Permitir venda sem estoque</strong>
                      <small>
                        Deve ser ativado somente quando a operação permitir
                        estoque negativo.
                      </small>
                    </div>
                  </label>
                </div>

                <div className="configuracao-subsecao">
                  <div className="configuracao-subsecao-title">
                    <Store size={17} />
                    <span>Formas de pagamento</span>
                  </div>

                  <div className="configuracao-tags">
                    {[
                      ["pix", "PIX"],
                      ["dinheiro", "Dinheiro"],
                      ["cartao_credito", "Cartão de crédito"],
                      ["cartao_debito", "Cartão de débito"],
                      ["transferencia", "Transferência"],
                      ["boleto", "Boleto"],
                    ].map(([valor, titulo]) => (
                      <button
                        type="button"
                        key={valor}
                        className={
                          dados.comercial.formasPagamento.includes(valor)
                            ? "configuracao-tag is-selected"
                            : "configuracao-tag"
                        }
                        onClick={() => alternarFormaPagamento(valor)}
                      >
                        {titulo}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {aba === "financeira" && (
              <>
                <div className="configuracao-secao-header">
                  <div>
                    <span>CONTROLE FINANCEIRO</span>
                    <h2>Regras financeiras</h2>
                    <p>Padrões para prazos, cobrança e caixa principal.</p>
                  </div>
                  <CircleDollarSign size={21} />
                </div>

                <div className="configuracao-grid">
                  <label className="configuracao-field">
                    <span>Moeda</span>
                    <input value="BRL — Real brasileiro" disabled />
                  </label>

                  <label className="configuracao-field">
                    <span>Prazo padrão para receber (dias)</span>
                    <input
                      type="number"
                      min={0}
                      value={dados.financeira.prazoPadraoReceberDias}
                      onChange={(e) =>
                        setFinanceira(
                          "prazoPadraoReceberDias",
                          Math.max(0, Math.floor(numero(e.target.value))),
                        )
                      }
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Prazo padrão para pagar (dias)</span>
                    <input
                      type="number"
                      min={0}
                      value={dados.financeira.prazoPadraoPagarDias}
                      onChange={(e) =>
                        setFinanceira(
                          "prazoPadraoPagarDias",
                          Math.max(0, Math.floor(numero(e.target.value))),
                        )
                      }
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Juros ao dia (%)</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={dados.financeira.jurosAoDiaPercentual}
                      onChange={(e) =>
                        setFinanceira(
                          "jurosAoDiaPercentual",
                          Math.max(0, numero(e.target.value)),
                        )
                      }
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Multa (%)</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={dados.financeira.multaPercentual}
                      onChange={(e) =>
                        setFinanceira(
                          "multaPercentual",
                          Math.max(0, numero(e.target.value)),
                        )
                      }
                    />
                  </label>

                  <label className="configuracao-field col-2">
                    <span>Nome do caixa principal</span>
                    <input
                      value={dados.financeira.caixaPrincipalNome}
                      onChange={(e) =>
                        setFinanceira("caixaPrincipalNome", e.target.value)
                      }
                    />
                  </label>
                </div>
              </>
            )}

            {aba === "estoque" && (
              <>
                <div className="configuracao-secao-header">
                  <div>
                    <span>CONTROLE DE ESTOQUE</span>
                    <h2>Regras de estoque</h2>
                    <p>Defina parâmetros para alertas e movimentações.</p>
                  </div>
                  <Package size={21} />
                </div>

                <div className="configuracao-grid">
                  <label className="configuracao-field">
                    <span>Estoque mínimo padrão</span>
                    <input
                      type="number"
                      min={0}
                      value={dados.estoque.estoqueMinimoPadrao}
                      onChange={(e) =>
                        setEstoque(
                          "estoqueMinimoPadrao",
                          Math.max(0, numero(e.target.value)),
                        )
                      }
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Estoque máximo padrão</span>
                    <input
                      type="number"
                      min={0}
                      value={dados.estoque.estoqueMaximoPadrao}
                      onChange={(e) =>
                        setEstoque(
                          "estoqueMaximoPadrao",
                          Math.max(0, numero(e.target.value)),
                        )
                      }
                    />
                  </label>

                  <label className="configuracao-field">
                    <span>Casas decimais da quantidade</span>
                    <input
                      type="number"
                      min={0}
                      max={4}
                      value={dados.estoque.casasDecimaisQuantidade}
                      onChange={(e) =>
                        setEstoque(
                          "casasDecimaisQuantidade",
                          Math.min(
                            4,
                            Math.max(0, Math.floor(numero(e.target.value))),
                          ),
                        )
                      }
                    />
                  </label>
                </div>

                <div className="configuracao-opcoes">
                  <label className="configuracao-switch">
                    <input
                      type="checkbox"
                      checked={dados.estoque.alertarEstoqueBaixo}
                      onChange={(e) =>
                        setEstoque("alertarEstoqueBaixo", e.target.checked)
                      }
                    />
                    <span />
                    <div>
                      <strong>Alertar estoque baixo</strong>
                      <small>Exibe produtos abaixo do mínimo no sistema.</small>
                    </div>
                  </label>

                  <label className="configuracao-switch">
                    <input
                      type="checkbox"
                      checked={dados.estoque.permitirEstoqueNegativo}
                      onChange={(e) =>
                        setEstoque("permitirEstoqueNegativo", e.target.checked)
                      }
                    />
                    <span />
                    <div>
                      <strong>Permitir estoque negativo</strong>
                      <small>
                        Permite movimentações abaixo do estoque disponível.
                      </small>
                    </div>
                  </label>
                </div>

                <div className="configuracao-aviso">
                  <Factory size={17} />
                  <div>
                    <strong>Importante</strong>
                    <p>
                      O estoque mínimo cadastrado em cada produto tem prioridade
                      sobre o valor padrão desta configuração.
                    </p>
                  </div>
                </div>
              </>
            )}

            <footer className="configuracoes-rodape">
              <span>
                {salvoEm
                  ? `Última alteração: ${new Date(salvoEm).toLocaleString("pt-BR")}`
                  : "Ainda não há alterações salvas."}
              </span>

              <div>
                <button
                  type="button"
                  className="btn"
                  disabled={!alterado}
                  onClick={() => {
                    const atual = obterConfiguracoes();
                    setDados(atual);
                    setMensagem("Alterações locais descartadas.");
                  }}
                >
                  Descartar
                </button>

                <button type="button" className="btn primary" onClick={salvar}>
                  <Save size={16} />
                  Salvar
                </button>
              </div>
            </footer>
          </section>
        </div>
      </main>
    </AppShell>
  );
}
