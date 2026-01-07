const balance = document.getElementById('balance-amount');
const money_plus = document.getElementById('income-amount');
const money_minus = document.getElementById('expense-amount');
const list = document.getElementById('list');
const form = document.getElementById('transaction-form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');

const category = document.getElementById('category');
const date = document.getElementById('date');

// Check local storage
const localStorageTransactions = JSON.parse(
    localStorage.getItem('transactions')
);

// State
let transactions =
    localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

// Add transaction
function addTransaction(e) {
    e.preventDefault();

    if (text.value.trim() === '' || amount.value.trim() === '') {
        alert('Please add a description and amount');
        return;
    }

    const transaction = {
        id: generateID(),
        text: text.value,
        amount: +amount.value,
        category: category.value,
        date: date.value || new Date().toISOString().split('T')[0] // Default to today
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);

    updateValues();

    updateLocalStorage();

    text.value = '';
    amount.value = '';
    // Keep date or reset? Let's reset to today implicitly by clearing
    date.value = '';
}

// Generate random ID
function generateID() {
    return Math.floor(Math.random() * 100000000);
}

// Format currency
function formatMoney(amount) {
    return '₹' + amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
    // Get sign
    const sign = transaction.amount < 0 ? '-' : '+';
    // Default category if old data doesn't have it
    const cat = transaction.category || 'General';
    // Format Date (YYYY-MM-DD -> DD MMM YYYY)
    const dateObj = new Date(transaction.date || Date.now());
    const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const item = document.createElement('li');

    // Add class based on value
    item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

    item.innerHTML = `
    <div class="txn-info">
        <span class="txn-text">${transaction.text}</span>
        <div class="txn-meta">
            <small class="txn-cat">${cat}</small>
            <small class="txn-date">${dateStr}</small>
        </div>
    </div>
    <div class="txn-amount">
        <span>${sign}${Math.abs(transaction.amount)}</span> 
        <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
    </div>
  `;

    list.appendChild(item);
}

// Update the balance, income and expense
function updateValues() {
    const amounts = transactions.map(transaction => transaction.amount);

    const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);

    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => (acc += item), 0)
        .toFixed(2);

    const expense = (
        amounts.filter(item => item < 0).reduce((acc, item) => (acc += item), 0) *
        -1
    ).toFixed(2);

    balance.innerText = `₹${total}`;
    money_plus.innerText = `+₹${income}`;
    money_minus.innerText = `-₹${expense}`;
}

// Remove transaction by ID
function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);

    updateLocalStorage();

    init();
}

// Update local storage transactions
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Init app
function init() {
    list.innerHTML = '';

    transactions.forEach(addTransactionDOM);
    updateValues();
    updateChart();
}

// Chart.js Configuration
let expenseChart;

function updateChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');

    // Calculate Expenses by Category
    const expenseTransactions = transactions.filter(t => t.amount < 0);

    const categories = {};

    if (expenseTransactions.length === 0) {
        // Default empty state
        categories['No Expenses'] = 1;
    } else {
        expenseTransactions.forEach(t => {
            const cat = t.category || 'General';
            // Store absolute value
            categories[cat] = (categories[cat] || 0) + Math.abs(t.amount);
        });
    }

    const labels = Object.keys(categories);
    const dataValues = Object.values(categories);

    // Dynamic colors
    const colorMap = {
        'Food': '#f59e0b', // Amber
        'Rent': '#ef4444', // Red
        'Transport': '#3b82f6', // Blue
        'Entertainment': '#8b5cf6', // Purple
        'Health': '#10b981', // Emerald
        'General': '#64748b', // Slate
        'No Expenses': '#334155'
    };

    const bgColors = labels.map(l => colorMap[l] || '#ec4899'); // Fallback pink

    if (expenseChart) {
        expenseChart.destroy();
    }

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: bgColors,
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            cutout: '70%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    // Only show tooltip if we have actual data
                    enabled: expenseTransactions.length > 0
                }
            }
        }
    });
}

// Clear all transactions
const clearBtn = document.getElementById('clear-btn');
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all transactions?')) {
            transactions = [];
            updateLocalStorage();
            init();
        }
    });
}

init();

form.addEventListener('submit', addTransaction);
