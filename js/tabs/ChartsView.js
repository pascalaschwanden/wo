export function renderChartsView(chartGrid, chartsByKey, groupedEntries, options) {
    const { activeChartCategory, getChartRange, getDateLabel, getLineColor } = options;
    chartsByKey.forEach((chart) => chart.destroy());
    chartsByKey.clear();
    chartGrid.innerHTML = "";

    if (groupedEntries.size === 0) {
        chartGrid.innerHTML = `<p>No ${activeChartCategory.toLowerCase()} exercise entries found.</p>`;
        return;
    }

    Array.from(groupedEntries.entries())
        .sort(([, a], [, b]) => a.exercise.localeCompare(b.exercise))
        .forEach(([key, group]) => {
            const { start, end } = getChartRange();
            const weightEntries = Array.from(group.weights.entries())
                .sort(([a], [b]) => Number(a) - Number(b));

            const panel = document.createElement("div");
            panel.className = "chart-panel";

            const title = document.createElement("h3");
            title.textContent = group.exercise;

            const canvasWrap = document.createElement("div");
            canvasWrap.className = "chart-canvas-wrap";

            const canvas = document.createElement("canvas");
            canvasWrap.appendChild(canvas);

            panel.appendChild(title);
            panel.appendChild(canvasWrap);
            chartGrid.appendChild(panel);

            const chart = new Chart(canvas, {
                type: "line",
                data: {
                    datasets: weightEntries.map(([weight, points], index) => {
                        const color = getLineColor(index);

                        return {
                            label: `${weight} lbs`,
                            data: points
                                .slice()
                                .sort((a, b) => a.timestamp - b.timestamp)
                                .map((point) => ({
                                    x: point.timestamp,
                                    y: point.reps
                                })),
                            borderColor: color,
                            backgroundColor: color,
                            tension: 0.2,
                            spanGaps: true
                        };
                    })
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true
                        },
                        tooltip: {
                            callbacks: {
                                title: (items) => getDateLabel(items[0].parsed.x)
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: "linear",
                            min: start,
                            max: end,
                            ticks: {
                                callback: (value) => getDateLabel(value),
                                maxTicksLimit: 8
                            },
                            title: {
                                display: true,
                                text: "Date"
                            }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            },
                            title: {
                                display: true,
                                text: "Reps"
                            }
                        }
                    }
                }
            });

            chartsByKey.set(key, chart);
        });
}
