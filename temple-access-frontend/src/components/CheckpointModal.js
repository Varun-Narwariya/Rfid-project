import React, { useEffect, useState } from "react";

export default function CheckpointModal({ cp, onClose }) {
  const [users, setUsers] = useState([]);

  useEffect(()=> {
    fetch(`http://localhost:8080/checkpoint/${encodeURIComponent(cp)}`)
      .then(r=>r.json()).then(setUsers).catch(()=>setUsers([]));
  }, [cp]);

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Users at {cp}</h3>
        <div style={{maxHeight: '60vh', overflowY:'auto'}}>
          {users.length === 0 ? <p>No users at this checkpoint.</p> :
            users.map((u, i) => (
              <div key={i} className="user-row">
                <div><b>{u.uid}</b></div>
                <div>{u.name || 'N/A'}</div>
                <div>{new Date(u.time).toLocaleString()}</div>
              </div>
            ))
          }
        </div>
        <div style={{textAlign:'right', marginTop:10}}>
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
