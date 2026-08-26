module.exports = {
  packagerConfig: {
    asar: true,
    name: "ABR Agro",
    executableName: "ABRAgro",
  },

  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "ABRAgro",
        setupExe: "ABR-Agro-Setup.exe",
        authors: "ABR Agro",
        description: "Sistema ABR | Gestão Agropecuária",
      },
    },
  ],
};
