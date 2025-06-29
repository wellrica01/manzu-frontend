import StatusCheck from './StatusCheck';
import { Suspense } from 'react';

   export default function StatusCheckPage() {
     return (
         <Suspense fallback={<div>Loading...</div>}>
           <StatusCheck />
         </Suspense>
       );
   }