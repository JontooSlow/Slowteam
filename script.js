javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';
const API_KEY = 'YOUR_API_KEY';
const RANGE = 'Sheet1!A1:C31'; // Измените на нужный диапазон

async function fetchData() {
    const url = https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY};
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        populateTable(data.values);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateTable(data) {
    const tableBody = document.getElementById('results-table').querySelector('tbody');
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

fetchData();
