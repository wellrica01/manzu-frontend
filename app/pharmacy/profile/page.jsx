'use client';
import { useState, useEffect } from 'react';
import { 
  User, MapPin, Phone, Mail, Shield, Clock, Edit, Key, 
  Building, FileText, CheckCircle, AlertCircle, Camera,
  Navigation, Calendar, Map as MapIcon, Loader2, Save,
  XCircle, Calendar as CalendarIcon, Upload
} from 'lucide-react';
import { toast } from 'sonner';


const DAYS_OF_WEEK = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

const brandGreen = "#1ABA7F";
const brandBlue = "#225F91";

// API Functions
async function fetchProfile() {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

async function updateProfile(data) {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to update profile');
  }
  return res.json();
}

async function changePassword(data) {
  const token = localStorage.getItem('pharmacyToken');
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/pharmacy/change-password`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to change password');
  }
  return res.json();
}

// Components
function InfoCard({ icon: Icon, label, value, color = brandBlue }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
      <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-600 font-medium">{label}</div>
        <div className="text-base font-semibold text-gray-900 mt-0.5 break-words">
          {value || 'Not set'}
        </div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className={`
          fixed bottom-6 right-6 px-4 py-3 rounded-lg flex items-center gap-2 shadow-lg z-50
          ${toast.type === "success" ? "bg-green-100 border border-green-300 text-green-800" : ""}
          ${toast.type === "error" ? "bg-red-100 border border-red-300 text-red-800" : ""}
          animate-in slide-in-from-right
        `}>
          {toast.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}


function StatusBadge({ status }) {
  const configs = {
    APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: CheckCircle },
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: Clock },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected', icon: XCircle },
  };
  
  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
}

export default function PharmacyProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'hours', 'location', 'security'
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    user: { name: '', email: '' },
    pharmacy: {
      name: '', address: '', lga: '', state: '', ward: '',
      phone: '', licenseNumber: '', logoUrl: '',
      latitude: '', longitude: '', deliveryAvailability: false
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProfile();
      setProfile(data);
      setFormData({
        user: {
          name: data.user.name,
          email: data.user.email
        },
        pharmacy: {
          name: data.pharmacy.name,
          address: data.pharmacy.address,
          lga: data.pharmacy.lga,
          state: data.pharmacy.state,
          ward: data.pharmacy.ward || '',
          phone: data.pharmacy.phone,
          licenseNumber: data.pharmacy.licenseNumber,
          logoUrl: data.pharmacy.logoUrl || '',
          latitude: data.pharmacy.latitude || '',
          longitude: data.pharmacy.longitude || '',
          deliveryAvailability: data.pharmacy.deliveryAvailability || false
        }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(formData);
      await loadProfile();
      setEditMode(false);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    
    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            pharmacy: {
              ...prev.pharmacy,
              latitude: position.coords.latitude.toFixed(8),
              longitude: position.coords.longitude.toFixed(8)
            }
          }));
          showToast('Location captured successfully', 'success');
        },
        (error) => {
          showToast('Failed to get location: ' + error.message, 'error');
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#1ABA7F] mx-auto" />
          <p className="text-gray-600 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <p className="text-red-600 mt-4 text-lg">{error}</p>
          <button
            onClick={loadProfile}
            className="mt-4 px-6 py-2 bg-[#1ABA7F] text-white rounded-lg hover:bg-[#159e6a] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#225F91] to-[#1ABA7F] rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg">
              {profile.pharmacy.logoUrl ? (
                <img src={profile.pharmacy.logoUrl} alt="Logo" className="w-full h-full rounded-full object-cover" />
              ) : (
                <Building className="w-12 h-12 text-[#225F91]" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{profile.pharmacy.name}</h1>
              <p className="text-white/90 mt-1">{profile.pharmacy.address}</p>
              <div className="flex items-center gap-4 mt-3">
                <StatusBadge status={profile.pharmacy.status} />
                <span className="text-sm text-white/80">License: {profile.pharmacy.licenseNumber}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2 font-semibold"
          >
            <Edit className="w-4 h-4" />
            {editMode ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

    {/* Tabs */}
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
      <div
        className="
          flex sm:flex-wrap gap-2 sm:gap-3
          overflow-x-auto scrollbar-hide
          pb-2 sm:pb-0
        "
      >
        {[
          { id: 'info', label: 'General Info', icon: User },
          { id: 'location', label: 'Location & Map', icon: MapPin },
          { id: 'hours', label: 'Operating Hours', icon: Clock },
          { id: 'security', label: 'Security', icon: Key },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap
                flex-shrink-0
                ${
                  activeTab === tab.id
                    ? 'bg-[#1ABA7F] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>


      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'info' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-[#225F91]" />
                General Information
              </h2>
              
              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                      <input
                        type="text"
                        value={formData.user.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          user: { ...prev.user, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.user.email}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          user: { ...prev.user, email: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Pharmacy Name</label>
                      <input
                        type="text"
                        value={formData.pharmacy.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pharmacy: { ...prev.pharmacy, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.pharmacy.phone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pharmacy: { ...prev.pharmacy, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        value={formData.pharmacy.address}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pharmacy: { ...prev.pharmacy, address: e.target.value }
                        }))}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={formData.pharmacy.state}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pharmacy: { ...prev.pharmacy, state: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">LGA</label>
                      <input
                        type="text"
                        value={formData.pharmacy.lga}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pharmacy: { ...prev.pharmacy, lga: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
                      <input
                        type="text"
                        value={formData.pharmacy.ward}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pharmacy: { ...prev.pharmacy, ward: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    <input
                      type="checkbox"
                      id="delivery"
                      checked={formData.pharmacy.deliveryAvailability}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pharmacy: { ...prev.pharmacy, deliveryAvailability: e.target.checked }
                      }))}
                      className="w-4 h-4 text-[#1ABA7F] border-gray-300 rounded focus:ring-[#1ABA7F]"
                    />
                    <label htmlFor="delivery" className="text-sm font-medium text-gray-700">
                      Delivery service available
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      onClick={() => setEditMode(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-6 py-2 bg-[#1ABA7F] text-white rounded-lg hover:bg-[#159e6a] disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard icon={User} label="Your Name" value={profile.user.name} />
                  <InfoCard icon={Mail} label="Email" value={profile.user.email} />
                  <InfoCard icon={Building} label="Pharmacy Name" value={profile.pharmacy.name} />
                  <InfoCard icon={Phone} label="Phone" value={profile.pharmacy.phone} />
                  <InfoCard icon={FileText} label="License Number" value={profile.pharmacy.licenseNumber} />
                  <InfoCard icon={Shield} label="Role" value={profile.user.role} color={brandGreen} />
                  <div className="md:col-span-2">
                    <InfoCard icon={MapPin} label="Address" value={profile.pharmacy.address} />
                  </div>
                  <InfoCard icon={MapIcon} label="State" value={profile.pharmacy.state} />
                  <InfoCard icon={MapIcon} label="LGA" value={profile.pharmacy.lga} />
                  {profile.pharmacy.ward && (
                    <InfoCard icon={MapIcon} label="Ward" value={profile.pharmacy.ward} />
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'location' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#225F91]" />
                Location & GPS Coordinates
              </h2>

              {editMode ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Latitude</label>
                      <input
                        type="number"
                        step="0.00000001"
                        value={formData.pharmacy.latitude}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pharmacy: { ...prev.pharmacy, latitude: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                        placeholder="e.g., 9.082"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Longitude</label>
                      <input
                        type="number"
                        step="0.00000001"
                        value={formData.pharmacy.longitude}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          pharmacy: { ...prev.pharmacy, longitude: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                        placeholder="e.g., 7.492"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleGetCurrentLocation}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Navigation className="w-5 h-5" />
                    Get Current Location
                  </button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <InfoCard 
                      icon={Navigation} 
                      label="Latitude" 
                      value={profile.pharmacy.latitude || 'Not set'} 
                      color={brandBlue}
                    />
                    <InfoCard 
                      icon={Navigation} 
                      label="Longitude" 
                      value={profile.pharmacy.longitude || 'Not set'} 
                      color={brandBlue}
                    />
                  </div>

                  {profile.pharmacy.latitude && profile.pharmacy.longitude && (
                    <div className="bg-gray-100 rounded-lg p-4 h-64 flex items-center justify-center">
                      <div className="text-center text-gray-600">
                        <MapIcon className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                        <p>Map preview placeholder</p>
                        <p className="text-sm mt-2">
                          Coordinates: {profile.pharmacy.latitude}, {profile.pharmacy.longitude}
                        </p>
                        <a
                          href={`https://www.google.com/maps?q=${profile.pharmacy.latitude},${profile.pharmacy.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block mt-3 px-4 py-2 bg-[#1ABA7F] text-white rounded-lg hover:bg-[#159e6a] transition-colors"
                        >
                          Open in Google Maps
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'hours' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#225F91]" />
                Operating Hours
              </h2>
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Operating Hours Setup</p>
                <p className="text-sm mt-2">Configure your pharmacy's working hours for each day of the week</p>
                <button className="mt-4 px-6 py-2 bg-[#1ABA7F] text-white rounded-lg hover:bg-[#159e6a] transition-colors">
                  Set Operating Hours
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#225F91]" />
                Change Password
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1ABA7F] focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-[#225F91] text-white rounded-lg hover:bg-[#1A4971] transition-colors font-semibold"
                >
                  Change Password
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Verification</span>
                <StatusBadge status={profile.pharmacy.status} />
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Delivery</span>
                <span className={`text-sm font-semibold ${profile.pharmacy.deliveryAvailability ? 'text-green-600' : 'text-gray-400'}`}>
                  {profile.pharmacy.deliveryAvailability ? 'Available' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl border-2 border-blue-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Contact support if you need assistance with your profile or account settings.
            </p>
            <button className="w-full px-4 py-2 bg-white text-[#225F91] rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-200">
              Contact Support
            </button>
          </div>
        </div>
      </div>
   </div>
  );
}
