import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { FileText, Loader2, Upload } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import BackButton from '../components/BackButton';
import { logActivitySafely } from '../utils/logging';

const API_BASE_URL = 'http://34.233.187.127:8000';
const REQUEST_TIMEOUT_MS = 20000;

type MedicalDocument = {
    id: string;
    filename: string;
    content_type?: string;
    size?: number;
    uploaded_at?: string;
};

type DocumentPreview = {
    url: string;
    contentType: string;
};

function inferContentType(filename: string, contentType?: string) {
    const normalizedContentType = (contentType || '').toLowerCase();

    if (normalizedContentType && normalizedContentType !== 'application/octet-stream') {
        return normalizedContentType;
    }

    const extension = filename.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'png':
            return 'image/png';
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'pdf':
            return 'application/pdf';
        default:
            return normalizedContentType || 'application/octet-stream';
    }
}

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

    const normalizedValue =
        /z$|[+-]\d{2}:\d{2}$/i.test(value) || !value.includes('T')
            ? value
            : `${value}Z`;

    const parsed = new Date(normalizedValue);
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
    const [searchParams] = useSearchParams();
    const role = localStorage.getItem('userRole') || 'patient';
    const isFamilyView = role === 'family';
    const isDoctorView = role === 'doctor';
    const selectedPatientId = searchParams.get('patientId') || '';
    const selectedPatientName = searchParams.get('patientName') || '';
    const [documents, setDocuments] = useState<MedicalDocument[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
    const [preview, setPreview] = useState<DocumentPreview | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        return () => {
            if (preview?.url) {
                window.URL.revokeObjectURL(preview.url);
            }
        };
    }, [preview]);

    const loadDocuments = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again to access uploaded documents.');
            setLoading(false);
            return;
        }

        try {
            const url = new URL(`${API_BASE_URL}/medical-documents`);

            if (isDoctorView && selectedPatientId) {
                url.searchParams.set('patient_id', selectedPatientId);
            }

            const data = await requestJson(url.toString(), {
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
    }, [isDoctorView, selectedPatientId]);

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

            await logActivitySafely({
                action: 'medical_document_uploaded',
                activity_type: 'medical_document',
                description: `${selectedFile.name} uploaded to medical documents.`,
                metadata: {
                    document_id: data?.id || null,
                    filename: selectedFile.name,
                    file_size: selectedFile.size,
                    file_type: selectedFile.type || null,
                    actor_role: role,
                    patient_id: isDoctorView ? selectedPatientId || null : null,
                    patient_name: isDoctorView ? selectedPatientName || null : null
                }
            });

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

    const handlePreviewDocument = async (documentRecord: MedicalDocument) => {
        const token = localStorage.getItem('token');

        if (!token) {
            setError('Please log in again to view documents.');
            return;
        }

        setPreviewLoading(true);
        setError('');
        setSelectedDocumentId(documentRecord.id);

        try {
<<<<<<< Updated upstream
            await fetch(`${API_BASE_URL}/medical-documents/${documentRecord.id}`, {
                ...(isDoctorView && selectedPatientId
                    ? { headers: { Authorization: `Bearer ${token}` } }
                    : { headers: { Authorization: `Bearer ${token}` } })
            });

=======
>>>>>>> Stashed changes
            const previewUrl = new URL(`${API_BASE_URL}/medical-documents/${documentRecord.id}`);
            if (isDoctorView && selectedPatientId) {
                previewUrl.searchParams.set('patient_id', selectedPatientId);
            }

            const previewResponse = await fetch(previewUrl.toString(), {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!previewResponse.ok) {
                const text = await previewResponse.text();
                const data = text ? JSON.parse(text) : null;
                throw new Error(data?.detail || data?.message || 'Preview failed');
            }

            const blob = await previewResponse.blob();
            const url = window.URL.createObjectURL(blob);
            setPreview((current) => {
                if (current?.url) {
                    window.URL.revokeObjectURL(current.url);
                }

                return {
                    url,
                    contentType: inferContentType(documentRecord.filename, blob.type || documentRecord.content_type)
                };
            });
        } catch (previewError) {
            console.error('Failed to preview document:', previewError);
            setError(previewError instanceof Error ? previewError.message : 'Unable to preview the document.');
            setSelectedDocumentId(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const pageSubtitle = isDoctorView
        ? `View uploaded documents for ${selectedPatientName || 'the selected patient'}.`
        : isFamilyView
        ? 'View and upload prescription or report files for the linked patient.'
        : 'Upload and keep prescription or report files for later reference.';

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 dark:bg-slate-900 sm:px-6 sm:py-8 lg:px-8 transition-colors duration-300">
            <div className="max-w-4xl mx-auto">
                <BackButton />

                <div className="mb-6 sm:mb-8">
                    <h1 className="mb-2 flex items-center gap-3 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                        <FileText className="h-7 w-7 text-pink-500 sm:h-8 sm:w-8" />
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

                <div className="mb-8 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
                    <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
                        {isDoctorView ? 'Patient documents' : 'Upload a document'}
                    </h2>
                    <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                        {isDoctorView
                            ? 'Open the patient records that have been uploaded and shared for review.'
                            : 'Accepted formats: PDF, JPG, JPEG, PNG. Maximum size: 10 MB.'}
                    </p>

                    {!isDoctorView && (
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
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pink-500 px-5 py-3 font-semibold text-white shadow-lg shadow-pink-500/20 transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                            >
                                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    )}

                    {!isDoctorView && selectedFile && (
                        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                            Selected: <span className="font-medium text-slate-700 dark:text-slate-200">{selectedFile.name}</span>
                        </p>
                    )}
                </div>

                <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
                                Upload prescriptions, reports, or scans so they are easy to open and review later.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((documentRecord) => (
                                <button
                                    type="button"
                                    key={documentRecord.id}
                                    onClick={() => handlePreviewDocument(documentRecord)}
                                    className={`flex w-full flex-col gap-4 rounded-2xl border p-4 text-left transition-colors sm:flex-row sm:items-center sm:justify-between ${
                                        selectedDocumentId === documentRecord.id
                                            ? 'border-pink-200 bg-pink-50 dark:border-pink-500/40 dark:bg-pink-500/10'
                                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-900/60'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-semibold text-slate-900 dark:text-white">{documentRecord.filename}</p>
                                        <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">
                                            {formatUploadedAt(documentRecord.uploaded_at)} | {formatFileSize(documentRecord.size)}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-pink-600 dark:text-pink-300">
                                        {selectedDocumentId === documentRecord.id ? 'Open below' : 'Click to view'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {(previewLoading || preview) && (
                    <div className="mt-8 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Document preview</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {previewLoading ? 'Opening document...' : 'Selected document is shown below.'}
                            </p>
                        </div>

                        {previewLoading ? (
                            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
                                <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                            </div>
                        ) : preview?.contentType.startsWith('image/') ? (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40">
                                <img
                                    src={preview.url}
                                    alt="Medical document preview"
                                    className="max-h-[720px] w-full object-contain"
                                />
                            </div>
                        ) : preview?.contentType === 'application/pdf' ? (
                            <iframe
                                title="Medical document preview"
                                src={preview.url}
                                className="h-[65vh] min-h-[420px] w-full rounded-2xl border border-slate-200 bg-white dark:border-slate-700 sm:h-[720px]"
                            />
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
                                <p className="text-slate-600 dark:text-slate-300">
                                    This file type cannot be previewed inline yet.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MedicalHistory;
