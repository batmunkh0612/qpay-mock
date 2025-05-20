import express from 'express';
import QRCode from 'qrcode';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const port = 8000;
app.use(cors());
app.use(express.json());

// Store payments in-memory (replace with DB in real app)
const payments = new Map();
const clients = new Map(); // WebSocket clients by paymentId

// Serve frontend files
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Create QR and payment entry
app.post('/create-payment', async (req, res) => {
    const paymentId = uuidv4();
    payments.set(paymentId, { status: 'pending' });

    const qrUrl = `http://localhost:8000/pay/${paymentId}`;
    const qr = await QRCode.toDataURL(qrUrl);

    res.json({ paymentId, qr });
    console.error('working')
});

// Simulate scan & payment (QR scan triggers this)
// Simulate scan & payment (QR scan triggers this)
app.get('/pay/:paymentId', (req, res) => {
    const { paymentId } = req.params;

    if (payments.has(paymentId)) {
        payments.set(paymentId, { status: 'paid' });

        // Notify frontend via WebSocket
        const client = clients.get(paymentId);
        if (client) {
            client.send(JSON.stringify({ status: 'paid' }));
        }

        res.send(`<h1>✅ Payment for ${paymentId} successful!</h1>`);
    } else {
        res.status(404).send('Invalid payment ID');
    }
});

// Start WebSocket serve
const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

const wss = new WebSocketServer({ server });


wss.on('connection', (ws, req) => {
    ws.on('message', msg => {
        const data = JSON.parse(msg);
        if (data.type === 'watch' && data.paymentId) {
            clients.set(data.paymentId, ws);
        }
    });
});