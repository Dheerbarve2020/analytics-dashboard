const API_URL = 'http://127.0.0.1:8000/api';
let charts = {};

// Global state for date range
let currentStartDate = moment().subtract(29, 'days');
let currentEndDate = moment();

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    // Event Listeners
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

    // Initialize Date Range Picker
    initDateRangePicker();

    // Filters
    // Date range filter is handled by the picker callback

    document.getElementById('filterAge').addEventListener('change', () => {
        saveFilterPreference();
        track('age_filter');
        loadAnalytics();
    });
    document.getElementById('filterGender').addEventListener('change', () => {
        saveFilterPreference();
        track('gender_filter');
        loadAnalytics();
    });
});

function initDateRangePicker() {
    // Check if we have saved preferences
    const savedStart = getCookie('filterStartDate');
    const savedEnd = getCookie('filterEndDate');

    if (savedStart && savedEnd) {
        currentStartDate = moment(savedStart);
        currentEndDate = moment(savedEnd);
    }

    function cb(start, end) {
        $('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        currentStartDate = start;
        currentEndDate = end;
        saveFilterPreference();
        track('date_filter');
        loadAnalytics();
    }

    $('#reportrange').daterangepicker({
        startDate: currentStartDate,
        endDate: currentEndDate,
        ranges: {
            'Today': [moment(), moment()],
            'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
            'Last 7 Days': [moment().subtract(6, 'days'), moment()],
            'Last 30 Days': [moment().subtract(29, 'days'), moment()],
            'This Month': [moment().startOf('month'), moment().endOf('month')],
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
        },

    }, cb);

    cb(currentStartDate, currentEndDate);
}

function checkAuth() {
    const token = localStorage.getItem('access_token');
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
        const res = await fetch(`${API_URL}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            const json = await res.json();
            localStorage.setItem('access_token', json.access);
            localStorage.setItem('refresh_token', json.refresh);
            showDashboard();
        } else {
            alert('Login failed');
        }
    } catch (err) {
        console.error(err);
    }
}

function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    checkAuth();
}

function showLogin() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('dashboard-section').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    loadFilterPreferences();
    loadAnalytics();
}

// Tracking
async function track(featureName) {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
        await fetch(`${API_URL}/track/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ feature_name: featureName })
        });
    } catch (err) {
        console.error('Tracking failed', err);
    }
}

// Analytics and Charts
async function loadAnalytics(selectedFeature = null) {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    // Use globally stored moment objects, formatted for backend
    const startDate = currentStartDate.format('YYYY-MM-DD');
    const endDate = currentEndDate.format('YYYY-MM-DD');

    const age = document.getElementById('filterAge').value;
    const gender = document.getElementById('filterGender').value;

    const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        age: age,
        gender: gender
    });

    if (selectedFeature) {
        params.append('feature', selectedFeature);
    }

    try {
        const res = await fetch(`${API_URL}/analytics/?${params}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.status === 401) {
            handleLogout();
            return;
        }
        const data = await res.json();
        renderCharts(data, selectedFeature);
    } catch (err) {
        console.error(err);
    }
}

function renderCharts(data, selectedFeature) {
    const ctxBar = document.getElementById('barChart').getContext('2d');
    const ctxLine = document.getElementById('lineChart').getContext('2d');

    // Bar Chart
    const barLabels = data.bar_chart.map(d => d.feature_name);
    const barValues = data.bar_chart.map(d => d.count);

    // Destroy previous chart if exists
    if (charts.bar) charts.bar.destroy();

    charts.bar = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: barLabels,
            datasets: [{
                label: 'Total Clicks',
                data: barValues,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            onClick: (evt, activeElements) => {
                if (activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const feature = barLabels[index];
                    track(`bar_chart_zoom_${feature}`); // Track interaction
                    loadAnalytics(feature); // Update line chart
                }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Line Chart
    const lineLabels = data.line_chart.map(d => new Date(d.date).toLocaleDateString());
    const lineValues = data.line_chart.map(d => d.count);

    if (charts.line) charts.line.destroy();

    charts.line = new Chart(ctxLine, {
        type: 'line',
        data: {
            labels: lineLabels,
            datasets: [{
                label: selectedFeature ? `Clicks: ${selectedFeature}` : 'Total Clicks Trend',
                data: lineValues,
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Cookie Management for Filters
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function saveFilterPreference() {
    setCookie('filterStartDate', currentStartDate.format('YYYY-MM-DD'), 7);
    setCookie('filterEndDate', currentEndDate.format('YYYY-MM-DD'), 7);
    setCookie('filterAge', document.getElementById('filterAge').value, 7);
    setCookie('filterGender', document.getElementById('filterGender').value, 7);
}

function loadFilterPreferences() {
    // Date preferences are loaded in initDateRangePicker
    const age = getCookie('filterAge');
    const gender = getCookie('filterGender');

    if (age) document.getElementById('filterAge').value = age;
    if (gender) document.getElementById('filterGender').value = gender;
}
