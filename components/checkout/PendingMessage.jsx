import { Card } from '@/components/ui/card';

const PendingMessage = ({ message }) => {
  if (!message) return null;
  return (
    <Card
      className="relative bg-white/95 border border-[#1ABA7F]/20 rounded-2xl shadow-xl backdrop-blur-sm mb-6 p-4 animate-in slide-in-from-top duration-500"
      role="alert"
    >
      <div className="absolute top-0 left-0 w-12 h-12 bg-[#1ABA7F]/20 rounded-br-3xl" />
      <p className="text-[#1ABA7F] text-base font-medium">{message}</p>
    </Card>
  );
};

export default PendingMessage;