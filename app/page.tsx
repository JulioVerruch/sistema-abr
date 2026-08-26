"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  Package,
  ShoppingCart,
  TriangleAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { AppShell } from "../components/layout/AppShell";
import { obterProdutos, type Produto } from "../data/produtosStore";
import { obterResumoVendas, obterVendas } from "../data/vendasStore";
import { obterResumoCompras } from "../data/comprasStore";
import { obterResumoCaixa } from "../data/caixaStore";
import { obterResumoContasReceber } from "../data/contasReceberStore";
import { obterResumoContasPagar } from "../data/contasPagarStore";

function moeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor || 0);
}

function custoProdutoAtual(produto: Produto): number {
  const valor = Number(
    String(produto.custo ?? "")
      .replace("R$", "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", "."),
  );

  return Number.isFinite(valor) ? valor : 0;
}

export default function Home() {
  const [atualizacao, setAtualizacao] = useState(0);

  useEffect(() => {
    const eventos = [
      "abr-agro-vendas-atualizadas",
      "abr-agro-compras-atualizadas",
      "abr-agro-contas-pagar-atualizadas",
      "abr-agro-contas-receber-atualizadas",
      "abr-agro-caixa-atualizado",
    ];

    const atualizar = () => setAtualizacao((valor) => valor + 1);

    eventos.forEach((evento) => window.addEventListener(evento, atualizar));

    return () => {
      eventos.forEach((evento) =>
        window.removeEventListener(evento, atualizar),
      );
    };
  }, []);

  const dados = useMemo(() => {
    const produtos = obterProdutos();
    const vendas = obterVendas();
    const vendasResumo = obterResumoVendas();
    const comprasResumo = obterResumoCompras();
    const caixa = obterResumoCaixa();
    const receber = obterResumoContasReceber();
    const pagar = obterResumoContasPagar();

    const vendasConcluidas = vendas.filter(
      (venda) => venda.status === "concluida",
    );

    // O custo histórico não é armazenado nos itens da venda. Por isso o
    // resultado abaixo é uma estimativa usando o custo atual do cadastro.
    const custoEstimado = vendasConcluidas.reduce((total, venda) => {
      return (
        total +
        venda.itens.reduce((subtotal, item) => {
          const produto = produtos.find(
            (produtoAtual) => produtoAtual.id === Number(item.produtoId),
          );

          return subtotal + item.quantidade * (produto ? custoProdutoAtual(produto) : 0);
        }, 0)
      );
    }, 0);

    const lucroEstimado = Math.max(0, vendasResumo.valorConcluido - custoEstimado);
    const margemEstimada =
      vendasResumo.valorConcluido > 0
        ? (lucroEstimado / vendasResumo.valorConcluido) * 100
        : 0;

    const produtosAlerta = produtos
      .filter((produto) => {
        const minimo = Number(produto.estoqueMinimo ?? 2);
        return produto.estoque <= minimo;
      })
      .sort((a, b) => a.estoque - b.estoque)
      .slice(0, 8);

    return {
      produtos,
      vendasResumo,
      comprasResumo,
      caixa,
      receber,
      pagar,
      lucroEstimado,
      margemEstimada,
      produtosAlerta,
    };
  }, [atualizacao]);

  return (
    <AppShell
      title="Dashboard"
      description="Visão geral da operação da ABR Agro."
    >
      <section className="admin-page">
        <div className="admin-page-header">
          <div>
            <span className="admin-eyebrow">Visão geral</span>
            <h2>Olá, Administrador</h2>
            <p>
              Indicadores calculados diretamente a partir dos módulos do sistema.
            </p>
          </div>

          <div className="admin-page-actions">
            <Link href="/vendas/nova" className="btn primary">
              <ShoppingCart size={18} />
              Nova venda
            </Link>

            <Link href="/compras/nova" className="btn">
              <Package size={18} />
              Nova compra
            </Link>
          </div>
        </div>

        <div className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <span>Faturamento</span>
            <strong>{moeda(dados.vendasResumo.valorConcluido)}</strong>
            <p className="text-green">
              <ArrowUpRight size={14} />
              {dados.vendasResumo.concluidas} vendas concluídas
            </p>
          </article>

          <article className="admin-kpi-card">
            <span>Vendas realizadas</span>
            <strong>{dados.vendasResumo.concluidas}</strong>
            <p className="text-muted">
              {dados.vendasResumo.pendentes} pendentes · {dados.vendasResumo.canceladas} canceladas
            </p>
          </article>

          <article className="admin-kpi-card">
            <span>Resultado estimado</span>
            <strong>{moeda(dados.lucroEstimado)}</strong>
            <p className="text-green">
              <TrendingUp size={14} />
              Margem estimada de {dados.margemEstimada.toFixed(1)}%
            </p>
          </article>

          <article className="admin-kpi-card">
            <span>Estoque em alerta</span>
            <strong>{dados.produtosAlerta.length}</strong>
            <p className="text-danger">
              <TriangleAlert size={14} />
              Produtos no mínimo ou abaixo
            </p>
          </article>
        </div>

        <div className="admin-grid">
          <article className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Financeiro</span>
                <h3>Resumo atual</h3>
                <p>Valores reais registrados nos módulos financeiros.</p>
              </div>
              <CircleDollarSign size={28} className="text-gold" />
            </div>

            <div className="admin-stats">
              <div>
                <strong className="text-green">{moeda(dados.caixa.entradas)}</strong>
                <span>Entradas no caixa</span>
              </div>

              <div>
                <strong className="text-danger">{moeda(dados.caixa.saidas)}</strong>
                <span>Saídas no caixa</span>
              </div>

              <div>
                <strong className="text-gold">{moeda(dados.caixa.saldo)}</strong>
                <span>Saldo do caixa</span>
              </div>

              <div>
                <strong>{moeda(dados.receber.saldoAberto)}</strong>
                <span>A receber</span>
              </div>
            </div>

            <div className="admin-dashboard-finance-links">
              <Link href="/financeiro/contas-receber" className="btn">
                Contas a receber
              </Link>
              <Link href="/financeiro/contas-pagar" className="btn">
                Contas a pagar
              </Link>
              <Link href="/financeiro/caixa" className="btn gold">
                Caixa
              </Link>
            </div>
          </article>

          <article className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-eyebrow">Obrigações</span>
                <h3>Contas a pagar</h3>
                <p>Acompanhe compromissos ainda em aberto.</p>
              </div>
              <Wallet size={28} />
            </div>

            <div className="admin-stats">
              <div>
                <strong>{moeda(dados.pagar.saldo)}</strong>
                <span>Saldo a pagar</span>
              </div>
              <div>
                <strong>{dados.pagar.pendentes}</strong>
                <span>Pendentes</span>
              </div>
              <div>
                <strong>{dados.pagar.parciais}</strong>
                <span>Parciais</span>
              </div>
              <div>
                <strong className="text-danger">{dados.pagar.vencidas}</strong>
                <span>Vencidas</span>
              </div>
            </div>

            <div className="admin-dashboard-finance-links">
              <Link href="/financeiro/contas-pagar" className="btn">
                Ver contas a pagar
              </Link>
            </div>
          </article>
        </div>

        <article className="admin-card">
          <div className="admin-card-header">
            <div>
              <span className="admin-eyebrow">Estoque</span>
              <h3>Produtos que precisam de atenção</h3>
              <p>Itens no estoque mínimo ou abaixo dele.</p>
            </div>

            <Link href="/estoque" className="btn">
              Ver estoque
            </Link>
          </div>

          {dados.produtosAlerta.length === 0 ? (
            <div className="dashboard-empty-state">
              <Package size={24} />
              <strong>Nenhum produto em alerta.</strong>
              <span>O estoque está acima do mínimo cadastrado.</span>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Estoque</th>
                    <th>Status</th>
                    <th>Preço</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.produtosAlerta.map((produto) => {
                    const minimo = Number(produto.estoqueMinimo ?? 2);
                    const semEstoque = produto.estoque <= 0;

                    return (
                      <tr key={produto.id}>
                        <td>
                          <div className="product-name">
                            <strong>{produto.nome}</strong>
                            <span>{produto.codigo}</span>
                          </div>
                        </td>
                        <td>{produto.categoria}</td>
                        <td>
                          {produto.estoque} {produto.unidade ?? "un."}
                        </td>
                        <td>
                          <div className="stock-status">
                            <span
                              className={`stock-dot ${semEstoque ? "empty" : "low"}`}
                            />
                            {semEstoque
                              ? "Sem estoque"
                              : `Abaixo/próximo do mínimo (${minimo})`}
                          </div>
                        </td>
                        <td className="price sale">
                          {produto.preco}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <div className="admin-actions">
          <div>
            <span className="admin-eyebrow">Operação</span>
            <h3>Controle sua operação em um único lugar</h3>
            <p className="text-muted">
              Vendas, compras, estoque e financeiro agora alimentam o dashboard
              com os dados armazenados pelo sistema.
            </p>
          </div>

          <div className="admin-toolbar">
            <Link href="/estoque" className="btn">
              <Boxes size={18} />
              Estoque
            </Link>

            <Link href="/compras" className="btn">
              <ArrowDownRight size={18} />
              Compras
            </Link>

            <Link href="/financeiro" className="btn gold">
              <CircleDollarSign size={18} />
              Financeiro
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
