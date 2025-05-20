"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function Home() {
  const [qr, setQr] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const startPayment = async () => {
    const res = await fetch("http://localhost:8000/create-payment", {
      method: "POST",
    });
    const data = await res.json();
    setQr(data.qr);
    setPaymentId(data.paymentId);
  };

  useEffect(() => {
    if (!paymentId) return;

    const ws = new WebSocket("ws://localhost:8000");

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "watch", paymentId }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.status === "paid") {
        setStatus("✅ Payment Successful!");
        ws.close();
      }
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    return () => ws.close();
  }, [paymentId]);

  return (
    <main style={{ padding: "2rem" }}>
      <h1>🛒 QR Code Payment</h1>
      <button
        onClick={startPayment}
        style={{ padding: "10px 20px", fontSize: "1.2rem" }}
      >
        Pay Now
      </button>

      {qr && (
        <div style={{ marginTop: "2rem" }}>
          <p>Scan this QR code to pay:</p>
          <Image src={qr} alt="qr code" />
          <img src={qr} alt="QR Code" />
        </div>
      )}

      {status && (
        <h2 style={{ color: "green", marginTop: "1rem" }}>{status}</h2>
      )}
    </main>
  );
}
