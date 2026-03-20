export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto grid min-h-screen max-w-md place-items-center px-4">{children}</main>;
}
