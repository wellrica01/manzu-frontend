import Checkout from '@/components/checkout/Checkout';
import { Suspense } from 'react';

   export default function CheckoutPage() {
     return (
         <Suspense fallback={<div>Loading...</div>}>
           <Checkout />
         </Suspense>
       );
   }