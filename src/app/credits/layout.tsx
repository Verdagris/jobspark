import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  );
}