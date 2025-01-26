const SPREADSHEET_ID = '1Z6MkmyCU_xELc_riP_xeCRzXr4rNhTQ2pyjwQ0ZcGYk';
const API_KEY = 'AIzaSyBmSkNijS0qEa9j8ZrvFItYggN_FgXe5jg';
const RANGE = "'Slow ranking'!B6:D35"; // Измените на нужный диапазон

async function fetchData() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data.values) {
            populateTable(data.values);
        } else {
            console.error('No data found in the sheet');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateTable(data) {
    const tableBody = document.getElementById('results-table').querySelector('tbody');
    // Очистить таблицу перед добавлением новых данных
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

fetchData();
