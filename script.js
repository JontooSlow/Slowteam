const SPREADSHEET_ID = '1Z6MkmyCU_xELc_riP_xeCRzXr4rNhTQ2pyjwQ0ZcGYk';
const API_KEY = 'AIzaSyBmSkNijS0qEa9j8ZrvFItYggN_FgXe5jg';
const RANGES = [
    "'Slow ranking'!B6:D36",  // Phys
    "'Slow ranking'!E6:G36",  // Light
    "'Slow ranking'!H6:J36",  // Dark
    "'Slow ranking'!K6:M36",  // Fire
    "'Slow ranking'!N6:P36",  // Ice
    "'Slow ranking'!Q6:S36",  // Elec
    "'Slow ranking'!T6:V36"   // Force
   
];

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
    data.forEach(row => {
        const tr = document.createElement('tr');
        row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

function filterTables() {
    const filterValue = document.getElementById('filter').value.toLowerCase();
    const tables = document.querySelectorAll('.results-table tbody');
  
    tables.forEach(tbody => {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const cell = row.querySelector('td:nth-child(2)'); // Предполагается, что имя находится во второй колонке
            if (cell) {
                const text = cell.textContent.toLowerCase();
                row.style.display = text.includes(filterValue) ? '' : 'none';
            }
        });
    });
}
document.addEventListener("DOMContentLoaded", async function() {
    const contentIds = ['table1', 'table2', 'table3', 'table4', 'table5', 'table6', 'table7'];
    
    for (let i = 0; i < RANGES.length; i++) {
        const data = await fetchData(RANGES[i]);
        populateTable(contentIds[i], data);
    }
});
