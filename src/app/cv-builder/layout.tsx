import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function CVBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
