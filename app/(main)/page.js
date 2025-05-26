import SearchBar from '@/components/SearchBar';
import PrescriptionUploadForm from '@/components/PrescriptionUploadForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Hero Section */}
        <header className="text-center mb-16 fade-in">
          <h1 className="text-5xl sm:text-6xl font-extrabold text-primary tracking-tight">
            Discover Medications with <span className="text-secondary">Manzu</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            Find medications nearby or upload your prescription effortlessly with our premium pharmacy platform.
          </p>
        </header>

        {/* Main Content */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Search Medications Card */}
          <div className="card p-8 card-hover fade-in" style={{ animationDelay: '0.2s' }} data-testid="search-card">
            <h2 className="text-3xl font-semibold text-primary mb-6">Search Medications</h2>
            <SearchBar />
          </div>

          {/* Upload Prescription Card */}
          <div className="card p-8 card-hover fade-in" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-3xl font-semibold text-primary mb-6">Upload Prescription</h2>
            <PrescriptionUploadForm />
          </div>
        </div>
      </div>
    </div>
  );
}