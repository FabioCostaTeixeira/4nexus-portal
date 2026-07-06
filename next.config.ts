import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fixa a raiz do workspace nesta pasta — evita que o Next confunda a raiz
  // com outro package-lock.json presente em uma pasta ancestral (ex.: perfil do usuário).
  outputFileTracingRoot: path.join(__dirname),
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
