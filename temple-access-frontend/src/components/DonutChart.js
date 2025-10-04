import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function DonutChart({ data={} }) {
  const labels = Object.keys(data);
  const values = labels.map(l => data[l] || 0);

  const chartData = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: [
        "#00bcd4","#ff9800","#8e44ad","#4caf50","#e91e63","#2196f3"
      ],
      borderWidth: 0
    }]
  };

  return <div style={{maxWidth:520}}><Doughnut data={chartData} /></div>;
}
