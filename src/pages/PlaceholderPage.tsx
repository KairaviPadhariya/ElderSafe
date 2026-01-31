import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';

function PlaceholderPage() {
    const location = useLocation();
    const title = location.pathname.split('/')[1].replace('-', ' ').toUpperCase();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8">
            <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-full mb-6">
                <Construction className="w-16 h-16 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {title || 'Page'} Under Construction
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md text-center">
                This feature is currently being developed. Check back soon for updates!
            </p>
        </div>
    );
}

export default PlaceholderPage;
