"use client"
import { Button } from "@/components/ui/button"
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dropzone,
  DropZoneArea,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneTrigger,
  useDropzone,
} from "@/components/ui/dropzone";
import { CloudUploadIcon, Trash2Icon, FileCheck2, FileX2 } from "lucide-react";
import api from "@/lib/api"

const DOCUMENT_TYPES = [
  { value: 'survey',   label: 'Survey' },
  { value: 'turnover', label: 'Turnover Report' },
  { value: 'policy',   label: 'Policy' },
  { value: 'report',   label: 'Report' },
  { value: 'custom',   label: 'Custom' },
];

function NewUploadInsetPage() {
  const navigate = useNavigate();
  const [uploading, setUploading]       = useState(false);
  const [documentType, setDocumentType] = useState<string>('custom');
  const [tagsInput, setTagsInput]       = useState('');
  const [error, setError]               = useState<string | null>(null);

  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      return { status: "success", result: URL.createObjectURL(file) };
    },
    validation: {
      accept: {
        "application/pdf":    [".pdf"],
        "text/csv":           [".csv"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "text/markdown":      [".md"],
        "text/plain":         [".txt"],
      },
      maxSize: 20 * 1024 * 1024,
      maxFiles: 1,
    },
  });

  const handleUpload = async () => {
    setError(null);
    const fileStatus = dropzone.fileStatuses[0];
    if (!fileStatus) return;

    setUploading(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const formData = new FormData();
      formData.append('file', fileStatus.file);
      formData.append('document_type', documentType);
      if (tags.length > 0) formData.append('tags', tags.join(','));

      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/dashboard/uploads');
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? 'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Document</h1>

      <Card className="nm-raised border-0">
        <CardHeader>
          <CardTitle>New Document</CardTitle>
          <CardDescription>
            Upload a PDF, CSV, DOCX, Markdown, or plain-text file (max 20 MB).
            Simon will use it to ground his coaching in your organisation's context.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="document-type">Document type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type" className="nm-inset border-0">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map(dt => (
                  <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">
              Tags{' '}
              <span className="text-muted-foreground text-xs">(optional, comma-separated)</span>
            </Label>
            <Input
              id="tags"
              className="nm-inset border-0"
              placeholder="e.g. Q1, engineering, 2024"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
            />
          </div>

          <Dropzone {...dropzone}>
            <div>
              <DropzoneMessage />
              <DropZoneArea className="border-dashed">
                <DropzoneTrigger className="flex flex-col items-center gap-4 bg-transparent p-10 text-center text-sm">
                  <CloudUploadIcon className="size-8" />
                  <div>
                    <p className="font-semibold">Drop file here or click to browse</p>
                    <p className="text-sm text-muted-foreground">
                      PDF, CSV, DOCX, MD, TXT — up to 20 MB
                    </p>
                  </div>
                </DropzoneTrigger>
              </DropZoneArea>
            </div>

            <DropzoneFileList className="mt-3 grid gap-3 p-0">
              {dropzone.fileStatuses.map((file) => (
                <DropzoneFileListItem
                  className="overflow-hidden rounded-md bg-secondary p-0 shadow-sm"
                  key={file.id}
                  file={file}
                >
                  {file.status === "pending" && (
                    <div className="aspect-video animate-pulse bg-black/20" />
                  )}
                  {file.status === "success" && (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <FileCheck2 className="w-6 h-6" />
                    </div>
                  )}
                  {file.status === "error" && (
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      <FileX2 className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex items-center justify-between p-2 pl-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <DropzoneRemoveFile>
                      <Trash2Icon className="size-4" />
                    </DropzoneRemoveFile>
                  </div>
                </DropzoneFileListItem>
              ))}
            </DropzoneFileList>
          </Dropzone>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleUpload}
            disabled={uploading || dropzone.fileStatuses.length === 0}
            className="w-full"
          >
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default NewUploadInsetPage;
