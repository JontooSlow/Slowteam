// Проверьте файл на наличие всех закрывающих скобок и запятых
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

// Проверьте саму декларацию функции и не произошел ли сдвиг кода, например, из-за некорректного копирования
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

document.addEventListener("DOMContentLoaded", function() {
    const titles = document.querySelectorAll('.title');
    const contents = document.querySelectorAll('.table-content');

    contents.forEach(content => {
        // Сначала скрываем все таблицы
        content.style.maxHeight = null;
    });

    titles.forEach((title, index) => {
        title.addEventListener('click', function() {
            const content = contents[index];
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
});

function toggleVisibility() {
    const contentSections = document.querySelectorAll('.table-content');
    contentSections.forEach(section => {
        section.style.maxHeight = section.style.maxHeight ? null : section.scrollHeight + "px";
    });
}
