// Use window-scoped variables to avoid redeclaration issues
window.currentPatientId = null;
window.prescriptionModalInstance = null;
let prescriptionPatients = []; // Store patients with prescriptions

// Initialize prescription functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize bootstrap modal
    const prescriptionModal = document.getElementById('prescriptionModal');
    if (prescriptionModal) {
        window.prescriptionModalInstance = new bootstrap.Modal(prescriptionModal, {
            backdrop: 'static',
            keyboard: false
        });
    }
    
    // Setup search functionality
    setupPrescriptionSearch();

    // Load patients when the prescription section is shown
    const generatePrescriptionLink = document.getElementById('generatePrescriptionLink');
    const generatePrescriptionLinkMobile = document.getElementById('generatePrescriptionLinkMobile');
    
    if (generatePrescriptionLink) {
        generatePrescriptionLink.addEventListener('click', () => {
            loadPatientsForPrescription();
            setupPrescriptionSearch();
        });
    }
    if (generatePrescriptionLinkMobile) {
        generatePrescriptionLinkMobile.addEventListener('click', () => {
            loadPatientsForPrescription();
            setupPrescriptionSearch();
        });
    }
});

// Setup search functionality
function setupPrescriptionSearch() {
    const searchInput = document.getElementById('prescriptionPatientSearch');
    if (searchInput) {
        // Remove existing listeners
        searchInput.removeEventListener('input', handleSearchInput);
        searchInput.removeEventListener('keyup', handleSearchInput);
        
        // Add new listeners
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keyup', handleSearchInput);
    }
}

// Handle search input
function handleSearchInput(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    filterPrescriptionPatients(searchTerm);
}

// Make loadPatientsForPrescription available globally
window.loadPatientsForPrescription = async function() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/patients', {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch patients');
        }

        const patients = await response.json();
        // Filter patients who have been consulted but not billed yet
        prescriptionPatients = patients.filter(p => p.services && p.services.length > 0 && !p.isBilled);
        displayPatientsForPrescription(prescriptionPatients);
    } catch (error) {
        console.error('Error loading patients:', error);
        showError('Failed to load patients. Please try again.');
    }
}

// Display patients in the prescription table
function displayPatientsForPrescription(patients) {
    const tbody = document.getElementById('prescriptionPatientsList');
    const noResultsDiv = document.getElementById('noPrescriptionResults');

    if (!patients || patients.length === 0) {
        tbody.innerHTML = '';
        noResultsDiv.style.display = 'block';
        return;
    }

    noResultsDiv.style.display = 'none';
    tbody.innerHTML = patients.map(patient => {
        const consultationDate = new Date(patient.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <tr>
                <td>${patient.name || ''}</td>
                <td>${consultationDate}</td>
                <td>${patient.doctorName || 'N/A'}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="window.viewPrescription('${patient._id}')">
                        <i class="bi bi-file-earmark-medical"></i> View Prescription
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Filter prescription patients based on search term
function filterPrescriptionPatients(searchTerm) {
    if (!prescriptionPatients || prescriptionPatients.length === 0) {
        displayPatientsForPrescription([]);
        return;
    }

    const filteredPatients = prescriptionPatients.filter(patient => {
        const patientName = (patient.name || '').toLowerCase();
        const doctorName = (patient.doctorName || '').toLowerCase();
        const consultationDate = new Date(patient.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).toLowerCase();

        return patientName.includes(searchTerm) ||
               doctorName.includes(searchTerm) ||
               consultationDate.includes(searchTerm);
    });

    displayPatientsForPrescription(filteredPatients);
}

// Show error message
function showError(message) {
    const tbody = document.getElementById('prescriptionPatientsList');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-danger">
                <i class="bi bi-exclamation-triangle"></i> ${message}
            </td>
        </tr>
    `;
}

// Make viewPrescription function globally available
window.viewPrescription = async function(patientId) {
    try {
        window.currentPatientId = patientId;
        const token = localStorage.getItem('token');
        const response = await fetch(`/history/${patientId}/prescription-report`, {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch prescription');
        }

        const prescriptionData = await response.json();
        
        // First update the content
        displayPrescription(prescriptionData);
        
        // Then show the modal using Bootstrap's method
        const prescriptionModal = new bootstrap.Modal(document.getElementById('prescriptionModal'));
        prescriptionModal.show();
    } catch (error) {
        console.error('Error viewing prescription:', error);
        alert('Failed to load prescription. Please try again.');
    }
}

// Display prescription in modal
function displayPrescription(prescriptionData) {
    const prescriptionContent = document.getElementById('prescriptionContent');
    if (!prescriptionContent) {
        console.error('Prescription content element not found');
        return;
    }
    
    const visitDate = new Date(prescriptionData.visitDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    prescriptionContent.innerHTML = `
        <div class="prescription-container">
            <div class="text-center mb-4">
                <h2 class="hospital-name" style="color: #34a853;">🏥 Healthcare Plus Clinic</h2>
                <p class="mb-0">123 Hospital Street, City</p>
                <p>Phone: (123) 456-7890</p>
                <hr>
                <h4 style="color: #34a853;">PRESCRIPTION</h4>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <h5 style="color: #34a853;">Patient Details:</h5>
                    <p class="mb-1"><strong>Name:</strong> ${prescriptionData.name}</p>
                    <p class="mb-1"><strong>Age:</strong> ${prescriptionData.age} years</p>
                    <p class="mb-1"><strong>Phone:</strong> ${prescriptionData.phoneNumber}</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <p class="mb-1"><strong>Visit Date:</strong> ${visitDate}</p>
                    <p class="mb-1"><strong>Doctor:</strong> Dr. ${prescriptionData.doctorName || 'Not Specified'}</p>
                </div>
            </div>

            <div class="clinical-info mb-4">
                <h5 style="color: #34a853;">Clinical Information:</h5>
                <div class="mb-3">
                    <strong>Symptoms:</strong>
                    <p>${prescriptionData.symptoms || 'None recorded'}</p>
                </div>
                <div class="mb-3">
                    <strong>Diagnosis:</strong>
                    <p>${prescriptionData.diagnosis || 'None recorded'}</p>
                </div>
            </div>

            <div class="medications mb-4">
                <h5 style="color: #34a853;">Prescribed Medications:</h5>
                ${prescriptionData.prescribedMedications ? `
                    <table class="table table-bordered">
                        <thead style="background-color: rgba(52, 168, 83, 0.1);">
                            <tr>
                                <th>Medication</th>
                                <th>Dosage</th>
                                <th>Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${prescriptionData.prescribedMedications.split('\n').map(med => {
                                const [name = '', dosage = '', duration = ''] = med.split(',').map(part => part.trim());
                                return `
                                    <tr>
                                        <td>${name}</td>
                                        <td>${dosage}</td>
                                        <td>${duration}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                ` : '<p class="text-muted">No medications prescribed</p>'}
            </div>

            <div class="row mt-4">
                <div class="col-md-8">
                    <p class="mb-0"><small>This is a computer-generated prescription, no signature required.</small></p>
                </div>
                <div class="col-md-4 text-end">
                    <p class="mb-0"><strong>Authorized Signatory</strong></p>
                </div>
            </div>
        </div>
    `;
}

// Print prescription
function printPrescription() {
    const prescriptionContent = document.getElementById('prescriptionContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Patient Prescription</title>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"/>
            <style>
                @media print {
                    body { padding: 20px; }
                    .prescription-container { max-width: 800px; margin: auto; }
                }
            </style>
        </head>
        <body>
            ${prescriptionContent}
            <script>
                window.onload = () => {
                    window.print();
                    window.onafterprint = () => window.close();
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
} 