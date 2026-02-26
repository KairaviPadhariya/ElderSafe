import { useState } from 'react';
import BackButton from '../components/BackButton';

function Patients() {
  // mock patient list, could be retrieved from API
  const [patients] = useState<any[]>([
    { id: 1, name: 'Janvi Patel', lastVisit: '2026-02-26' },
    { id: 2, name: 'Robert Fox', lastVisit: '2026-02-26' },
    { id: 3, name: 'Esther Howard', lastVisit: '2026-02-26' },
    { id: 4, name: 'Savitri Sharma', lastVisit: '2026-02-20' },
  ]);

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BackButton />
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">My Patients</h2>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {patients.map((p) => (
            <li key={p.id} className="p-6 flex justify-between items-center">
              <span className="text-slate-900 dark:text-white font-medium">{p.name}</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm">Last visit: {p.lastVisit}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

export default Patients;