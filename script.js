const SPREADSHEET_ID = '1Z6MkmyCU_xELc_riP_xeCRzXr4rNhTQ2pyjwQ0ZcGYk';
const API_KEY = 'AIzaSyBmSkNijS0qEa9j8ZrvFItYggN_FgXe5jg';
const RANGES = [
    "'Slow ranking'!B5:D35",  // Phys
    "'Slow ranking'!E5:G35",  // Light
    "'Slow ranking'!H5:J35",  // Dark
    "'Slow ranking'!K5:M35",  // Fire
    "'Slow ranking'!N5:P35",  // Ice
    "'Slow ranking'!Q5:S35",  // Elec
    "'Slow ranking'!T5:V35"   // Force
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

RANGES.forEach((range, index) => {
    fetchData(range).then(data => {
        populateTable(`table${index+1}`, data);
    });
});

function toggleTable(button) {
    const table = button.nextElementSibling;
    table.style.display = table.style.display === 'none' ? 'table' : 'none';
}

function filterTables() {
    const filter = document.getElementById('filter').value.toLowerCase();
    document.querySelectorAll('.results-table tbody tr').forEach(row => {
        const nameCell = row.children[1]; // Индекс 1 для столбца Name
        const name = nameCell.textContent.toLowerCase();
        row.style.display = name.includes(filter) ? '' : 'none';
    });
}
