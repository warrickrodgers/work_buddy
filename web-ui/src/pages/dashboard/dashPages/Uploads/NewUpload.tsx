"use client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dropzone,
  DropZoneArea,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneTrigger,
  useDropzone,
} from "@/components/ui/dropzone";
import { CloudUploadIcon, Trash2Icon } from "lucide-react";
import api from "@/lib/api"

function NewUploadInsetPage() {
  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        status: "success",
        result: URL.createObjectURL(file),
      };
    },
    validation: {
      accept: {
        "application/pdf": [".pdf"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
        "text/plain": [".txt"],
      },
      maxSize: 5 * 1024 * 1024,
      maxFiles: 10,
    },
  });

  const handleUpload = async () => {
    if(!dropzone.fileStatuses || dropzone.fileStatuses?.length !== 0) {
      const formData = new FormData();
      const filesToUpload = dropzone.fileStatuses.map((fileStatus) => fileStatus.file);
      filesToUpload.forEach((file) => {
        formData.append('files', file);
      });
      api.post('/api/file-upload', {
        body: formData,
      })
        .then((response) => response.data())
        .then((data) => console.log(data))
        .catch((error) => console.error('Error uploading files:', error));
    }
    else {
      console.error('Nothing to upload')
    }
  }

  return (
    <div className="min-h-screen flex space-y-4 items-center justify-center">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Upload up to <b>10</b> files smaller than <b>5MB</b> each to help the AI model develop the training plan. 
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dropzone {...dropzone}>
            <div>
              <div className="flex justify-between">
                <DropzoneMessage />
              </div>
              <DropZoneArea className="border-dashed">
                <DropzoneTrigger className="flex flex-col items-center gap-4 bg-transparent p-10 text-center text-sm">
                  <CloudUploadIcon className="size-8" />
                  <div>
                    <p className="font-semibold">Upload files</p>
                    <p className="text-sm text-muted-foreground">
                      Click here or drag and drop to upload
                    </p>
                  </div>
                </DropzoneTrigger>
              </DropZoneArea>
            </div>
  
            <DropzoneFileList className="grid gap-3 p-0 md:grid-cols-2 lg:grid-cols-3">
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.result}
                      alt={`uploaded-${file.fileName}`}
                      className="aspect-video object-cover"
                    />
                  )}
                  <div className="flex items-center justify-between p-2 pl-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <DropzoneRemoveFile>
                      <Trash2Icon className="size-4 primary-foreground" />
                    </DropzoneRemoveFile>
                  </div>
                </DropzoneFileListItem>
              ))}
            </DropzoneFileList>
          </Dropzone>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button variant="outline" onClick={handleUpload} className="w-30">
            Upload
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NewUploadInsetPage