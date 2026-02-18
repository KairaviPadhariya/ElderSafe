
import { Stethoscope, Phone, Mail } from 'lucide-react';
import BackButton from '../components/BackButton';

function Doctors() {

    const doctors = [
        {
            id: 1,
            name: 'Dr. Arun Kumar',
            specialty: 'Cardiologist',
            hospital: 'Heart Care Center',
            phone: '+1 (555) 123-4567',
            email: 'dr.arunk@heartcare.com',
            image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300'
        },
        {
            id: 2,
            name: 'Dr. Anjali Singh',
            specialty: 'General Practitioner',
            hospital: 'City Medical Plaza',
            phone: '+1 (555) 987-6543',
            email: 'dr.anjali@citymed.com',
            image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300'
        },
        {
            id: 3,
            name: 'Dr. Ravi Verma',
            specialty: 'Endocrinologist',
            hospital: 'General Hospital',
            phone: '+1 (555) 456-7890',
            email: 'dr.ravi@hospital.com',
            image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
            <div className="max-w-5xl mx-auto">
                <BackButton />

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <Stethoscope className="w-8 h-8 text-cyan-500" />
                        My Doctors
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Your healthcare team</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((doc) => (
                        <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
                            <div className="flex flex-col items-center text-center">
                                <img
                                    src={doc.image}
                                    alt={doc.name}
                                    className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-slate-50 dark:border-slate-700 group-hover:border-cyan-100 dark:group-hover:border-cyan-900/50 transition-colors"
                                />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{doc.name}</h3>
                                <p className="text-cyan-600 dark:text-cyan-400 font-medium text-sm mb-1">{doc.specialty}</p>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{doc.hospital}</p>

                                <div className="w-full space-y-3">
                                    <button className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                                        <Phone className="w-4 h-4" />
                                        Call Clinic
                                    </button>
                                    <button className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                                        <Mail className="w-4 h-4" />
                                        Send Message
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Doctors;
