import { Card, CardContent } from '@/components/ui/card';

export default function NextStepsCard({ hasDelivery, hasPickup }) {
  const steps = [];

  // Step 1: Always show email confirmation
  steps.push({
    number: 1,
    text: "You'll receive an email confirmation shortly",
    color: 'from-blue-500 to-blue-600'
  });

  // Step 2: Delivery if applicable
  if (hasDelivery) {
    steps.push({
      number: 2,
      text: "Your medications will be delivered to your address",
      color: 'from-green-500 to-green-600'
    });
  }

  // Step 3: Pickup notification if applicable
  if (hasPickup) {
    steps.push({
      number: hasDelivery ? 3 : 2,
      text: "You'll be notified when ready for pickup",
      color: 'from-purple-500 to-purple-600'
    });
  }

  return (
    <Card className="bg-gradient-to-br from-[#1ABA7F]/10 to-[#225F91]/10 border-2 border-[#1ABA7F]/20 rounded-2xl shadow-lg">
      <CardContent className="p-6 sm:p-8 text-center space-y-4">
        <h3 className="text-xl font-black text-[#225F91]">What Happens Next?</h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {steps.map((step) => (
            <div key={step.number} className="p-4 bg-white rounded-xl border border-gray-200 text-left">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                  {step.number}
                </div>
                <p className="text-gray-700 font-medium">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}