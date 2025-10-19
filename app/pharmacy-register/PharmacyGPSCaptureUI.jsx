import { Button } from '@/components/ui/button';
import { FormLabel, FormDescription } from '@/components/ui/form';
import { MapPin, Loader2, AlertCircle, CheckCircle2, Wifi, Satellite, X } from 'lucide-react';

/**
 * Enhanced GPS Capture UI for Pharmacy Registration - RESPONSIVE VERSION
 */
export function PharmacyGPSCaptureUI({ gpsCapture, onCapture, onClear }) {
  
  // Render progress indicator
  const renderProgress = () => {
    if (!gpsCapture.isCapturing || !gpsCapture.progress) return null;

    const { current, total, status, phase, accuracy, samplesCollected } = gpsCapture.progress;
    const percentage = (current / total) * 100;

    const getPhaseInfo = () => {
      if (phase === 'network') {
        return {
          icon: <Wifi className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />,
          title: 'Network Positioning',
          description: 'Using Wi-Fi and cell towers...',
          color: 'blue'
        };
      }
      return {
        icon: <Satellite className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />,
        title: 'GPS Satellites',
        description: 'Getting precise coordinates...',
        color: 'purple'
      };
    };

    const phaseInfo = getPhaseInfo();

    const getStatusMessage = () => {
      if (status === 'starting') return 'Initializing...';
      if (status === 'network_phase') return 'Quick positioning...';
      if (status === 'network_success') return 'Network located!';
      if (status === 'network_failed') return 'Switching to GPS...';
      if (status === 'gps_phase') return 'Acquiring GPS...';
      if (status === 'collecting') return 'Collecting sample...';
      if (status === 'success') return accuracy ? `Good signal (±${accuracy}m)` : 'Sample collected';
      if (status === 'error') return 'Retrying...';
      if (status === 'poor_signal') return 'Weak signal';
      return 'Processing...';
    };

    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-3 sm:p-4 space-y-3 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {/* Pulsing animation */}
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
              <div className={`relative p-1.5 sm:p-2 rounded-full bg-${phaseInfo.color}-100`}>
                {phaseInfo.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                {phaseInfo.title}
              </p>
              <p className="text-xs text-gray-600 truncate hidden sm:block">
                {phaseInfo.description}
              </p>
            </div>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={gpsCapture.cancelCapture}
            className="text-gray-500 hover:text-gray-700 flex-shrink-0 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700 truncate flex-1 mr-2">
              {getStatusMessage()}
            </span>
            <span className="font-bold text-gray-900 flex-shrink-0">
              {current}/{total}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r ${
                phase === 'network' 
                  ? 'from-blue-500 to-blue-600' 
                  : 'from-purple-500 to-purple-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Status details */}
        <div className="flex items-center justify-between text-xs flex-wrap gap-1">
          <span className="text-gray-600">
            {samplesCollected !== undefined && `${samplesCollected} valid samples`}
          </span>
          {accuracy && (
            <span className={`font-semibold ${
              accuracy < 30 ? 'text-green-600' : 
              accuracy < 70 ? 'text-yellow-600' : 
              'text-orange-600'
            }`}>
              ±{Math.round(accuracy)}m
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render captured location
  const renderCapturedLocation = () => {
    if (!gpsCapture.location) return null;

    const { quality, latitude, longitude, accuracy, sampleCount, consistency } = gpsCapture.location;

    const qualityConfig = {
      excellent: {
        color: 'green',
        icon: <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />,
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        badge: 'bg-green-100 text-green-800'
      },
      good: {
        color: 'blue',
        icon: <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />,
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        badge: 'bg-blue-100 text-blue-800'
      },
      acceptable: {
        color: 'yellow',
        icon: <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />,
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        badge: 'bg-yellow-100 text-yellow-800'
      },
      usable: {
        color: 'orange',
        icon: <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />,
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        badge: 'bg-orange-100 text-orange-800'
      },
      poor: {
        color: 'red',
        icon: <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />,
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        badge: 'bg-red-100 text-red-800'
      }
    };

    const config = qualityConfig[quality] || qualityConfig.acceptable;

    return (
      <div className={`p-3 sm:p-4 rounded-xl border-2 ${config.bg} ${config.border} animate-in fade-in zoom-in-95 duration-300`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0">
              {config.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Title and Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                <p className={`text-xs sm:text-sm font-bold ${config.text}`}>
                  Location Captured
                </p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge} inline-block w-fit`}>
                  {quality.charAt(0).toUpperCase() + quality.slice(1)}
                </span>
              </div>
              
              {/* Location details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                <div className="space-y-1">
                  <span className="text-gray-600 block">Coordinates:</span>
                  <p className="font-mono text-[10px] sm:text-xs font-medium text-gray-900 break-all">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-600 block">Accuracy:</span>
                  <p className="font-semibold text-gray-900">±{accuracy}m</p>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-600 block">Samples:</span>
                  <p className="font-semibold text-gray-900">{sampleCount}</p>
                </div>
                {consistency !== undefined && (
                  <div className="space-y-1">
                    <span className="text-gray-600 block">Consistency:</span>
                    <p className="font-semibold text-gray-900">{consistency}m</p>
                  </div>
                )}
              </div>

              {/* Quality explanation */}
              <div className="text-[10px] sm:text-xs">
                {quality === 'excellent' && (
                  <p className="text-green-700 bg-green-100 px-2 py-1 rounded">
                    🎯 Perfect accuracy
                  </p>
                )}
                {quality === 'good' && (
                  <p className="text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    ✅ Very good accuracy
                  </p>
                )}
                {quality === 'acceptable' && (
                  <p className="text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    ⚠️ Consider recapturing outdoors
                  </p>
                )}
                {quality === 'usable' && (
                  <p className="text-orange-700 bg-orange-100 px-2 py-1 rounded">
                    ⚠️ Recapture outdoors recommended
                  </p>
                )}
                {quality === 'poor' && (
                  <p className="text-red-700 bg-red-100 px-2 py-1 rounded">
                    ❌ Please recapture outdoors
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className={`flex-shrink-0 ${config.text} hover:bg-${config.color}-100 text-xs sm:text-sm w-full sm:w-auto`}
          >
            Recapture
          </Button>
        </div>
      </div>
    );
  };

  // Render error
  const renderError = () => {
    if (!gpsCapture.error) return null;

    return (
      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in duration-300">
        <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-red-800 mb-1">Location Capture Failed</p>
          <p className="text-[10px] sm:text-xs text-red-700 break-words">{gpsCapture.error}</p>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="space-y-3">
      <FormLabel className="text-xs sm:text-sm font-semibold text-gray-700">
        Pharmacy Location (GPS) <span className="text-red-500">*</span>
      </FormLabel>
      
      {!gpsCapture.location ? (
        <>
          <Button
            type="button"
            onClick={onCapture}
            disabled={gpsCapture.isCapturing}
            className="w-full h-11 sm:h-12 lg:h-14 text-sm sm:text-base font-semibold rounded-xl bg-gradient-to-r from-[#1ABA7F] to-[#225F91] hover:opacity-90 text-white transition-all disabled:opacity-50"
          >
            {gpsCapture.isCapturing ? (
              <>
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                <span className="hidden sm:inline">Capturing Location...</span>
                <span className="sm:hidden">Capturing...</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                <span className="hidden sm:inline">Capture Pharmacy Location</span>
                <span className="sm:hidden">Capture Location</span>
              </>
            )}
          </Button>

          {renderProgress()}
          {renderError()}
        </>
      ) : (
        <>
          {renderCapturedLocation()}
          {renderError()}
        </>
      )}

      <FormDescription className="text-[10px] sm:text-xs text-gray-600 space-y-1">
        <span className="block">📍 High-precision GPS capture</span>
        <span className="block hidden sm:inline">⚡ Best results: Move outdoors with clear sky view</span>
        <span className="block sm:hidden">⚡ Move outdoors for best results</span>
      </FormDescription>
    </div>
  );
}