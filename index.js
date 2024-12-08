const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3001;

// CORS configuration
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'DELETE'],
    allowedHeaders: ['Content-Type'],
    credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(express.static('public'));

// Log CORS requests
app.use((req, res, next) => {
    console.log('\n=== CORS Request ===');
    console.log('Origin:', req.headers.origin);
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('==================\n');
    next();
});

// Database setup
const db = new sqlite3.Database('./medications.db');

// Create table if not exists
db.run(`CREATE TABLE IF NOT EXISTS medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    med_name TEXT,
    compartment_number INTEGER,
    time TEXT,
    count INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// TEMPORARILY COMMENTED OUT ESP32 COMMUNICATION

// const serialPort = new SerialPort({
//     path: '/dev/ttyUSB0',
//     baudRate: 115200
// });

// serialPort.on('open', () => {
//     console.log('Serial port connection established with ESP32');
// });

// serialPort.on('error', (err) => {
//     console.error('Serial Port Error:', err.message);
// });

// serialPort.on('data', (data) => {
//     console.log('Received from ESP32:', data.toString());
// });

// Add server startup logging
// REMOVE or COMMENT OUT this first app.listen
// app.listen(port, () => {
//     console.log('=== Server Status ===');
//     console.log(`Server started at: ${new Date()}`);
//     console.log(`Running on: http://localhost:${port}`);
//     console.log('===================\n');
// });

// Add database connection logging
db.on('open', () => {
    console.log('=== Database Status ===');
    console.log('SQLite database connected successfully');
    console.log('Database location:', './medications.db');
    console.log('=====================\n');
});

// Enhanced medication submission endpoint with logging
app.post('/submit-medication', (req, res) => {
    console.log('\n=== New Medication Submission ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request Body:', JSON.stringify(req.body, null, 2));

    const { medName, compartmentNumber, time, count } = req.body;

    // Validate input
    if (!medName || !compartmentNumber || !time || !count) {
        console.log('Validation Error: Missing required fields');
        console.log('Received values:', { medName, compartmentNumber, time, count });
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Log validated data
    console.log('Validated Data:');
    console.log({
        medName,
        compartmentNumber,
        time,
        count,
        timestamp: new Date().toISOString()
    });

    // Insert into database
    const stmt = db.prepare('INSERT INTO medications (med_name, compartment_number, time, count) VALUES (?, ?, ?, ?)');
    stmt.run(medName, compartmentNumber, time, count, function(err) {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }

        console.log('Database Insert Success:');
        console.log('Row ID:', this.lastID);
        
        // Immediately return success since ESP32 communication is disabled
        console.log('Operation completed successfully');
        console.log('==============================\n');
        
        res.status(200).json({ 
            message: 'Medication submitted successfully (ESP32 communication disabled)',
            recordId: this.lastID
        });
    });
    stmt.finalize();
});

// GET endpoint to fetch all medications with logging
app.get('/medications', (req, res) => {
    db.all('SELECT * FROM medications ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }
        res.status(200).json(rows);
    });
});

// DELETE endpoint to remove a medication with logging
app.delete('/medications/:id', (req, res) => {
    console.log('\n=== Delete Medication Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Medication ID:', req.params.id);

    const { id } = req.params;

    db.run('DELETE FROM medications WHERE id = ?', id, function(err) {
        if (err) {
            console.error('Database Error:', err);
            return res.status(500).json({ message: 'Database error', error: err });
        }

        if (this.changes === 0) {
            console.log('Medication not found');
            return res.status(404).json({ message: 'Medication not found' });
        }

        console.log('Successfully deleted medication');
        console.log('Affected rows:', this.changes);
        console.log('============================\n');

        res.status(200).json({ 
            message: 'Medication deleted successfully',
            deletedId: id
        });
    });
});

// GET endpoint to check all medications and return command if time matches
app.get('/format-command', (req, res) => {
    console.log('\n=== Format Command Request ===');
    console.log('Timestamp:', new Date().toISOString());

    // Get current time in HH:mm format
    const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit'
    });

    console.log('Current time:', currentTime);

    db.get('SELECT compartment_number, count, time FROM medications WHERE time = ?', [currentTime], (err, row) => {
        if (err) {
            console.error('Database Error:', err);
            return res.send('0 0');
        }

        if (!row) {
            console.log('No medication scheduled for current time');
            console.log('============================\n');
            return res.send('0 0');
        }

        const formattedString = `${row.compartment_number} ${row.count}`;
        console.log('Time matches - Formatted String:', formattedString);
        console.log('============================\n');
        res.send(formattedString);
    });
});

// Add error logging for uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('\n=== Uncaught Exception ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Error:', err);
    console.error('========================\n');
});

// Add error logging for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n=== Unhandled Promise Rejection ===');
    console.error('Timestamp:', new Date().toISOString());
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    console.error('========================\n');
});

// Keep only this last app.listen at the bottom of the file
app.listen(port, () => {
    console.log("Medication Tracker backend running at http://localhost:" + port);
});