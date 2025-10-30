import { Card, CardContent } from '@/components/ui/card';


const NextStepsCard = ({ hasDelivery, hasPickup }) => {
  const steps = [];

  steps.push({
    number: 1,
    text: "You'll receive an email confirmation shortly",
    color: 'from-blue-500 to-blue-600'
  });

  if (hasDelivery) {
    steps.push({
      number: 2,
      text: "Your medications will be delivered to your address",
      color: 'from-green-500 to-green-600'
    });
  }

  if (hasPickup) {
    steps.push({
      number: hasDelivery ? 3 : 2,
      text: "You'll be notified when ready for pickup",
      color: 'from-purple-500 to-purple-600'
    });
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg shadow-lg">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <h3 className="text-2xl font-black text-[#225F91] text-center">What Happens Next?</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div 
              key={step.number} 
              className="p-5 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200"
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-md`}>
                  {step.number}
                </div>
                <p className="text-gray-700 font-medium leading-relaxed pt-1">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


export default  NextStepsCard;