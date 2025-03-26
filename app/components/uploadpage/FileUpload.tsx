import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button, Typography, Paper } from "@mui/material";
import {FileShow} from './FileShow'

interface FileUploadProps {
    onFileUpload: (files: File[]) => void;
    acceptedTypes?: string;
    label: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, acceptedTypes, label }) => {
    const [imageFile, setImageFile] = useState(null)
    const [audioFile, setAudioFile] = useState(null)
    const onDrop = useCallback((acceptedFiles: File[]) => {
        console.log("onDrop", acceptedFiles)
        onFileUpload(acceptedFiles);
        const file:File = acceptedFiles[0]
        console.log("onDrop2", {type: file?.type})
        if(file?.type.startsWith('image/')) setImageFile(file)
        if(file?.type.startsWith('audio/')) setAudioFile(file)
    }, [onFileUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: acceptedTypes || "",
        multiple: false,
    } as any);


    return (
        <>
        <FileShow imageFile={imageFile} audioFile={audioFile}/>
    <Paper
            {...getRootProps()}
            sx={{
                padding: 3,
                textAlign: "center",
                border: "2px dashed #ccc",
                borderRadius: 2,
                cursor: "pointer",
                backgroundColor: isDragActive ? "#e3f2fd" : "#fafafa",
                transition: "background-color 0.3s",
            }}
        >

        <div>
        <input {...getInputProps()} />
            <Typography variant="body2">
                Drag & drop an image or audio file here, or click to select one.
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }}>Select File</Button>
        </div>
        </Paper>
        </>
    );
};

export default FileUpload;
