/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['replicate.delivery', 'ai-explorer.tech'],  // Ajouter les domaines des images externes ici
  },
  async headers() {
    return [
      {
        source: "/(.*)",  // Appliquer ces en-têtes à toutes les routes
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",  // Autoriser toutes les origines, ajustez ceci selon vos besoins
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",  // Autoriser les méthodes HTTP
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Authorization, Content-Type",  // Autoriser certains en-têtes
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
