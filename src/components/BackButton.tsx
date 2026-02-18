import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function BackButton() {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/')}
            className="flex items-center text-slate-500 hover:text-emerald-600 transition-colors mb-6 font-medium"
        >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
        </button>
    );
}

export default BackButton;
