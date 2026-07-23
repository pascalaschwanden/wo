function getJumpId(name) {
    return `jump_${name.toLowerCase().replace(" ", "")}`;
}

function renderSummaryTable(container, summaryRows) {
    const summaryTable = document.createElement("table");
    summaryTable.className = "benchmark-summary-table";
    summaryTable.innerHTML = `
        <thead>
            <tr>
                <th>Exercise</th>
                <th>Lbs Δ</th>
                <th>% Δ</th>
                <th>Lbs / 30d</th>
                <th>% / 30d</th>
            </tr>
        </thead>
    `;

    const tbody = document.createElement("tbody");
    summaryRows.forEach((row) => {
        const tr = document.createElement("tr");
        const jumpTo = getJumpId(row.name);
        tr.innerHTML = `
            <td><a href="#${jumpTo}">${row.name}</a></td>
            <td>${row.deltaLbs.toFixed(1)}</td>
            <td>${row.percent.toFixed(1)}%</td>
            <td>${row.deltaLbs30.toFixed(2)}</td>
            <td>${row.percent30.toFixed(1)}%</td>
        `;
        tbody.appendChild(tr);
    });

    summaryTable.appendChild(tbody);
    container.appendChild(summaryTable);
}

function renderBenchmarkPanel(chartsContainer, chartState, chartsByKey, helpers) {
    const { getDateLabel } = helpers;
    const panel = document.createElement("div");
    panel.className = "chart-panel";
    panel.id = getJumpId(chartState.name);

    const title = document.createElement("h3");
    title.textContent = chartState.name;
    panel.appendChild(title);

    if (chartState.empty) {
        const emptyMessage = document.createElement("p");
        emptyMessage.textContent = "No benchmark entries found.";
        panel.appendChild(emptyMessage);
        chartsContainer.appendChild(panel);
        return;
    }

    const canvasWrap = document.createElement("div");
    canvasWrap.className = "chart-canvas-wrap";
    const canvas = document.createElement("canvas");
    canvasWrap.appendChild(canvas);
    panel.appendChild(canvasWrap);
    chartsContainer.appendChild(panel);

    const chart = new Chart(canvas, {
        type: "line",
        data: {
            datasets: [
                {
                    label: "Estimated 6RM",
                    data: chartState.visiblePoints,
                    borderColor: "#007bff",
                    backgroundColor: "#007bff",
                    showLine: false,
                    pointRadius: 4
                },
                {
                    label: "Your best-fit trend",
                    data: chartState.yourTrendPoints,
                    borderColor: "#28a745",
                    backgroundColor: "#28a745",
                    pointRadius: 0,
                    tension: 0
                },
                {
                    label: "Typical lifter",
                    data: chartState.typicalPoints,
                    borderColor: "#dc3545",
                    backgroundColor: "#dc3545",
                    borderDash: [6, 5],
                    pointRadius: 0,
                    tension: 0
                }
            ]
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
                        title: (items) => getDateLabel(items[0].parsed.x),
                        label: (item) => `${item.dataset.label}: ${item.parsed.y.toFixed(1)} lbs`
                    }
                }
            },
            scales: {
                x: {
                    type: "linear",
                    min: chartState.chartStart,
                    max: chartState.chartEnd,
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
                    min: chartState.yMin,
                    title: {
                        display: true,
                        text: "Lifting Weight"
                    }
                }
            }
        }
    });

    chartsByKey.set(chartState.name, chart);
}

export function renderBenchmarksView(benchmarkGrid, chartsByKey, state, helpers) {
    chartsByKey.forEach((chart) => chart.destroy());
    chartsByKey.clear();
    benchmarkGrid.innerHTML = "";

    const tableContainer = document.createElement("div");
    const chartsContainer = document.createElement("div");
    benchmarkGrid.appendChild(tableContainer);
    benchmarkGrid.appendChild(chartsContainer);

    renderSummaryTable(tableContainer, state.summaryRows);
    state.charts.forEach((chartState) => {
        renderBenchmarkPanel(chartsContainer, chartState, chartsByKey, helpers);
    });
}
