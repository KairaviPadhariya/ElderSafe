import { X, User, Mail, Phone, MapPin, AlertCircle, LogOut } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  role: string;
}

function ProfilePanel({ isOpen, onClose, role }: ProfilePanelProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    onClose();
    navigate('/login');
  };

  const profileInfo = useMemo(() => {
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
          name: 'Savitri Devi',
          role: 'Patient',
          email: 'savitri.devi@email.com',
          phone: '+1 (555) 123-4567',
          address: '123 Oak Street, Springfield, IL 62701',
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
  }, [role]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      ></div>

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-gray-700" />
              <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                {profileInfo.name}
              </h3>
              <p className="text-gray-600 font-medium">{profileInfo.role}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Contact Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{profileInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{profileInfo.phone}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                    <span className="text-gray-700">{profileInfo.address}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  {role === 'doctor' ? 'Professional Details' : 'Other Details'}
                </h4>
                <div className="space-y-2">
                  {Object.entries(profileInfo.details).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-gray-500 w-24">{key}:</span>
                      <span className="text-gray-700 font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {profileInfo.emergencyContact && (
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Emergency Contact
                  </h4>
                  <div className="space-y-2">
                    <p className="text-gray-700 font-medium">
                      {profileInfo.emergencyContact.name}
                    </p>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">
                        {profileInfo.emergencyContact.phone}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-4">
                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                  Edit Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePanel;
