import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DownloadIcon, FileIcon } from 'lucide-react';
import React, { Suspense, useEffect, useState } from 'react';
import { Outlet, BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import api from "@/lib/api"

interface FileInfo {
  name: string
  size: string
  uploadedAt: string
}

function UploadsInsetPage() {
  const [files, setFiles] = useState<FileInfo[]>([])

  useEffect(() => {
    const fetchFiles = async () => {
      const res = await api.get("/uploads/file-upload/2")
      const data = await res.data
      console.log(data)
      setFiles(data)
    }
    fetchFiles()
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Documents</h1>

      {files.length === 0 ? (
        <p className="text-muted-foreground">No files uploaded yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <Card key={file.name} className="flex flex-col justify-between">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <FileIcon className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium truncate">
                    {file.name}
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="text-sm text-muted-foreground">
                <p>Uploaded: {file.uploadedAt}</p>
                <p>Size: {file.size}</p>
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/uploads/${file.name}`, "_blank")}
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
};

export default UploadsInsetPage