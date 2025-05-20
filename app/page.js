import SearchBar from '@/components/SearchBar';
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';

export default function Home() {
  return (
    <div
      className="min-h-screen bg-gradient-to-b from-teal-50 to-gray-50 py-8 px-4 sm:px-6 lg:px-8"
      role="main"
      aria-labelledby="app-title"
    >
      <div className="container mx-auto max-w-5xl bg-white border border-gray-200 rounded-xl shadow-sm p-6 sm:p-8">
        {/* Header */}
        <header className="text-center mb-10 border-b border-gray-200 pb-6">
          <h1
            id="app-title"
            className="text-4xl sm:text-5xl font-bold text-teal-800 tracking-tight"
          >
            Medication Finder
          </h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
            Find medications nearby or upload your prescription effortlessly.
          </p>
        </header>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Search Medications Card */}
          <div
            className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-md hover:shadow-lg hover:border-teal-300 hover:scale-105 transition-all duration-200"
            data-testid="search-card"
          >
            <h2 className="text-2xl font-semibold text-teal-700 mb-4 border-b border-gray-200 pb-2">
              Search Medications
            </h2>
            <SearchBar />
          </div>

          {/* Upload Prescription Card */}
          <div
            className="bg-gray-50 border border-gray-200 p-6 rounded-xl shadow-md hover:shadow-lg hover:border-teal-300 hover:scale-105 transition-all duration-200"
            data-testid="upload-card"
          >
            <h2 className="text-2xl font-semibold text-teal-700 mb-4 border-b border-gray-200 pb-2">
              Upload Prescription
            </h2>
            <PrescriptionUploadForm />
          </div>
        </div>
      </div>
    </div>
  );
}