import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function JobSearchLayout({
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