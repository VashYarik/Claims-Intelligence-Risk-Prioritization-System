import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Claims System",
  description: "Claims System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
