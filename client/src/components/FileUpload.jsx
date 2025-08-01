import React, { useState, useRef } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    IconButton
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Delete as DeleteIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon
} from '@mui/icons-material';
import { uploadUserFile } from '../services/certificateService';

const FileUpload = ({
    onUpload,
    userId,
    folder = 'general',
    title = 'Upload File',
    description = 'Drag and drop a file here, or click to select',
    disabled = false,
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
}) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    // File validation
    const validateFile = (selectedFile) => {
        // Check file type
        if (!allowedTypes.includes(selectedFile.type)) {
            setError(`Invalid file type. Please upload a ${allowedTypes.map(type => {
                if (type === 'application/pdf') return 'PDF';
                if (type === 'image/jpeg') return 'JPEG';
                if (type === 'image/png') return 'PNG';
                return type;
            }).join(', ')} file.`);
            return false;
        }

        // Check file size
        if (selectedFile.size > maxSize) {
            setError(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
            return false;
        }

        return true;
    };

    // Handle file selection
    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        setError('');

        if (!selectedFile) {
            return;
        }

        if (!validateFile(selectedFile)) {
            setFile(null);
            setPreview(null);
            return;
        }

        setFile(selectedFile);

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            // For PDFs, show a PDF icon
            setPreview('pdf');
        }
    };

    // Handle file removal
    const handleRemoveFile = () => {
        setFile(null);
        setPreview(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle drag and drop
    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const droppedFile = event.dataTransfer.files[0];
        if (!droppedFile) return;

        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(droppedFile);
        fileInputRef.current.files = dataTransfer.files;

        handleFileSelect({ target: { files: dataTransfer.files } });
    };

    // Handle upload
    const handleUpload = async () => {
        if (!file || !userId) return;

        setLoading(true);
        setError('');

        try {
            const result = await uploadUserFile(file, userId, folder);

            if (onUpload) {
                onUpload(result);
            }

            // Clear the form after successful upload
            handleRemoveFile();
        } catch (error) {
            setError(error.message || 'Upload failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper
            elevation={2}
            sx={{
                p: 3,
                maxWidth: 600,
                mx: 'auto',
                my: 2
            }}
        >
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Upload Area */}
            <Box
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                sx={{
                    border: '2px dashed',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'action.hover',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.7 : 1,
                    '&:hover': {
                        bgcolor: disabled ? 'action.hover' : 'action.selected'
                    }
                }}
                onClick={() => !disabled && fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept={allowedTypes.map(type => {
                        if (type === 'application/pdf') return '.pdf';
                        if (type === 'image/jpeg') return '.jpg,.jpeg';
                        if (type === 'image/png') return '.png';
                        return '';
                    }).join(',')}
                    style={{ display: 'none' }}
                    disabled={disabled}
                />

                {!file ? (
                    <>
                        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                        <Typography variant="body1" gutterBottom>
                            {description}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Supported formats: {allowedTypes.map(type => {
                                if (type === 'application/pdf') return 'PDF';
                                if (type === 'image/jpeg') return 'JPEG';
                                if (type === 'image/png') return 'PNG';
                                return type;
                            }).join(', ')} (max {maxSize / (1024 * 1024)}MB)
                        </Typography>
                    </>
                ) : (
                    <Box sx={{ position: 'relative' }}>
                        {preview === 'pdf' ? (
                            <Box sx={{ textAlign: 'center' }}>
                                <PdfIcon sx={{ fontSize: 64, color: 'error.main' }} />
                                <Typography variant="body1" sx={{ mt: 1 }}>
                                    {file.name}
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ position: 'relative', display: 'inline-block' }}>
                                <img
                                    src={preview}
                                    alt="File preview"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: 200,
                                        borderRadius: 4
                                    }}
                                />
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    {file.name}
                                </Typography>
                            </Box>
                        )}
                        <IconButton
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile();
                            }}
                            sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                bgcolor: 'background.paper',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Box>
                )}
            </Box>

            {/* Upload Button */}
            {file && !disabled && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <Button
                        variant="contained"
                        onClick={handleUpload}
                        disabled={loading || disabled}
                        startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
                    >
                        {loading ? 'Uploading...' : 'Upload File'}
                    </Button>
                </Box>
            )}
        </Paper>
    );
};

export default FileUpload; 