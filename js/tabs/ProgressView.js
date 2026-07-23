export function renderProgressChart(canvas, state, currentChart) {
    const { rows, maxMonth } = state;
    if (currentChart) {
        currentChart.destroy();
    }

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels: rows.map((row) => row.label),
            datasets: [
                {
                    label: "Progress in months",
                    data: rows.map((row) => Number.isFinite(row.months) ? row.months : 0),
                    backgroundColor: rows.map((row) => Number.isFinite(row.months) ? "#007bff" : "#adb5bd"),
                    borderColor: rows.map((row) => Number.isFinite(row.months) ? "#0056b3" : "#868e96"),
                    borderWidth: 1
                }
            ]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: (item) => {
                            const row = rows[item.dataIndex];
                            if (!Number.isFinite(row.months)) {
                                return "No matching entries";
                            }
                            return `${row.months.toFixed(1)} months from ${row.estimatedWeight.toFixed(1)} lbs x${row.targetReps}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: maxMonth,
                    ticks: {
                        callback: (value) => `${value}m`
                    },
                    title: {
                        display: true,
                        text: "Progress"
                    }
                },
                y: {
                    ticks: {
                        autoSkip: false
                    }
                }
            }
        }
    });
}
