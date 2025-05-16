import './globals.css';
     import Link from 'next/link';
     export const metadata = {
       title: 'New Medication App',
       description: 'Digital pharmacy platform',
     };
     export default function RootLayout({ children }) {
       return (
         <html lang="en">
           <body className="antialiased">
             <nav className="bg-indigo-800 text-white p-4">
               <div className="container mx-auto flex justify-between items-center">
                 <Link href="/" className="text-xl font-bold">
                   New Medication
                 </Link>
                 <div className="space-x-4">
                   <Link href="/" className="hover:text-indigo-200">
                     Home
                   </Link>
                   <Link href="/cart" className="hover:text-indigo-200">
                     Cart
                   </Link>
                    <Link href="/track" className="hover:text-indigo-200">
                     Track Order
                   </Link>
                 </div>
               </div>
             </nav>
             {children}
           </body>
         </html>
       );
     }