const SPREADSHEET_ID = '1Z6MkmyCU_xELc_riP_xeCRzXr4rNhTQ2pyjwQ0ZcGYk';
const API_KEY = 'AIzaSyBmSkNijS0qEa9j8ZrvFItYggN_FgXe5jg';

const RANGES = [
    "'Slow ranking'!B6:D36",  // Phys
    "'Slow ranking'!E6:G36",  // Light
    "'Slow ranking'!H6:J36",  // Dark
    "'Slow ranking'!K6:M36",  // Fire
    "'Slow ranking'!N6:P36",  // Ice
    "'Slow ranking'!Q6:S36",  // Elec
    "'Slow ranking'!T6:V36",  // Force
    "'Slow ranking'!W6:Y36",  // Contribution
    "'Slow ranking'!Z6:AB36"  // Average score
];

let tableData = {}; // Store original data for sorting

async function fetchData(range) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.values || [];
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

function populateTable(tableId, data) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';
    
    // Store original data
    tableData[tableId] = data;
    
    if (data.length === 0) {
        return;
    }
    
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.setAttribute('data-index', index);
        
        row.forEach((cell, cellIndex) => {
            const td = document.createElement('td');
            td.textContent = cell || '';
            
            // Add special styling for rank column
            if (cellIndex === 0) {
                td.classList.add('rank-cell');
            }
            
            tr.appendChild(td);
        });
        
        tableBody.appendChild(tr);
    });
    
    // Add click handlers to table headers for sorting
    addSortHandlers(tableId);
}

function addSortHandlers(tableId) {
    const table = document.getElementById(tableId);
    const headers = table.querySelectorAll('th');
    
    headers.forEach((header, index) => {
        header.addEventListener('click', () => {
            sortTable(tableId, index);
        });
    });
}

function sortTable(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    if (rows.length === 0) return;
    
    // Determine sort direction
    const currentOrder = table.getAttribute('data-sort-order') || 'asc';
    const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
    table.setAttribute('data-sort-order', newOrder);
    
    // Sort rows
    rows.sort((a, b) => {
        const aCell = a.querySelector(`td:nth-child(${columnIndex + 1})`);
        const bCell = b.querySelector(`td:nth-child(${columnIndex + 1})`);
        
        if (!aCell || !bCell) return 0;
        
        const aValue = aCell.textContent.trim();
        const bValue = bCell.textContent.trim();
        
        // Try to parse as number
        const aNum = parseFloat(aValue);
        const bNum = parseFloat(bValue);
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return newOrder === 'asc' ? aNum - bNum : bNum - aNum;
        }
        
        // String comparison
        if (newOrder === 'asc') {
            return aValue.localeCompare(bValue);
        } else {
            return bValue.localeCompare(aValue);
        }
    });
    
    // Clear and re-append sorted rows
    tbody.innerHTML = '';
    rows.forEach(row => {
        tbody.appendChild(row);
    });
    
    // Add visual feedback
    const headers = table.querySelectorAll('th');
    headers.forEach((h, i) => {
        if (i === columnIndex) {
            h.style.color = 'var(--element-color)';
            h.textContent = h.textContent.replace(' ↑', '').replace(' ↓', '');
            h.textContent += newOrder === 'asc' ? ' ↑' : ' ↓';
        } else {
            h.style.color = '';
            h.textContent = h.textContent.replace(' ↑', '').replace(' ↓', '');
        }
    });
}

function filterTables() {
    const filterValue = document.getElementById('filter').value.toLowerCase();
    const tables = document.querySelectorAll('.results-table tbody');
    
    if (filterValue === '') {
        // Reset all tables to original data
        Object.keys(tableData).forEach(tableId => {
            populateTable(tableId, tableData[tableId]);
        });
        return;
    }
    
    tables.forEach(tbody => {
        const rows = tbody.querySelectorAll('tr');
        let hasVisibleRows = false;
        
        rows.forEach(row => {
            const nameCell = row.querySelector('td:nth-child(2)');
            if (nameCell) {
                const text = nameCell.textContent.toLowerCase();
                const shouldShow = text.includes(filterValue);
                row.style.display = shouldShow ? '' : 'none';
                
                if (shouldShow) {
                    hasVisibleRows = true;
                }
            }
        });
        
        // Highlight matching text
        if (hasVisibleRows && filterValue) {
            rows.forEach(row => {
                const nameCell = row.querySelector('td:nth-child(2)');
                if (nameCell && nameCell.textContent.toLowerCase().includes(filterValue)) {
                    const originalText = nameCell.textContent;
                    const regex = new RegExp(`(${filterValue})`, 'gi');
                    nameCell.innerHTML = originalText.replace(regex, '<mark>$1</mark>');
                }
            });
        }
    });
}

// Add mark styling for highlighted search results
const style = document.createElement('style');
style.textContent = `
    mark {
        background: linear-gradient(120deg, #ffd700 0%, #ffed4e 100%);
        padding: 2px 4px;
        border-radius: 3px;
        font-weight: 600;
    }
`;
document.head.appendChild(style);

document.addEventListener("DOMContentLoaded", async function() {
    const contentIds = ['table1', 'table2', 'table3', 'table4', 'table5', 'table6', 'table7', 'table8', 'table9'];
    
    // Show loading state
    const tableContents = document.querySelectorAll('.table-content');
    tableContents.forEach(content => {
        content.classList.add('loading');
    });
    
    // Fetch all data
    const promises = RANGES.map(range => fetchData(range));
    const allData = await Promise.all(promises);
    
    // Populate tables
    for (let i = 0; i < RANGES.length; i++) {
        populateTable(contentIds[i], allData[i]);
    }
    
    // Remove loading state
    tableContents.forEach(content => {
        content.classList.remove('loading');
    });
    
    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

