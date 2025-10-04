import React from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = ["#0088FE", "#FF8042", "#00C49F", "#FFBB28"];

export default function UserGauges({ stats }) {
  const checkpoints = Object.keys(stats);

  if (checkpoints.length === 0) return <p>No data yet</p>;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
      {checkpoints.map((cp, idx) => (
        <div key={cp} style={{ border: "1px solid #ddd", borderRadius: 12, padding: 20, minWidth: 250 }}>
          <h3>Checkpoint {cp}</h3>
          <PieChart width={200} height={200}>
            <Pie
              data={[{ name: "People", value: stats[cp] }]}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label
            >
              <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
            </Pie>
            <Tooltip />
          </PieChart>
          <p>Total: {stats[cp]}</p>
        </div>
      ))}
    </div>
  );
}
