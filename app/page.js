import SearchBar from '@/components/SearchBar';
     import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';
     export default function Home() {
       return (
         <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
           <div className="container mx-auto max-w-6xl">
             <h1 className="text-4xl font-extrabold text-center text-indigo-800 mb-10 tracking-tight">
               New Medication App
             </h1>
             <div className="grid md:grid-cols-2 gap-8">
               <div className="bg-white p-6 rounded-xl shadow-lg">
                 <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Search Medications</h2>
                 <SearchBar />
               </div>
               <div className="bg-white p-6 rounded-xl shadow-lg">
                 <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Upload Prescription</h2>
                 <PrescriptionUploadForm />
               </div>
             </div>
           </div>
         </div>
       );
     }