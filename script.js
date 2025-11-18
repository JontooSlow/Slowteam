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

function populateTable(tableId, data) {
    const tableBody = document.getElementById(tableId).querySelector('tbody');
    tableBody.innerHTML = '';
    
    // Store previous data for change detection
    previousTableData[tableId] = JSON.parse(JSON.stringify(tableData[tableId] || []));
    
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
    
    // Send webhook update if enabled
    const tableIndex = parseInt(tableId.replace('table', '')) - 1;
    if (tableIndex >= 0 && tableIndex < ELEMENT_NAMES.length) {
        const topOnly = localStorage.getItem('discord_webhook_top_only') === 'true';
        sendRankingUpdate(tableIndex, ELEMENT_NAMES[tableIndex], data, topOnly);
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
        populateTable(contentIds[i], allData[i]);
    }
    
    // Remove loading state
    tableContents.forEach(content => {
        content.classList.remove('loading');
    });
    
    // Send initial update to Discord if auto-update is enabled
    // Wait a bit to ensure all data is loaded
    setTimeout(() => {
        const autoUpdate = localStorage.getItem('discord_webhook_auto') !== 'false';
        if (autoUpdate) {
            // Only send if this is the first load (no previous data)
            const hasPreviousData = Object.keys(previousTableData).length > 0;
            if (!hasPreviousData) {
                sendAllRankingsUpdate();
            }
        }
    }, 2000);
    
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
    
    // Initialize webhook settings
    initWebhookSettings();
});

// Discord Webhook Functions
function initWebhookSettings() {
    // Load saved webhook URL
    const savedWebhook = localStorage.getItem('discord_webhook_url');
    const autoUpdate = localStorage.getItem('discord_webhook_auto') !== 'false';
    const topOnly = localStorage.getItem('discord_webhook_top_only') === 'true';
    
    if (savedWebhook) {
        document.getElementById('webhook-url').value = savedWebhook;
    }
    
    document.getElementById('webhook-auto-update').checked = autoUpdate;
    document.getElementById('webhook-top-only').checked = topOnly;
    
    // Event listeners
    document.getElementById('webhook-toggle').addEventListener('click', () => {
        const panel = document.getElementById('webhook-panel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
    
    document.getElementById('webhook-save').addEventListener('click', saveWebhook);
    document.getElementById('webhook-test').addEventListener('click', testWebhook);
    document.getElementById('webhook-clear').addEventListener('click', clearWebhook);
    
    document.getElementById('webhook-auto-update').addEventListener('change', (e) => {
        localStorage.setItem('discord_webhook_auto', e.target.checked);
    });
    
    document.getElementById('webhook-top-only').addEventListener('change', (e) => {
        localStorage.setItem('discord_webhook_top_only', e.target.checked);
    });
}

function saveWebhook() {
    const webhookUrl = document.getElementById('webhook-url').value.trim();
    
    if (!webhookUrl) {
        showWebhookStatus('Please enter a webhook URL', 'error');
        return;
    }
    
    if (!webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        showWebhookStatus('Invalid webhook URL format', 'error');
        return;
    }
    
    localStorage.setItem('discord_webhook_url', webhookUrl);
    showWebhookStatus('Webhook URL saved successfully!', 'success');
}

function clearWebhook() {
    document.getElementById('webhook-url').value = '';
    localStorage.removeItem('discord_webhook_url');
    showWebhookStatus('Webhook URL cleared', 'success');
}

async function testWebhook() {
    const webhookUrl = document.getElementById('webhook-url').value.trim() || localStorage.getItem('discord_webhook_url');
    
    if (!webhookUrl) {
        showWebhookStatus('Please enter a webhook URL first', 'error');
        return;
    }
    
    showWebhookStatus('Sending test message...', 'success');
    
    const testEmbed = {
        title: '🎮 Slow Ranking - Webhook Test',
        description: 'If you see this message, your webhook is working correctly!',
        color: 0x5865F2,
        timestamp: new Date().toISOString(),
        footer: {
            text: 'Slow Ranking Bot'
        }
    };
    
    const success = await sendDiscordWebhook(webhookUrl, null, [testEmbed]);
    
    if (success) {
        showWebhookStatus('✅ Test message sent successfully! Check your Discord channel.', 'success');
    } else {
        showWebhookStatus('❌ Failed to send test message. Check your webhook URL.', 'error');
    }
}

function showWebhookStatus(message, type) {
    const statusDiv = document.getElementById('webhook-status');
    statusDiv.textContent = message;
    statusDiv.className = `webhook-status ${type}`;
    
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 5000);
}

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

function createRankingEmbed(elementName, data, topOnly = false) {
    const emoji = ELEMENT_EMOJIS[elementName] || '📊';
    const color = ELEMENT_COLORS[elementName] || 0x5865F2;
    
    const displayData = topOnly ? data.slice(0, 3) : data.slice(0, 10);
    
    let description = '';
    displayData.forEach((row, index) => {
        const rank = row[0] || (index + 1);
        const name = row[1] || 'N/A';
        const score = row[2] || '0';
        
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${rank}.`;
        description += `${medal} **${name}** - ${score}\n`;
    });
    
    if (data.length > displayData.length && !topOnly) {
        description += `\n*... and ${data.length - displayData.length} more*`;
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

async function sendRankingUpdate(elementIndex, elementName, data, topOnly = false) {
    const webhookUrl = localStorage.getItem('discord_webhook_url');
    const autoUpdate = localStorage.getItem('discord_webhook_auto') !== 'false';
    
    if (!webhookUrl || !autoUpdate) {
        return;
    }
    
    // Check if data has changed
    const previousData = previousTableData[`table${elementIndex + 1}`];
    if (previousData && JSON.stringify(previousData) === JSON.stringify(data)) {
        return; // No changes
    }
    
    const embed = createRankingEmbed(elementName, data, topOnly);
    await sendDiscordWebhook(webhookUrl, null, [embed]);
}

async function sendAllRankingsUpdate() {
    const webhookUrl = localStorage.getItem('discord_webhook_url');
    const autoUpdate = localStorage.getItem('discord_webhook_auto') !== 'false';
    const topOnly = localStorage.getItem('discord_webhook_top_only') === 'true';
    
    if (!webhookUrl || !autoUpdate) {
        return;
    }
    
    const embeds = [];
    
    for (let i = 0; i < ELEMENT_NAMES.length; i++) {
        const tableId = `table${i + 1}`;
        const data = tableData[tableId];
        
        if (data && data.length > 0) {
            const embed = createRankingEmbed(ELEMENT_NAMES[i], data, topOnly);
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
            await sendDiscordWebhook(webhookUrl, '📊 **Ranking Update**', chunk);
        }
    }
}

// Function to manually trigger ranking update (can be called from browser console)
window.sendRankingUpdate = async function() {
    await sendAllRankingsUpdate();
    alert('Ranking update sent to Discord!');
};


