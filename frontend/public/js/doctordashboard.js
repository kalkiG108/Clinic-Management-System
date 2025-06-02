// Global variables
let currentPatients = [];
let doctorData = null;
let currentPatientId = null;
let medicationEntryCount = 0;

// Function to check authentication and load doctor info
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/auth/logindoctor';
        return false;
    }

    try {
        const response = await fetch('/auth/doctor-info', {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            localStorage.removeItem('token');
            window.location.href = '/auth/logindoctor';
            return false;
        }

        const data = await response.json();
        doctorData = data; // Store doctor data globally
        document.getElementById('doctorName').textContent = data.doctorName;
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/auth/logindoctor';
        return false;
    }
}

// Function to format date
function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Update current date in the header
function updateCurrentDate() {
    const today = new Date();
    document.getElementById('currentDate').textContent = formatDate(today);
}

// Function to view today's patients
async function viewTodaysPatients() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/patients', {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error('Failed to fetch patients');
        }

        // Filter patients with token number > 0 and sort by token number
        const allPatients = await response.json();
        currentPatients = allPatients
            .filter(p => p.latestTokenNumber > 0)
            .sort((a, b) => a.latestTokenNumber - b.latestTokenNumber);

        displayPatients();
        document.getElementById('patientsListSection').style.display = 'block';
        document.getElementById('consultationScreen').style.display = 'none';
    } catch (error) {
        console.error('Error fetching patients:', error);
        alert('Failed to load patients. Please try again.');
    }
}

// Function to display patients in table format
function displayPatients() {
    const patientsListDiv = document.getElementById('patientsList');
    patientsListDiv.innerHTML = '';

    if (currentPatients.length === 0) {
        patientsListDiv.innerHTML = `
            <tr>
                <td colspan="3" class="text-center text-muted">No patients in queue for today.</td>
            </tr>
        `;
        return;
    }

    currentPatients.forEach((patient, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="align-middle">
                <span class="badge-token">${patient.latestTokenNumber}</span>
            </td>
            <td class="align-middle">${patient.name}</td>
            <td class="align-middle">
                <button 
                    class="btn btn-success btn-sm ${index === 0 ? '' : 'disabled'}"
                    onclick="startConsultation('${patient._id}')"
                    ${index === 0 ? '' : 'disabled'}
                >
                    <i class="bi bi-clipboard2-pulse me-1"></i> Consult
                </button>
            </td>
        `;
        patientsListDiv.appendChild(row);
    });
}

// Function to start consultation
async function startConsultation(patientId) {
    currentPatientId = patientId;
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/patients/${patientId}`, {
            headers: {
                'Authorization': token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch patient details');
        }

        const patient = await response.json();
        displayPatientDetails(patient);
        
        document.getElementById('patientsListSection').style.display = 'none';
        document.getElementById('consultationScreen').style.display = 'block';
        document.getElementById('patientHistorySection').style.display = 'none';
    } catch (error) {
        console.error('Error starting consultation:', error);
        alert('Failed to load patient details. Please try again.');
    }
}

// Function to display patient details
function displayPatientDetails(patient) {
    const detailsDiv = document.getElementById('patientDetails');
    detailsDiv.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Name:</strong> ${patient.name}</p>
                <p><strong>Age:</strong> ${patient.age}</p>
                <p><strong>Phone:</strong> ${patient.phoneNumber}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Token Number:</strong> ${patient.latestTokenNumber}</p>
                <p><strong>Aadhar No:</strong> ${patient.aadharNo}</p>
                <p><strong>Medical History:</strong> ${patient.medicalHistory || 'Not available'}</p>
            </div>
        </div>
    `;
}

// Function to toggle patient history view
async function togglePatientHistory() {
    const historySection = document.getElementById('patientHistorySection');
    
    if (historySection.style.display === 'none') {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/history/${currentPatientId}`, {
                headers: {
                    'Authorization': token
                }
            });

            const historyList = document.getElementById('patientHistoryList');
            
            if (!response.ok) {
                if (response.status === 404) {
                    historyList.innerHTML = `
                        <div class="alert alert-info">
                            <i class="bi bi-info-circle"></i> No previous visit history found for this patient.
                        </div>
                    `;
                } else {
                    throw new Error('Failed to fetch patient history');
                }
            } else {
                const history = await response.json();
                displayPatientHistory(history);
            }
        } catch (error) {
            console.error('Error fetching patient history:', error);
            alert('Failed to load patient history. Please try again.');
        }
    }
    
    historySection.style.display = historySection.style.display === 'none' ? 'block' : 'none';
}

// Function to display patient history
function displayPatientHistory(history) {
    const historyList = document.getElementById('patientHistoryList');
    historyList.innerHTML = '';

    history.forEach(visit => {
        const visitDate = new Date(visit.visitDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="mb-0">Visit Date: ${visitDate}</h5>
            </div>
            <p><strong>Symptoms:</strong> ${visit.symptoms}</p>
            <p><strong>Diagnosis:</strong> ${visit.diagnosis}</p>
            <p><strong>Prescribed Medications:</strong> ${visit.prescribedMedications}</p>
            <hr>
        `;
        historyList.appendChild(card);
    });
}

// Function to add a new medication entry
function addMedicationEntry() {
    medicationEntryCount++;
    const entryId = `medication-${medicationEntryCount}`;
    const entryHtml = `
        <div class="medication-entry card mb-2" id="${entryId}">
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-4">
                        <label class="form-label">Medication Name</label>
                        <input type="text" class="form-control medication-name" required>
                        <div class="invalid-feedback">Please enter medication name</div>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Dosage</label>
                        <input type="text" class="form-control medication-dosage" required>
                        <div class="invalid-feedback">Please enter dosage</div>
                    </div>
                    <div class="col-md-3">
                        <label class="form-label">Duration</label>
                        <input type="text" class="form-control medication-duration" required>
                        <div class="invalid-feedback">Please enter duration</div>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button type="button" class="btn btn-danger" onclick="removeMedicationEntry('${entryId}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const container = document.getElementById('medicationsContainer');
    container.insertAdjacentHTML('beforeend', entryHtml);
}

// Function to remove a medication entry
function removeMedicationEntry(entryId) {
    const entry = document.getElementById(entryId);
    if (entry) {
        entry.remove();
    }
}

// Function to collect all medication data
function collectMedicationData() {
    const medications = [];
    const entries = document.querySelectorAll('.medication-entry');
    
    entries.forEach(entry => {
        const name = entry.querySelector('.medication-name').value.trim();
        const dosage = entry.querySelector('.medication-dosage').value.trim();
        const duration = entry.querySelector('.medication-duration').value.trim();
        
        if (name && dosage && duration) {
            medications.push({ name, dosage, duration });
        }
    });
    
    return medications;
}

// Function to format medications as a string
function formatMedicationsAsString(medications) {
    return medications.map(med => 
        `${med.name}, ${med.dosage}, ${med.duration}`
    ).join('\n');
}

// Function to handle form submission
document.getElementById('consultationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!this.checkValidity()) {
        e.stopPropagation();
        this.classList.add('was-validated');
        return;
    }

    // Check if at least one medication is entered
    const medications = collectMedicationData();
    if (medications.length === 0) {
        alert('Please add at least one medication');
        return;
    }

    const services = ['Consultation'];
    if (document.getElementById('serviceXray').checked) services.push('X-ray');
    if (document.getElementById('serviceBloodTest').checked) services.push('Blood Test');

    const consultationData = {
        services,
        symptoms: document.getElementById('symptoms').value,
        diagnosis: document.getElementById('diagnosis').value,
        prescribedMedications: formatMedicationsAsString(medications)
    };

    try {
        console.log('Patient ID:', currentPatientId);
        console.log('Sending consultation data:', consultationData);
        
        const token = localStorage.getItem('token');
        console.log('Using token:', token);
        
        const response = await fetch(`/history/${currentPatientId}/finish-consultation`, {
            method: 'PUT',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(consultationData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            console.error('Server response:', {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            throw new Error('Failed to finish consultation');
        }

        // Only on successful consultation
        alert('Consultation finished successfully!');
        backToPatientsList();
    } catch (error) {
        console.error('Error finishing consultation:', error);
        alert('Failed to finish consultation. Please try again.');
        // Don't call backToPatientsList() here
        // Just re-enable the form if needed
        this.classList.remove('was-validated');
    }
});

// Function to go back to patients list
function backToPatientsList() {
    document.getElementById('consultationScreen').style.display = 'none';
    document.getElementById('patientHistorySection').style.display = 'none';
    document.getElementById('consultationForm').reset();
    document.getElementById('consultationForm').classList.remove('was-validated');
    // Clear all medication entries
    document.getElementById('medicationsContainer').innerHTML = '';
    medicationEntryCount = 0;
    currentPatientId = null;
    viewTodaysPatients();
}

// Function to refresh patients list
function refreshPatientsList() {
    viewTodaysPatients();
}

// Function to handle logout
function handleLogout() {
    localStorage.removeItem('token');
    window.location.href = '/';
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Dashboard initializing...'); // Debug log
    if (await checkAuth()) {
        updateCurrentDate();
        // Update date every minute
        setInterval(updateCurrentDate, 60000);
    }
}); 