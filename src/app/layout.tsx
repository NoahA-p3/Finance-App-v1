import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finance Assistant MVP",
  description: "Simple SaaS finance assistant"
};

const themeInitScript = `
(function() {
  const key = 'finance-theme';
  const stored = localStorage.getItem(key);
  const preferredDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = stored ? stored === 'dark' : preferredDark;
  document.documentElement.classList.toggle('dark', dark);
})();
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
