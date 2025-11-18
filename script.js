const SPREADSHEET_ID = '1Z6MkmyCU_xELc_riP_xeCRzXr4rNhTQ2pyjwQ0ZcGYk';
const API_KEY = 'AIzaSyBmSkNijS0qEa9j8ZrvFItYggN_FgXe5jg';

// Discord Webhook URL (hardcoded)
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1440277080704159795/i04LVU7LVn4vDkhghfxEe2bzPr59FH_M2khFJduw1ziVRoBv9PznyyypKWmQ3gWM4jmC';

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

const ELEMENT_NAMES = [
    'Phys', 'Light', 'Dark', 'Fire', 'Ice', 'Elec', 'Force', 'Contribution', 'Average Score'
];

const ELEMENT_EMOJIS = {
    'Phys': '⚔️',
    'Light': '✨',
    'Dark': '🌑',
    'Fire': '🔥',
    'Ice': '❄️',
    'Elec': '⚡',
    'Force': '🌪️',
    'Contribution': '⭐',
    'Average Score': '📊'
};

const ELEMENT_COLORS = {
    'Phys': 0x8B4513,
    'Light': 0xFFD700,
    'Dark': 0x4B0082,
    'Fire': 0xFF4500,
    'Ice': 0x00CED1,
    'Elec': 0xFFD700,
    'Force': 0x32CD32,
    'Contribution': 0xFF69B4,
    'Average Score': 0x9370DB
};

let tableData = {}; // Store original data for sorting
let previousTableData = {}; // Store previous data for change detection

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

async function populateTable(tableId, data) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';
    
    // Load previous data from localStorage for change detection
    const storedPreviousData = localStorage.getItem(`previous_${tableId}`);
    if (storedPreviousData) {
        previousTableData[tableId] = JSON.parse(storedPreviousData);
    } else {
        // First time loading - initialize as empty array
        previousTableData[tableId] = [];
    }
    
    // Store current data
    tableData[tableId] = data;
    
    if (data.length === 0) {
        // Save empty data to localStorage
        localStorage.setItem(`previous_${tableId}`, JSON.stringify(data));
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
    
    // Send webhook update only if data has changed
    const tableIndex = parseInt(tableId.replace('table', '')) - 1;
    if (tableIndex >= 0 && tableIndex < ELEMENT_NAMES.length) {
        // Check if data changed and send webhook if needed
        const shouldSave = await sendRankingUpdate(tableIndex, ELEMENT_NAMES[tableIndex], data);
        
        // Save current data as previous for next load ONLY AFTER checking for changes
        // This ensures we compare with the OLD data, not the new data
        localStorage.setItem(`previous_${tableId}`, JSON.stringify(data));
    } else {
        // Save data even if tableIndex is invalid
        localStorage.setItem(`previous_${tableId}`, JSON.stringify(data));
    }
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
        await populateTable(contentIds[i], allData[i]);
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

// Discord Webhook Functions

async function sendDiscordWebhook(webhookUrl, content, embeds = null) {
    try {
        const payload = {
            username: 'Slow Ranking Bot',
            avatar_url: 'https://cdn.discordapp.com/attachments/1234567890/1234567890/ranking-icon.png' // Optional: Add your bot icon
        };
        
        if (content) {
            payload.content = content;
        }
        
        if (embeds) {
            payload.embeds = embeds;
        }
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Webhook request failed: ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error sending to Discord webhook:', error);
        return null;
    }
}

function createRankingEmbed(elementName, data) {
    const emoji = ELEMENT_EMOJIS[elementName] || '📊';
    const color = ELEMENT_COLORS[elementName] || 0x5865F2;
    
    // Show ALL data, not just top 10
    let description = '';
    data.forEach((row, index) => {
        const rank = row[0] || (index + 1);
        const name = row[1] || 'N/A';
        const score = row[2] || '0';
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${rank}.`;
        description += `${medal} **${name}** - ${score}\n`;
    });
    
    // Discord embed description has a limit of 4096 characters
    // If description is too long, truncate it
    if (description.length > 4000) {
        description = description.substring(0, 4000) + '\n*... (truncated due to length limit)*';
    }
    
    return {
        title: `${emoji} ${elementName} Rankings`,
        description: description || 'No data available',
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
            text: `Last updated • Slow Ranking`
        }
    };
}

async function sendRankingUpdate(elementIndex, elementName, data) {
    // Check if data has changed by comparing with previous data
    const tableId = `table${elementIndex + 1}`;
    
    // Load previous data directly from localStorage
    const storedPreviousData = localStorage.getItem(`previous_${tableId}`);
    let previousData = null;
    
    if (storedPreviousData) {
        try {
            previousData = JSON.parse(storedPreviousData);
        } catch (e) {
            console.error(`[${tableId}] Error parsing previous data:`, e);
            previousData = null;
        }
    }
    
    // Skip if no previous data (first load) - don't send on first load
    if (!previousData || !Array.isArray(previousData) || previousData.length === 0) {
        console.log(`[${tableId}] First load or no previous data - skipping webhook`);
        return true; // Return true to allow saving
    }
    
    // Normalize data for comparison - create a hash-like string for comparison
    const normalizeData = (dataArray) => {
        if (!dataArray || !Array.isArray(dataArray)) return '';
        
        return dataArray
            .filter(row => row && Array.isArray(row) && row.length >= 2) // Must have at least rank and name
            .map(row => {
                // Only compare rank (index 0), name (index 1), and score (index 2)
                const rank = row[0] ? String(row[0]).trim() : '';
                const name = row[1] ? String(row[1]).trim().toLowerCase() : ''; // Case insensitive
                const score = row[2] ? String(row[2]).trim() : '';
                // Normalize numbers - convert "100" and "100.0" to same format
                let normalizedScore = score;
                const numScore = parseFloat(score);
                if (!isNaN(numScore)) {
                    normalizedScore = numScore.toString();
                }
                return `${rank}|${name}|${normalizedScore}`;
            })
            .filter(line => line !== '||') // Remove completely empty lines
            .sort() // Sort to handle order differences
            .join('||');
    };
    
    const normalizedPrevious = normalizeData(previousData);
    const normalizedCurrent = normalizeData(data);
    
    // Compare normalized data strings
    const dataChanged = normalizedPrevious !== normalizedCurrent;
    
    console.log(`[${tableId}] Previous hash length: ${normalizedPrevious.length}, Current hash length: ${normalizedCurrent.length}`);
    console.log(`[${tableId}] Changed: ${dataChanged}`);
    
    if (!dataChanged) {
        // No changes, don't send
        console.log(`[${tableId}] No changes detected - skipping webhook`);
        return true; // Return true to allow saving (data is the same)
    }
    
    // Data has changed - send update
    console.log(`[${tableId}] Changes detected - sending webhook`);
    if (normalizedPrevious.length > 0) {
        console.log(`[${tableId}] Previous (first 200 chars): ${normalizedPrevious.substring(0, 200)}...`);
    }
    if (normalizedCurrent.length > 0) {
        console.log(`[${tableId}] Current (first 200 chars): ${normalizedCurrent.substring(0, 200)}...`);
    }
    const embed = createRankingEmbed(elementName, data);
    await sendDiscordWebhook(DISCORD_WEBHOOK_URL, null, [embed]);
    return true; // Return true to allow saving
}

// Function to manually trigger ranking update (can be called from browser console)
window.sendRankingUpdate = async function() {
    const embeds = [];
    
    for (let i = 0; i < ELEMENT_NAMES.length; i++) {
        const tableId = `table${i + 1}`;
        const data = tableData[tableId];
        
        if (data && data.length > 0) {
            const embed = createRankingEmbed(ELEMENT_NAMES[i], data);
            embeds.push(embed);
        }
    }
    
    if (embeds.length > 0) {
        // Discord allows max 10 embeds per message
        const chunks = [];
        for (let i = 0; i < embeds.length; i += 10) {
            chunks.push(embeds.slice(i, i + 10));
        }
        
        for (const chunk of chunks) {
            await sendDiscordWebhook(DISCORD_WEBHOOK_URL, '📊 **Ranking Update**', chunk);
        }
        alert('Ranking update sent to Discord!');
    } else {
        alert('No data to send!');
    }
};

