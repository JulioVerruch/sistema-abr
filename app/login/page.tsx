import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  LogIn,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { fazerLogin } from "../../data/authStore";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    setCarregando(false);
  }, []);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (entrando) return;

    setErro("");
    setEntrando(true);

    try {
      const resultado = await fazerLogin(usuario, senha);

      if (!resultado.sucesso) {
        setErro(resultado.mensagem ?? "Não foi possível realizar o login.");
        return;
      }

      const destinoInformado = searchParams.get("redirect") || "/";
      const destino =
        destinoInformado.startsWith("/") && !destinoInformado.startsWith("//")
          ? destinoInformado
          : "/";

      router.replace(destino);
      router.refresh();
    } catch {
      setErro("Falha de comunicação com o servidor.");
    } finally {
      setEntrando(false);
    }
  }

  if (carregando) {
    return (
      <main className="login-page">
        <div className="login-loading">Verificando sessão...</div>
      </main>
    );
  }

  return (
    <main className="login-page">
      <div className="login-background-glow" />

      <section className="login-container">
        <div className="login-brand">
          <img
            src="/logo/abr-agro.png"
            alt="ABR Agro"
            className="login-brand-logo"
          />
        </div>

        <div className="login-card">
          <div className="login-card-header">
            <span>ACESSO AO SISTEMA</span>
            <h1>Bem-vindo</h1>
            <p>Entre com suas credenciais para acessar o Sistema ABR.</p>
          </div>

          <form className="login-form" onSubmit={entrar}>
            <label className="login-field">
              <span>Usuário</span>
              <div className="login-input-wrapper">
                <UserRound size={17} />
                <input
                  type="text"
                  value={usuario}
                  onChange={(event) => setUsuario(event.target.value)}
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
            </label>

            <label className="login-field">
              <span>Senha</span>
              <div className="login-input-wrapper">
                <LockKeyhole size={17} />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setMostrarSenha((value) => !value)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {erro && (
              <div className="login-error" role="alert">
                {erro}
              </div>
            )}

            <button type="submit" className="login-submit" disabled={entrando}>
              <LogIn size={17} />
              {entrando ? "Entrando..." : "Entrar no sistema"}
            </button>
          </form>

          <div className="login-security">
            <ShieldCheck size={15} />
            <span>Acesso restrito ao Sistema ABR</span>
          </div>
        </div>

        <p className="login-footer">Sistema ABR · Gestão Agropecuária</p>
      </section>
    </main>
  );
}
