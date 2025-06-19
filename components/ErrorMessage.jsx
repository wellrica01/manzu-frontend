import { Card } from '@/components/ui/card';

const ErrorMessage = ({ error }) => {
  if (!error) return null;
  return (
    <Card className="shadow-md border border-red-100/50 rounded-2xl bg-red-50/90 backdrop-blur-sm p-4 mt-6">
      <p className="text-red-600 text-base font-medium" aria-live="polite">
        {error}
      </p>
    </Card>
  );
};

export default ErrorMessage;