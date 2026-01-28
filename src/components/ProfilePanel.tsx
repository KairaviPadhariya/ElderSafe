import { X, User, Mail, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function ProfilePanel({ isOpen, onClose }: ProfilePanelProps) {
  const patientInfo = {
    name: 'Margaret Smith',
    age: 72,
    email: 'margaret.smith@email.com',
    phone: '+1 (555) 123-4567',
    address: '123 Oak Street, Springfield, IL 62701',
    bloodType: 'O+',
    emergencyContact: {
      name: 'John Smith (Son)',
      phone: '+1 (555) 987-6543',
    },
  };

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
                {patientInfo.name}
              </h3>
              <p className="text-gray-600">{patientInfo.age} years old</p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Contact Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{patientInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">{patientInfo.phone}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                    <span className="text-gray-700">{patientInfo.address}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Medical Information
                </h4>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">
                    Blood Type: {patientInfo.bloodType}
                  </span>
                </div>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Emergency Contact
                </h4>
                <div className="space-y-2">
                  <p className="text-gray-700 font-medium">
                    {patientInfo.emergencyContact.name}
                  </p>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700">
                      {patientInfo.emergencyContact.phone}
                    </span>
                  </div>
                </div>
              </div>

              <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ProfilePanel;
