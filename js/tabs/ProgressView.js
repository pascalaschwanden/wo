export function renderProgressChart(canvas, state, currentChart) {
    const { rows, maxMonth } = state;

    const chartHeight = Math.max(300, rows.length * 45);
    canvas.parentElement.style.height = `${chartHeight}px`;

    if (currentChart) {
        currentChart.destroy();
    }

    const getColor = (row, border = false) => {
        if (!Number.isFinite(row.months)) {
            return border ? "#868e96" : "#adb5bd";
        }

        switch (row.progressGroup) {
            case "upper":
                return border ? "#0056b3" : "#007bff"; // blue
            case "lower":
                return border ? "#b0522a" : "#dc9935"; // red
            default:
                return border ? "#198754" : "#20c997"; // green
        }
    };

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels: rows.map((row) => row.label),
            datasets: [
                {
                    label: "Progress in months",
                    data: rows.map((row) =>
                        Number.isFinite(row.months) ? row.months : 0
                    ),
                    backgroundColor: rows.map((row) => getColor(row)),
                    borderColor: rows.map((row) => getColor(row, true)),
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

                            if (row.metric === "reps") {
                                return `${row.months.toFixed(1)} months from ${row.estimatedReps.toFixed(0)} reps`;
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