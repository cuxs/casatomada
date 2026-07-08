/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/sales", destination: "/admin/sales", permanent: true },
      {
        source: "/register-sale",
        destination: "/admin/register-sale",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
