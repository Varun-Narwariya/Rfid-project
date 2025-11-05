import React, { useEffect, useState } from "react";

export default function BroadcastListener() {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8080/events");

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "emergency") {
        setAlert(data.message);
        // Optional 🔊 voice alert
        const speech = new SpeechSynthesisUtterance(data.message);
        speech.lang = "en-IN";
        speech.pitch = 1;
        speech.rate = 1;
        window.speechSynthesis.speak(speech);
      }
    };

    return () => eventSource.close();
  }, []);

  if (!alert) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        backgroundColor: "red",
        color: "white",
        padding: "20px 30px",
        borderRadius: "10px",
        boxShadow: "0 0 10px rgba(0,0,0,0.5)",
        fontSize: "1.2em",
        zIndex: 9999,
      }}
    >
      🚨 <b>EMERGENCY:</b> {alert}
    </div>
  );
}
