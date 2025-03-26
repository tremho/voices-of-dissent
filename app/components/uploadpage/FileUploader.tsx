import React, { useState } from "react";
import {FileShow} from "./FileShow";
import { Button, Typography, Paper } from "@mui/material";

export const FileUploader = ({ onFileSelect }: { onFileSelect: (file: File) => void }) => {
    const [dragging, setDragging] = useState(false);
    const [imageFile, setImageFile] = useState(null)
    const [audioFile, setAudioFile] = useState(null)

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = () => setDragging(false);

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);

        if (event.dataTransfer.files.length > 0) {
            const file:File = event.dataTransfer.files[0]
            console.log("onDrop")
            onFileSelect(file);
            console.log("onDrop2")
            console.log("handleFileSelect2", {type: file?.type})
            if(file?.type.startsWith('image/')) setImageFile(file)
            if(file?.type.startsWith('audio/')) setAudioFile(file)
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            const file:File = event.target.files[0]
            console.log("handleFileSelect", file)
            onFileSelect(file);
            console.log("handleFileSelect2", {type: file?.type})
            if(file?.type.startsWith('image/')) setImageFile(file)
            if(file?.type.startsWith('audio/')) setAudioFile(file)

        }
    };

    const dropZone:any = {
        backgroundColor: "aliceblue",
        width: "250px",
        height: "286px",
        padding: "10px",
        border: "1px dashed black",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
    }

    const hiddenFileInput:any = {
        visibility: "hidden"
    }
    const selectButton:any = {
        marginTop: "5px"
    }
    const instructs:any = {
        fontSize: "20px",
        marginTop: "20px",
        color: "blue"
    }


    return (
        <div style={dropZone}
            className={`border-2 border-dashed p-6 ${dragging ? "bg-gray-200" : "bg-gray-100"}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <p style={instructs}>Drag & drop a file here, or</p>

            {/* File Select Button */}
            <Button variant="contained" style={selectButton}
                onClick={(e) => {
                    e.stopPropagation(); // Prevent clicks from triggering outside elements
                    document.getElementById("fileInput")?.click();
                }}
                className="bg-blue-500 text-white p-2 rounded mt-2"
            >
                Select File
            </Button>

            {/* Hidden File Input */}
            <input style={hiddenFileInput}
                id="fileInput"
                type="file"
                // className="hidden"
                onChange={handleFileSelect}
            />
            {/* Other interactive elements remain functional */}
            <FileShow imageFile={imageFile} audioFile={audioFile}/>
        </div>
    );
};
