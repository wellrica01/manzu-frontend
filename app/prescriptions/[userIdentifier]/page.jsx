import PrescriptionMedicationsPage from '../components/PrescriptionMedicationsPage';
import ErrorBoundary, { NetworkErrorBoundary } from '@/components/ErrorBoundary';

export default function PrescriptionMedPage() {
  return (
    <NetworkErrorBoundary>
      <ErrorBoundary>
        <PrescriptionMedicationsPage />
      </ErrorBoundary>
    </NetworkErrorBoundary>
  );
}