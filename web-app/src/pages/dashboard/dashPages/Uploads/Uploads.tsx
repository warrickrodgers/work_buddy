import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';

type IngestionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'FAILED';

interface IngestionDocument {
  id: string;
  filename: string;
  document_type: string;
  status: IngestionStatus;
  chunk_count: number;
  tags: string[];
  error_message: string | null;
  created_at: string;
}

const STATUS_BADGE: Record<IngestionStatus, { label: string; className: string }> = {
  PENDING:    { label: 'Pending',    className: 'bg-muted text-muted-foreground' },
  PROCESSING: { label: 'Processing', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  COMPLETE:   { label: 'Complete',   className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  FAILED:     { label: 'Failed',     className: 'bg-destructive/20 text-destructive' },
};

const DOC_TYPE_LABEL: Record<string, string> = {
  survey:   'Survey',
  turnover: 'Turnover',
  policy:   'Policy',
  report:   'Report',
  custom:   'Custom',
};

function relativeTime(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function StatusBadge({ status }: { status: IngestionStatus }) {
  const { label, className } = STATUS_BADGE[status] ?? STATUS_BADGE.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {status === 'PROCESSING' && <Loader2 className="size-3 animate-spin" />}
      {label}
    </span>
  );
}

function UploadsInsetPage() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<IngestionDocument[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents ?? []);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    const hasInProgress = documents.some(
      d => d.status === 'PENDING' || d.status === 'PROCESSING'
    );

    if (hasInProgress && !pollRef.current) {
      pollRef.current = setInterval(fetchDocuments, 3_000);
    } else if (!hasInProgress && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [documents]);

  const handleDelete = async (doc: IngestionDocument) => {
    if (!window.confirm(`Delete "${doc.filename}"? This cannot be undone.`)) return;
    setDeleting(doc.id);
    try {
      await api.delete(`/documents/${doc.id}`);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Loading documents…
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Button onClick={() => navigate('/dashboard/uploads/new-upload')} size="sm">
          <Plus className="mr-2 size-4" /> Upload
        </Button>
      </div>

      {documents.length === 0 ? (
        <Card className="nm-raised border-0">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileIcon className="mb-4 size-10 text-muted-foreground" />
            <p className="font-medium">No documents uploaded yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload a document and Simon will use it to inform his coaching.
            </p>
            <Button
              className="mt-6"
              onClick={() => navigate('/dashboard/uploads/new-upload')}
            >
              <Plus className="mr-2 size-4" /> Upload your first document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {documents.map(doc => (
            <Card key={doc.id} className="nm-raised border-0">
              <CardContent className="flex items-center gap-4 py-4">
                <FileIcon className="shrink-0 size-8 text-muted-foreground" />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{doc.filename}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">
                      {DOC_TYPE_LABEL[doc.document_type] ?? doc.document_type}
                    </span>
                    {doc.status === 'COMPLETE' && doc.chunk_count > 0 && (
                      <span>· {doc.chunk_count} chunk{doc.chunk_count !== 1 ? 's' : ''}</span>
                    )}
                    {doc.tags.length > 0 && (
                      <span>· {doc.tags.join(', ')}</span>
                    )}
                    <span>· {relativeTime(doc.created_at)}</span>
                  </div>
                  {doc.status === 'FAILED' && doc.error_message && (
                    <p className="mt-1 text-xs text-destructive truncate">{doc.error_message}</p>
                  )}
                </div>

                <StatusBadge status={doc.status} />

                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${doc.filename}`}
                  disabled={deleting === doc.id}
                  onClick={() => handleDelete(doc)}
                >
                  {deleting === doc.id
                    ? <Loader2 className="size-4 animate-spin" />
                    : <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default UploadsInsetPage;
