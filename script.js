let originalData = [];
let currentData = [];

function handleFileUpload() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('Please select a file');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = e.target.result;
            let workbook;
            
            if (file.name.endsWith('.csv')) {
                // Handle CSV
                const rows = data.split('\n').map(row => 
                    row.split(',').map(cell => cell.trim())
                );
                originalData = rows.filter(row => row.some(cell => cell)); // Remove empty rows
            } else {
                // Handle Excel files
                if (typeof XLSX === 'undefined') {
                    showError('XLSX library is not loaded. Please refresh the page and try again.');
                    return;
                }
                workbook = XLSX.read(data, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                originalData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            }
            
            if (originalData.length === 0) {
                showError('The file appears to be empty');
                return;
            }
            
            currentData = JSON.parse(JSON.stringify(originalData));
            displayTable();
            populateSortColumns();
            document.getElementById('fileName').textContent = `✓ Loaded: ${file.name}`;
            clearError();
        } catch (error) {
            showError(`Error reading file: ${error.message}`);
        }
    };
    
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
}

function displayTable() {
    const table = document.getElementById('dataTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    if (currentData.length === 0) return;
    
    // Create header row
    const headerRow = document.createElement('tr');
    const headers = currentData[0];
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header || 'Column';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    
    // Create data rows
    for (let i = 1; i < currentData.length; i++) {
        const row = document.createElement('tr');
        const rowData = currentData[i];
        
        rowData.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell || '';
            row.appendChild(td);
        });
        
        tbody.appendChild(row);
    }
    
    // Show table section
    document.getElementById('tableSection').style.display = 'block';
}

function populateSortColumns() {
    const sortColumn = document.getElementById('sortColumn');
    sortColumn.innerHTML = '<option value="">-- Select Column --</option>';
    
    if (currentData.length > 0) {
        const headers = currentData[0];
        headers.forEach((header, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = header || `Column ${index + 1}`;
            sortColumn.appendChild(option);
        });
    }
}

function sortTable() {
    const columnIndex = parseInt(document.getElementById('sortColumn').value);
    const sortOrder = document.getElementById('sortOrder').value;
    
    if (columnIndex === '' || isNaN(columnIndex)) {
        showError('Please select a column to sort by');
        return;
    }
    
    clearError();
    
    // Sort data (keeping header row in place)
    const headerRow = currentData[0];
    const dataRows = currentData.slice(1);
    
    dataRows.sort((a, b) => {
        let aVal = a[columnIndex] || '';
        let bVal = b[columnIndex] || '';
        
        // Try to convert to numbers for numeric sorting
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
        
        if (sortOrder === 'asc') {
            return aVal.localeCompare(bVal);
        } else {
            return bVal.localeCompare(aVal);
        }
    });
    
    currentData = [headerRow, ...dataRows];
    displayTable();
}

function resetData() {
    currentData = JSON.parse(JSON.stringify(originalData));
    document.getElementById('sortColumn').value = '';
    document.getElementById('sortOrder').value = 'asc';
    displayTable();
    clearError();
}

function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.textContent = message;
    errorMsg.classList.add('show');
}

function clearError() {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.classList.remove('show');
}
