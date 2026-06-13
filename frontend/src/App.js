import { useEffect, useState } from "react";
import "./App.css";
import tumbleImg from './assets/tumble.png'

const WAN_BASE = "https://tumble.ludavidyi.us";

const STATUS_PATH = "/status";
const EVENTS_PATH = "/events";

function Card({ title, status, events, topCount = 4, onViewAll }) {
  const visible = (events || []).slice(0, topCount);

  return (
    <div className="card">
      <h2>{title}</h2>

      <div
        className={`status ${
          status === "RUNNING" ? "running" : "idle"
        }`}
      >
        {status || "No data yet"}
      </div>

      <div className="events">
        <h3>History</h3>

        {!events || events.length === 0 ? (
          <p className="no-events">No events</p>
        ) : (
          <>
            <ul>
              {visible.map((e) => (
                <li key={e.id}>
                  <span className="event-type">{e.event}</span>{" "}
                  —{" "}
                  <span className="event-time">
                    {new Date(e.timestamp).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>

            {events.length > topCount && (
              <div className="view-all-row">
                <button
                  className="view-all-btn"
                  onClick={() => onViewAll && onViewAll(title, events)}
                >
                  View all ({events.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [dryer, setDryer] = useState(null);
  const [washer, setWasher] = useState(null);

  const [dryerEvents, setDryerEvents] = useState([]);
  const [washerEvents] = useState([]); // always empty
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalEvents, setModalEvents] = useState([]);

  function openModal(title, events) {
    setModalTitle(title);
    setModalEvents(events || []);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setModalTitle("");
    setModalEvents([]);
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );

    const base64 =
      (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const rawData = atob(base64);

    return Uint8Array.from([...rawData].map(
      (c) => c.charCodeAt(0)
    ));
  }

  async function enablePush() {
    try {
      // 1. Ask permission
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        alert("Notifications blocked");
        return;
      }

      // 2. Get VAPID key from backend
      const res = await fetch(WAN_BASE + "/vapidPublicKey");
      const { publicKey } = await res.json();

      const reg = await navigator.serviceWorker.ready;

      let subscription = await reg.pushManager.getSubscription();

      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      await fetch(WAN_BASE + "/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      alert("Notifications enabled!");
    } catch (err) {
      alert("Error: " + err.message);  // ← shows error on mobile
      console.error(err);
    }
  }

  async function fetchStatus() {
    try {
      const [statusRes, eventsRes] =
        await Promise.all([
          fetch(WAN_BASE + STATUS_PATH),
          fetch(
            WAN_BASE +
              EVENTS_PATH +
              "?page=1&limit=50"
          ),
        ]);

      const statusData =
        await statusRes.json();

      const eventsData =
        await eventsRes.json();

      setDryer(statusData.dryer);
      setWasher(statusData.washer);

      // only dryer has real events
      setDryerEvents(
        eventsData.events || []
      );
    } catch (err) {
      console.error("Fetch failed:", err);
    }
  }

  useEffect(() => {
    fetchStatus();

    const interval = setInterval(
      fetchStatus,
      2000
    );

    return () =>
      clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src={tumbleImg} 
          alt="Description of image" 
          style={{ height: '100px', width: 'auto' }} 
        />
        <h1 className="app-title" style={{ margin: 0 }}>
          Tumble
        </h1>
      </div>

      <p className="app-subtitle">
        IoT Laundry Event Notification System
      </p>

      <button onClick={enablePush}>
        Enable Notifications
      </button>

      <div className="notify-instructions">
        <p>
          <strong>Safari (iOS) users:</strong> To enable persistent notifications,
          open this site in Safari, tap the Share button, then select "Add to Home Screen".
          Launching the app from your Home Screen helps notifications work more reliably.
        </p>
      </div>

      <Card
        title="Washer"
        status={washer?.status}
        events={washerEvents}
        onViewAll={openModal}
      />

      <Card
        title="Dryer"
        status={dryer?.status}
        events={dryerEvents}
        onViewAll={openModal}
      />

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalTitle} — Full History</h3>
              <button className="modal-close" onClick={closeModal}>
                Close
              </button>
            </div>

            <div className="modal-list">
              {modalEvents.length === 0 ? (
                <p className="no-events">No events</p>
              ) : (
                <>
                  {modalEvents.length > 20 && (
                    <p className="modal-note">Showing latest 20 of {modalEvents.length} events</p>
                  )}
                  <ul>
                    {modalEvents.slice(0, 20).map((e) => (
                      <li key={e.id}>
                        <span className="event-type">{e.event}</span> — <span className="event-time">{new Date(e.timestamp).toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <p>
        Notifications:{" "}
        {Notification?.permission}
      </p>
    </div>
  );
}