import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gestão Financeira",
    short_name: "Financeira",
    description: "Painel financeiro com controle de receitas, despesas e mensalidades.",
    start_url: "/pages/Dashboard",
    display: "standalone",
    background_color: "#121212",
    theme_color: "#121212",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
