/**
 * Configuração do aplicativo desktop.
 *
 * DEV:
 * o Electron abre o Next local.
 *
 * PRODUÇÃO:
 * troque productionUrl pela URL publicada no Vercel.
 */
const DESKTOP_CONFIG = {
  devUrl: process.env.ABR_DESKTOP_DEV_URL || "http://localhost:3000",

  productionUrl:
    process.env.ABR_DESKTOP_PRODUCTION_URL || "https://SEU-PROJETO.vercel.app",
};

module.exports = {
  DESKTOP_CONFIG,
};
