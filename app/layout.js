import './globals.css';
     export const metadata = {
       title: 'New Medication App',
       description: 'Digital pharmacy platform',
     };
     export default function RootLayout({ children }) {
       return (
         <html lang="en">
           <body>{children}</body>
         </html>
       );
     }