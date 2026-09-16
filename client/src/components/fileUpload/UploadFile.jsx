import { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";


function UploadFile() {

    const [file, setFile] = useState(null);
    const [isFileUploading, setIsFileUploading] = useState(false);

    const uploadSelectedFile = async (event) => {
        const selectedFile = event.target.files[0];

        if (!selectedFile) return;

        if (selectedFile.type !== "application/pdf") {
            toast.error("Please select a .pdf file only!");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await fetch(
                "http://localhost:5000/api/medical-documents/upload",
                {
                    method: "POST",
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Upload failed");
            }

            toast.success("PDF uploaded successfully!");
            console.log("S3 upload:", data);
        } catch (error) {
            console.error("Upload error:", error);
            toast.error(error.message);
        }
    };

    useEffect(() => {

        if (file) {

            setIsFileUploading(true);

            // Send the file to the backend
            const formData = new FormData();
            formData.append("file", file);

            try {

                fetch("http://localhost:5000/api/upload-files", {
                    method: "POST",
                    body: formData,
                });
            } catch (error) {
                toast.error("Error uploading file: " + error.message);
            } finally {
                setIsFileUploading(false);
            }
        }
    }, [file]);

    return (
        <div>
            <input type="file" onChange={uploadSelectedFile} />
            <ToastContainer />
        </div>
    )
}

export default UploadFile;