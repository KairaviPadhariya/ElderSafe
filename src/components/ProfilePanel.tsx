import { X, User, Mail, Phone, MapPin, AlertCircle, LogOut, Edit2 } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
}

type StoredProfile = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
};

function ProfilePanel({ isOpen, onClose, role }: ProfilePanelProps) {
  const navigate = useNavigate();
  const loggedInUserName = localStorage.getItem('userName') || 'User';
  const loggedInUserEmail = localStorage.getItem('userEmail') || '';
  const userProfileKey = useMemo(() => {
    const userIdentifier = (loggedInUserEmail || loggedInUserName || role)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_');

    return `profile_${role}_${userIdentifier}`;
  }, [loggedInUserEmail, loggedInUserName, role]);
  const legacyProfileKey = `profile_${role}`;
  const storedProfile =
    localStorage.getItem(userProfileKey) ?? localStorage.getItem(legacyProfileKey);
  const parsedStoredProfile = useMemo<StoredProfile>(() => {
    if (!storedProfile) {
      return {};
    }

    try {
      return JSON.parse(storedProfile) as StoredProfile;
    } catch (error) {
      console.error('Failed to parse stored profile:', error);
      return {};
    }
  }, [storedProfile]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    onClose();
    navigate('/login');
  };

  const initialProfile = useMemo(() => {
    switch (role) {
      case 'doctor':
        return {
          name: 'Dr. Arun Kumar',
          role: 'Cardiologist',
          email: 'arun.kumar@hospital.com',
          phone: '+1 (555) 999-8888',
          address: 'General Hospital, Cardiology Dept, Room 304',
          details: {
            'License No': 'MD-12345-CA',
            'Experience': '15 Years',
            'Hospital': 'City General Hospital',
          },
          emergencyContact: null
        };
      case 'family':
        return {
          name: 'Rajesh Kumar',
          role: 'Family Member (Son)',
          email: 'rajesh.k@email.com',
          phone: '+1 (555) 234-5678',
          address: '456 Pine Street, Springfield, IL 62702',
          details: {
            'Relation': 'Son',
            'Monitoring': 'Savitri Devi',
            'Access Level': 'Full Access',
          },
          emergencyContact: null
        };
      default: // patient
        return {
          name: parsedStoredProfile.name || loggedInUserName,
          role: 'Patient',
          email: parsedStoredProfile.email || loggedInUserEmail || 'Not provided',
          phone: parsedStoredProfile.phone || 'Not provided',
          address: parsedStoredProfile.address || 'Not provided',
          details: {
            'Blood Type': 'O+',
            'DOB': '1952-05-15',
          },
          emergencyContact: {
            name: 'Rahul Sharma (Son)',
            phone: '+1 (555) 987-6543',
          }
        };
    }
  }, [loggedInUserEmail, loggedInUserName, parsedStoredProfile, role]);

  const [displayProfile, setDisplayProfile] = useState(initialProfile);

  useEffect(() => {
    setDisplayProfile(initialProfile);
  }, [initialProfile]);

  const handleEditClick = () => {
    setEditFormData({
      name: displayProfile.name,
      email: displayProfile.email,
      phone: displayProfile.phone,
      address: displayProfile.address,
    });
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    localStorage.setItem('userName', editFormData.name);
    localStorage.setItem('userEmail', editFormData.email);
    localStorage.setItem(userProfileKey, JSON.stringify({
      name: editFormData.name,
      email: editFormData.email,
      phone: editFormData.phone,
      address: editFormData.address,
    }));
    setDisplayProfile(prev => ({
      ...prev,
      name: editFormData.name,
      email: editFormData.email,
      phone: editFormData.phone,
      address: editFormData.address
    }));
    setIsEditing(false);
    // Show success message
    alert('Profile updated successfully!');
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl z-50 transform transition-transform">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-gray-700 dark:text-slate-300" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!isEditing ? (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                    <User className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {displayProfile.name}
                  </h3>
                  <p className="text-gray-600 dark:text-slate-400 font-medium">{displayProfile.role}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Contact Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        <span className="text-gray-700 dark:text-slate-300">{displayProfile.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                        <span className="text-gray-700 dark:text-slate-300">{displayProfile.phone}</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-500 dark:text-slate-400 mt-1" />
                        <span className="text-gray-700 dark:text-slate-300">{displayProfile.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      {role === 'doctor' ? 'Professional Details' : 'Other Details'}
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(displayProfile.details).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-gray-500 dark:text-slate-400 w-24">{key}:</span>
                          <span className="text-gray-700 dark:text-slate-300 font-medium">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {displayProfile.emergencyContact && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-900/50">
                      <h4 className="font-semibold text-red-900 dark:text-red-400 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Emergency Contact
                      </h4>
                      <div className="space-y-2">
                        <p className="text-gray-700 dark:text-slate-300 font-medium">
                          {displayProfile.emergencyContact.name}
                        </p>
                        <div className="flex items-center gap-3">
                          <Phone className="w-5 h-5 text-gray-500 dark:text-slate-400" />
                          <span className="text-gray-700 dark:text-slate-300">
                            {displayProfile.emergencyContact.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                    <User className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Edit Profile
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Edit Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">Name</label>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">Email</label>
                        <input
                          type="email"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">Phone</label>
                        <input
                          type="tel"
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1">Address</label>
                        <textarea
                          value={editFormData.address}
                          onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                          className="w-full border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!isEditing && (
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleEditClick}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            )}

            {isEditing && (
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePanel;
