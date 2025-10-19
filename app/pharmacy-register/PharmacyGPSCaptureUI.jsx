import { Button } from '@/components/ui/button';
import { FormLabel, FormDescription } from '@/components/ui/form';
import { MapPin, Loader2, AlertCircle, CheckCircle2, Wifi, Satellite, X } from 'lucide-react';

/**
 * Enhanced GPS Capture UI for Pharmacy Registration
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
          icon: <Wifi className="h-5 w-5 text-blue-600" />,
          title: 'Network Positioning',
          description: 'Using Wi-Fi and cell towers for quick location...',
          color: 'blue'
        };
      }
      return {
        icon: <Satellite className="h-5 w-5 text-purple-600" />,
        title: 'GPS Satellites',
        description: 'Getting precise coordinates from GPS satellites...',
        color: 'purple'
      };
    };

    const phaseInfo = getPhaseInfo();

    const getStatusMessage = () => {
      if (status === 'starting') return 'Initializing location services...';
      if (status === 'network_phase') return 'Quick network positioning...';
      if (status === 'network_success') return 'Network location acquired!';
      if (status === 'network_failed') return 'Switching to GPS satellites...';
      if (status === 'gps_phase') return 'Acquiring GPS signal...';
      if (status === 'collecting') return 'Collecting sample...';
      if (status === 'success') return accuracy ? `Good signal (±${accuracy}m)` : 'Sample collected';
      if (status === 'error') return 'Retrying...';
      if (status === 'poor_signal') return 'Weak signal - move outdoors';
      return 'Processing...';
    };

    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Pulsing animation */}
              <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
              <div className={`relative p-2 rounded-full bg-${phaseInfo.color}-100`}>
                {phaseInfo.icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{phaseInfo.title}</p>
              <p className="text-xs text-gray-600">{phaseInfo.description}</p>
            </div>
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={gpsCapture.cancelCapture}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-gray-700">
              {getStatusMessage()}
            </span>
            <span className="font-bold text-gray-900">
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
        <div className="flex items-center justify-between text-xs">
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
        icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        badge: 'bg-green-100 text-green-800'
      },
      good: {
        color: 'blue',
        icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />,
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        badge: 'bg-blue-100 text-blue-800'
      },
      acceptable: {
        color: 'yellow',
        icon: <CheckCircle2 className="h-5 w-5 text-yellow-600" />,
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        badge: 'bg-yellow-100 text-yellow-800'
      },
      usable: {
        color: 'orange',
        icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        badge: 'bg-orange-100 text-orange-800'
      },
      poor: {
        color: 'red',
        icon: <AlertCircle className="h-5 w-5 text-red-600" />,
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        badge: 'bg-red-100 text-red-800'
      }
    };

    const config = qualityConfig[quality] || qualityConfig.acceptable;

    return (
      <div className={`p-4 rounded-xl border-2 ${config.bg} ${config.border} animate-in fade-in zoom-in-95 duration-300`}>
        <div className="flex items-start gap-3">
          {config.icon}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <p className={`text-sm font-bold ${config.text}`}>
                Location Captured Successfully
              </p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                {quality.charAt(0).toUpperCase() + quality.slice(1)}
              </span>
            </div>
            
            {/* Location details grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
              <div>
                <span className="text-gray-600">Coordinates:</span>
                <p className="font-mono font-medium text-gray-900">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              </div>
              <div>
                <span className="text-gray-600">Accuracy:</span>
                <p className="font-semibold text-gray-900">±{accuracy}m</p>
              </div>
              <div>
                <span className="text-gray-600">Samples:</span>
                <p className="font-semibold text-gray-900">{sampleCount}</p>
              </div>
              {consistency !== undefined && (
                <div>
                  <span className="text-gray-600">Consistency:</span>
                  <p className="font-semibold text-gray-900">{consistency}m</p>
                </div>
              )}
            </div>

            {/* Quality explanation */}
            {quality === 'excellent' && (
              <p className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                🎯 Perfect accuracy for pharmacy registration
              </p>
            )}
            {quality === 'good' && (
              <p className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                ✅ Very good accuracy - suitable for registration
              </p>
            )}
            {quality === 'acceptable' && (
              <p className="text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                ⚠️ Acceptable accuracy - consider recapturing outdoors for better precision
              </p>
            )}
            {quality === 'usable' && (
              <p className="text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                ⚠️ Low accuracy - strongly recommend recapturing outdoors
              </p>
            )}
            {quality === 'poor' && (
              <p className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                ❌ Accuracy too low - please recapture outdoors with clear sky view
              </p>
            )}
          </div>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className={`flex-shrink-0 ${config.text} hover:bg-${config.color}-100`}
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
          <p className="text-sm font-semibold text-red-800 mb-1">Location Capture Failed</p>
          <p className="text-xs text-red-700">{gpsCapture.error}</p>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="space-y-3">
      <FormLabel className="text-sm font-semibold text-gray-700">
        Pharmacy Location (GPS) <span className="text-red-500">*</span>
      </FormLabel>
      
      {!gpsCapture.location ? (
        <>
          <Button
            type="button"
            onClick={onCapture}
            disabled={gpsCapture.isCapturing}
            className="w-full h-12 sm:h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-[#1ABA7F] to-[#225F91] hover:opacity-90 text-white transition-all disabled:opacity-50"
          >
            {gpsCapture.isCapturing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Capturing Location...
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5 mr-2" />
                Capture Pharmacy Location
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

      <FormDescription className="text-xs text-gray-600">
        📍 High-precision GPS capture using network + satellite positioning
        <br />
        ⚡ For best results: Move outdoors with clear sky view (7 samples with outlier filtering)
      </FormDescription>
    </div>
  );
}