import express from 'express';
import QRCode from 'qrcode';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

const payments = new Map();
const clients = new Map();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.post('/create-payment', async (req, res) => {
    const paymentId = uuidv4();
    payments.set(paymentId, { status: 'pending' });

    const qrUrl = `https://qpay-mock.onrender.com/pay/${paymentId}`;
    const qr = await QRCode.toDataURL(qrUrl);

    res.json({ paymentId, qr });
    console.error('working')
});

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