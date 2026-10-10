import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contemplación — Un retiro que nace despacio",
  description: "Un retiro entre montaña y selva, naciendo despacio. Descubre el lugar y recibe noticias de la apertura de Contemplación.",
  openGraph: {title:"Contemplación — Un retiro que nace despacio",description:"Entre niebla, madera y luz de atardecer, estamos preparando un espacio para detenerse.",locale:"es_ES",type:"website"},
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
