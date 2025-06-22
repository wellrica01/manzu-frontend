import { Card } from '@/components/ui/card';

const PendingMessage = ({ message }) => {
  if (!message) return null;
  return (
    <Card
      className="bg-green-50/95 border border-green-100/50 rounded-2xl shadow-md mb-6 p-4 animate-in slide-in-from-top-10 duration-500"
      role="alert"
    >
      <p className="text-green-700 text-base font-medium">{message}</p>
    </Card>
  );
};

export default PendingMessage;