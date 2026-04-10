import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { Download, FileText, Loader2, Upload } from 'lucide-react';

import BackButton from '../components/BackButton';

const API_BASE_URL = 'http://127.0.0.1:8000';
const REQUEST_TIMEOUT_MS = 20000;

type MedicalDocument = {
    id: string;
    filename: string;
    content_type?: string;
    size?: number;
    uploaded_at?: string;
};

function formatFileSize(size?: number) {
    if (!size || size < 1024) {
        return `${size || 0} B`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadedAt(value?: string) {
    if (!value) {
        return 'Unknown date';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

async function requestJson(url: string, options: RequestInit = {}) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        if (!response.ok) {
            throw new Error(data?.detail || data?.message || 'Request failed');
        }

        return data;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('Request timed out. Please check that the backend and MongoDB are running.');
        }

        throw error;
    } finally {
        window.clearTimeout(timeoutId);
    }
}

function MedicalHistory() {
    const role = localStorage.getItem('userRole') || 'patient';
    const isFamilyView = role === 'family';
    const [documents, setDocuments] = useState<MedicalDocument[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const loadDocuments = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again to access uploaded documents.');
            setLoading(false);
            return;
        }

        try {
            const data = await requestJson(`${API_BASE_URL}/medical-documents`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setDocuments(Array.isArray(data) ? (data as MedicalDocument[]) : []);
            setError('');
        } catch (loadError) {
            console.error('Failed to load medical documents:', loadError);
            setError(loadError instanceof Error ? loadError.message : 'Unable to load uploaded documents.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSuccessMessage('');
        setError('');
        setSelectedFile(event.target.files?.[0] || null);
    };

    const handleUpload = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again to upload documents.');
            return;
        }

        if (!selectedFile) {
            setError('Choose a file before uploading.');
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        setUploading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch(`${API_BASE_URL}/medical-documents`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const text = await response.text();
            const data = text ? JSON.parse(text) : null;

            if (!response.ok) {
                throw new Error(data?.detail || data?.message || 'Upload failed');
            }

            setSuccessMessage(`${selectedFile.name} uploaded successfully.`);
            setSelectedFile(null);
            const fileInput = document.getElementById('medical-document-file') as HTMLInputElement | null;
            if (fileInput) {
                fileInput.value = '';
            }
            await loadDocuments();
        } catch (uploadError) {
            console.error('Failed to upload document:', uploadError);
            setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload the document.');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (documentRecord: MedicalDocument) => {
        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again to download documents.');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/medical-documents/${documentRecord.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const text = await response.text();
                const data = text ? JSON.parse(text) : null;
                throw new Error(data?.detail || data?.message || 'Download failed');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = window.document.createElement('a');
            link.href = url;
            link.download = documentRecord.filename;
            window.document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (downloadError) {
            console.error('Failed to download document:', downloadError);
            setError(downloadError instanceof Error ? downloadError.message : 'Unable to download the document.');
        }
    };

    const pageSubtitle = isFamilyView
        ? 'View and upload prescription or report files for the linked patient.'
        : 'Upload and keep prescription or report files for later reference.';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <BackButton />

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                        <FileText className="w-8 h-8 text-pink-500" />
                        Medical Documents
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">{pageSubtitle}</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                        {successMessage}
                    </div>
                )}

                <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Upload a document</h2>
                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                        Accepted formats: PDF, JPG, JPEG, PNG. Maximum size: 10 MB.
                    </p>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <input
                            id="medical-document-file"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-pink-100 file:px-4 file:py-2 file:font-medium file:text-pink-700 hover:file:bg-pink-200 disabled:opacity-70 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200"
                        />
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={uploading || !selectedFile}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-500 px-5 py-3 font-semibold text-white shadow-lg shadow-pink-500/20 transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                            {uploading ? 'Uploading...' : 'Upload'}
                        </button>
                    </div>

                    {selectedFile && (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Selected: <span className="font-medium text-slate-700 dark:text-slate-200">{selectedFile.name}</span>
                        </p>
                    )}
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Saved documents</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {documents.length === 1 ? '1 file uploaded' : `${documents.length} files uploaded`}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-500 dark:text-slate-400">Loading documents...</div>
                    ) : documents.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
                            <FileText className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                            <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">No documents uploaded yet</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Upload prescriptions, reports, or scans so they are easy to keep and download later.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((documentRecord) => (
                                <div
                                    key={documentRecord.id}
                                    className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/40 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{documentRecord.filename}</p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                            {formatUploadedAt(documentRecord.uploaded_at)} | {formatFileSize(documentRecord.size)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDownload(documentRecord)}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MedicalHistory;
