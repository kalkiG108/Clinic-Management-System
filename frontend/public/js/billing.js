// Use window-scoped variables to avoid redeclaration issues
window.currentPatientId = null;
window.billModalInstance = null;
let billablePatients = []; // Store patients for searching

// Initialize billing functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize bootstrap modal
    const billModal = document.getElementById('billModal');
    if (billModal) {
        window.billModalInstance = new bootstrap.Modal(billModal, {
            backdrop: 'static',
            keyboard: false
        });
    }
    
    // Setup search functionality
    setupBillingSearch();

    // Load patients when the bills section is shown
    const generateBillsLink = document.getElementById('generateBillsLink');
    const generateBillsLinkMobile = document.getElementById('generateBillsLinkMobile');
    
    if (generateBillsLink) {
        generateBillsLink.addEventListener('click', () => {
            loadPatientsForBilling();
            setupBillingSearch();
        });
    }
    if (generateBillsLinkMobile) {
        generateBillsLinkMobile.addEventListener('click', () => {
            loadPatientsForBilling();
            setupBillingSearch();
        });
    }
});

// Setup search functionality
function setupBillingSearch() {
    const searchInput = document.getElementById('billPatientSearch');
    if (!searchInput) return;

    // Clear existing value
    searchInput.value = '';
    
    // Remove any existing listeners to prevent duplicates
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    // Add the event listener
    newSearchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterBillablePatients(searchTerm);
    });
}

// Filter billable patients based on search term
function filterBillablePatients(searchTerm) {
    if (!billablePatients) {
        displayPatientsForBilling([]);
        return;
    }

    if (!searchTerm) {
        // If search is empty, show all patients
        displayPatientsForBilling(billablePatients);
        return;
    }

    const filteredPatients = billablePatients.filter(patient => {
        const searchableFields = [
            (patient.name || '').toLowerCase(),
            (patient.doctorName || '').toLowerCase(),
            new Date(patient.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).toLowerCase()
        ];

        // Return true if any field contains the search term
        return searchableFields.some(field => field.includes(searchTerm));
    });

    displayPatientsForBilling(filteredPatients);
}

// Make loadPatientsForBilling available globally
window.loadPatientsForBilling = async function() {
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
        // Filter patients who have been consulted but not billed
        billablePatients = patients.filter(p => p.services && p.services.length > 0);
        displayPatientsForBilling(billablePatients);
    } catch (error) {
        console.error('Error loading patients:', error);
        showError('Failed to load patients. Please try again.');
    }
}

// Display patients in the billing table
function displayPatientsForBilling(patients) {
    const tbody = document.getElementById('billPatientsList');
    if (!tbody) return;

    if (!patients || patients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center text-muted">
                    <i class="bi bi-inbox"></i> No matching patients found
                </td>
            </tr>
        `;
        return;
    }

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
                <td>${patient.doctorName || 'N/A'}</td>
                <td>${consultationDate}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="window.viewBill('${patient._id}')">
                        <i class="bi bi-receipt"></i> View Bill
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Show error message
function showError(message) {
    const tbody = document.getElementById('billPatientsList');
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="text-center text-danger">
                <i class="bi bi-exclamation-triangle"></i> ${message}
            </td>
        </tr>
    `;
}

// Make viewBill function globally available
window.viewBill = async function(patientId) {
    try {
        window.currentPatientId = patientId;
        const token = localStorage.getItem('token');
        const response = await fetch(`/patients/${patientId}/bill`, {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch bill');
        }

        const billData = await response.json();
        
        // First update the content
        displayBill(billData);
        
        // Then show the modal using Bootstrap's method
        const billModal = new bootstrap.Modal(document.getElementById('billModal'));
        billModal.show();
    } catch (error) {
        console.error('Error viewing bill:', error);
        alert('Failed to load bill. Please try again.');
    }
}

// Display bill in modal
function displayBill(billData) {
    const billContent = document.getElementById('billContent');
    if (!billContent) {
        console.error('Bill content element not found');
        return;
    }
    
    const consultationDate = new Date(billData.consultationDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    billContent.innerHTML = `
        <div class="bill-container">
            <div class="text-center mb-4">
                <h2 class="hospital-name" style="color: #34a853;">🏥 Healthcare Plus Clinic</h2>
                <p class="mb-0">123 Hospital Street, City</p>
                <p>Phone: (123) 456-7890</p>
                <hr>
                <h4 style="color: #34a853;">INVOICE</h4>
            </div>

            <div class="row mb-4">
                <div class="col-md-6">
                    <h5 style="color: #34a853;">Patient Details:</h5>
                    <p class="mb-1"><strong>Name:</strong> ${billData.name}</p>
                    <p class="mb-1"><strong>Age:</strong> ${billData.age} years</p>
                    <p class="mb-1"><strong>Phone:</strong> ${billData.phoneNumber}</p>
                    <p class="mb-1"><strong>Aadhar No:</strong> ${billData.aadharNo}</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <p class="mb-1"><strong>Doctor:</strong> Dr. ${billData.doctorName}</p>
                    <p class="mb-1"><strong>Date:</strong> ${consultationDate}</p>
                    <p class="mb-1"><strong>Bill No:</strong> BILL-${Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
            </div>

            <table class="table table-bordered">
                <thead style="background-color: rgba(52, 168, 83, 0.1);">
                    <tr>
                        <th>Service</th>
                        <th class="text-end">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    ${billData.services.map(service => `
                        <tr>
                            <td>${service}</td>
                            <td class="text-end">₹${service === 'Consultation' ? '500' : 
                                               service === 'X-ray' ? '1000' : 
                                               service === 'Blood Test' ? '800' : '0'}</td>
                        </tr>
                    `).join('')}
                    <tr style="background-color: rgba(52, 168, 83, 0.1);" class="fw-bold">
                        <th>Total Amount</th>
                        <th class="text-end">₹${billData.billAmount}</th>
                    </tr>
                </tbody>
            </table>

            <div class="row mt-4">
                <div class="col-md-8">
                    <p class="mb-0"><small>This is a computer-generated bill, no signature required.</small></p>
                </div>
                <div class="col-md-4 text-end">
                    <p class="mb-0"><strong>Authorized Signatory</strong></p>
                </div>
            </div>
        </div>
    `;
}

// Finalize and print bill
async function finalizeBill() {
    if (!window.currentPatientId) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/billing/finalize-bill/${window.currentPatientId}`, {
            method: 'PUT',
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to finalize bill');
        }

        // Remove the patient from billablePatients array
        billablePatients = billablePatients.filter(patient => patient._id !== window.currentPatientId);

        // Print the bill
        const billContent = document.getElementById('billContent').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Patient Bill</title>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"/>
                <style>
                    @media print {
                        body { padding: 20px; }
                        .bill-container { max-width: 800px; margin: auto; }
                    }
                </style>
            </head>
            <body>
                ${billContent}
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

        // Close modal and refresh display
        window.billModalInstance.hide();
        displayPatientsForBilling(billablePatients); // Update the display with remaining patients
        
        // Show success message
        const tbody = document.getElementById('billPatientsList');
        if (billablePatients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted">
                        <i class="bi bi-inbox"></i> No patients pending for billing
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error finalizing bill:', error);
        alert('Failed to finalize bill. Please try again.');
    }
} 