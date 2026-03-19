import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware to parse JSON requests
app.use(express.json());

// Routes for different sections of the interview preparation materials
app.get('/dsa', (req, res) => {
    res.send('Data Structures and Algorithms section');
});

app.get('/system-design', (req, res) => {
    res.send('System Design section');
});

app.get('/low-level-design', (req, res) => {
    res.send('Low Level Design section');
});

app.get('/high-level-design', (req, res) => {
    res.send('High Level Design section');
});

app.get('/agentic-ai', (req, res) => {
    res.send('Agentic AI section');
});

app.get('/communication-skills', (req, res) => {
    res.send('Communication Skills section');
});

app.get('/languages', (req, res) => {
    res.send('Programming Languages section');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});