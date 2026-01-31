
import { Pill, Clock, CalendarCheck } from 'lucide-react';
import BackButton from '../components/BackButton';

function Medications() {

    const medications = [
        {
            id: 1,
            name: 'Lisinopril',
            dosage: '10mg',
            frequency: 'Once daily',
            time: 'Morning',
            refills: 2,
            doctor: 'Dr. Arun Kumar'
        },
        {
            id: 2,
            name: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            time: 'With meals',
            refills: 1,
            doctor: 'Dr. Ravi Verma'
        },
        {
            id: 3,
            name: 'Atorvastatin',
            dosage: '20mg',
            frequency: 'Once daily',
            time: 'Bedtime',
            refills: 3,
            doctor: 'Dr. Arun Kumar'
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <BackButton />

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <Pill className="w-8 h-8 text-orange-500" />
                        My Medications
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Track your prescriptions and refills</p>
                </div>

                <div className="space-y-4">
                    {medications.map((med) => (
                        <div key={med.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl">
                                    <Pill className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{med.name} <span className="text-sm font-normal text-slate-500 ml-1">{med.dosage}</span></h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Prescribed by {med.doctor}</p>
                                    <div className="flex flex-wrap gap-3">
                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                            <Clock className="w-3 h-3 mr-1.5" />
                                            {med.frequency}
                                        </span>
                                        <span className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                                            <CalendarCheck className="w-3 h-3 mr-1.5" />
                                            {med.refills} refills left
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-orange-500/20">
                                Refill Request
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Medications;
