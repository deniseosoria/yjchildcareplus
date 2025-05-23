const Certificate = require('../models/certificateModel');
const { cloudinary } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

// @desc    Generate certificate for a student
// @route   POST /api/admin/certificates/generate
// @access  Private/Admin
const generateCertificate = async (req, res) => {
    try {
        const { user_id, class_id, certificate_name } = req.body;

        if (!user_id || !class_id || !certificate_name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const certificate = await Certificate.createCertificate({
            user_id,
            class_id,
            certificate_name,
            certificate_url: null,
            metadata: { generated_by: req.user.id }
        });

        await Certificate.generateCertificate(certificate.id);
        
        res.json({
            message: 'Certificate generated successfully',
            certificate: {
                ...certificate,
                download_url: `/api/admin/certificates/${certificate.id}/download`
            }
        });
    } catch (error) {
        console.error('Generate certificate error:', error);
        res.status(500).json({ error: 'Failed to generate certificate' });
    }
};

// @desc    Generate certificates for all approved students in a class
// @route   POST /api/admin/certificates/generate-class/:classId
// @access  Private/Admin
const generateClassCertificates = async (req, res) => {
    try {
        const { classId } = req.params;
        const certificates = await Certificate.generateClassCertificates(classId);
        
        res.json({
            message: 'Certificates generated successfully',
            certificates: certificates.map(cert => ({
                ...cert,
                download_url: `/api/admin/certificates/${cert.id}/download`
            }))
        });
    } catch (error) {
        console.error('Generate class certificates error:', error);
        res.status(500).json({ error: 'Failed to generate class certificates' });
    }
};

// @desc    Download certificate
// @route   GET /api/admin/certificates/:id/download
// @access  Private/Admin
const downloadCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await Certificate.getCertificateById(id);
        
        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        if (!certificate.certificate_url) {
            // Generate certificate if it doesn't exist
            await Certificate.generateCertificate(id);
        }

        const certificatePath = path.join(__dirname, '..', certificate.certificate_url);
        res.download(certificatePath, `${certificate.certificate_name}.pdf`);
    } catch (error) {
        console.error('Download certificate error:', error);
        res.status(500).json({ error: 'Failed to download certificate' });
    }
};

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:code
// @access  Public
const verifyCertificate = async (req, res) => {
    try {
        const { code } = req.params;
        const certificate = await Certificate.verifyCertificate(code);
        
        if (!certificate) {
            return res.status(404).json({ error: 'Invalid certificate code' });
        }

        res.json({
            valid: true,
            certificate: {
                name: `${certificate.first_name} ${certificate.last_name}`,
                class_title: certificate.class_title,
                issue_date: certificate.issue_date
            }
        });
    } catch (error) {
        console.error('Verify certificate error:', error);
        res.status(500).json({ error: 'Failed to verify certificate' });
    }
};

// @desc    Get user certificates
// @route   GET /api/admin/certificates/user/:userId
// @access  Private/Admin
const getUserCertificates = async (req, res) => {
    try {
        const { userId } = req.params;
        const certificates = await Certificate.getCertificatesByUserId(userId);
        
        res.json(certificates.map(cert => ({
            ...cert,
            download_url: `/api/admin/certificates/${cert.id}/download`
        })));
    } catch (error) {
        console.error('Get user certificates error:', error);
        res.status(500).json({ error: 'Failed to get user certificates' });
    }
};

// @desc    Delete certificate
// @route   DELETE /api/admin/certificates/:id
// @access  Private/Admin
const deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await Certificate.getCertificateById(id);
        
        if (!certificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        // Delete the PDF file if it exists
        if (certificate.certificate_url) {
            const certificatePath = path.join(__dirname, '..', certificate.certificate_url);
            if (fs.existsSync(certificatePath)) {
                fs.unlinkSync(certificatePath);
            }
        }

        await Certificate.deleteCertificate(id, certificate.user_id);
        res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
        console.error('Delete certificate error:', error);
        res.status(500).json({ error: 'Failed to delete certificate' });
    }
};

/**
 * Upload a certificate for a student
 * @route POST /api/certificates/upload/:studentId
 * @access Private (Admin only)
 */
const uploadStudentCertificate = async (req, res) => {
    try {
        const { studentId } = req.params;
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const cert = await Certificate.uploadCertificate({
            user_id: studentId,
            class_id: req.body.class_id || null,
            certificate_name: file.originalname,
            file_path: file.path,
            file_type: file.mimetype,
            file_size: file.size,
            uploaded_by: req.user.id
        });

        res.status(201).json({ message: 'Certificate uploaded', certificate: cert });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
};

/**
 * View a student's certificate
 * @route GET /api/certificates/view/:studentId
 * @access Private
 */
const viewStudentCertificate = async (req, res) => {
    try {
        const { studentId } = req.params;
        const userId = req.user.id;

        // Check if the user has permission to view this certificate
        const isAdmin = req.user.role === 'admin';
        const isOwnCertificate = userId === studentId;

        if (!isAdmin && !isOwnCertificate) {
            return res.status(403).json({ 
                error: 'Not authorized',
                details: 'You do not have permission to view this certificate'
            });
        }

        // Fetch the certificate from database
        const certificate = await Certificate.findOne({
            where: { 
                user_id: studentId,
                status: 'active'
            },
            order: [['upload_date', 'DESC']] // Get the most recent certificate
        });

        if (!certificate) {
            return res.status(404).json({ 
                error: 'Certificate not found',
                details: 'No active certificate found for this student'
            });
        }

        // Return the certificate data
        res.json({
            certificate: {
                id: certificate.id,
                name: certificate.certificate_name,
                url: certificate.certificate_url,
                type: certificate.file_type,
                size: certificate.file_size,
                uploadDate: certificate.upload_date,
                status: certificate.status,
                metadata: certificate.metadata
            }
        });
    } catch (error) {
        console.error('Error viewing certificate:', error);
        
        if (error.name === 'SequelizeDatabaseError') {
            return res.status(500).json({
                error: 'Database error',
                details: 'Error retrieving certificate information'
            });
        }

        res.status(500).json({ 
            error: 'Error retrieving certificate',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// Get all certificates
const getAllCertificates = async (req, res) => {
    try {
        const certs = await Certificate.getAllCertificates();
        res.json(certs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch certificates', details: error.message });
    }
};

// Get certificate by ID
const getCertificateById = async (req, res) => {
    try {
        const cert = await Certificate.getCertificateById(req.params.id);
        if (!cert) return res.status(404).json({ error: 'Certificate not found' });
        res.json(cert);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch certificate', details: error.message });
    }
};

// Get certificates by user ID
const getCertificatesByUserId = async (req, res) => {
    try {
        const certs = await Certificate.getCertificatesByUserId(req.params.userId);
        res.json(certs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user certificates', details: error.message });
    }
};

module.exports = {
    generateCertificate,
    generateClassCertificates,
    downloadCertificate,
    verifyCertificate,
    getUserCertificates,
    deleteCertificate,
    uploadStudentCertificate,
    viewStudentCertificate,
    getAllCertificates,
    getCertificateById,
    getCertificatesByUserId
}; 