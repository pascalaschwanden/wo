function destroyCharts(charts) {
    Object.values(charts).forEach((chart) => chart?.destroy());
}

function buildChart(canvas, weeks, chartStart, chartEnd, datasets, yAxisTitle, getDateLabel) {
    return new Chart(canvas, {
        type: "line",
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        title: (items) => `Week of ${getDateLabel(items[0].parsed.x)}`,
                        label: (item) => `${item.dataset.label}: ${item.parsed.y.toFixed(1)}`
                    }
                }
            },
            scales: {
                x: {
                    type: "linear",
                    min: chartStart,
                    max: chartEnd,
                    ticks: {
                        callback: (value) => getDateLabel(value),
                        maxTicksLimit: 10
                    },
                    title: { display: true, text: "Week" }
                },
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 },
                    title: { display: true, text: yAxisTitle }
                }
            }
        }
    });
}

function createChartPanel(title) {
    const panel = document.createElement("section");
    panel.className = "chart-panel";
    panel.innerHTML = `<h3>${title}</h3><div class="chart-canvas-wrap"><canvas></canvas></div>`;
    return panel;
}

export function renderFatigueView(container, currentCharts, state, helpers) {
    const { getDateLabel } = helpers;
    destroyCharts(currentCharts);
    container.innerHTML = "";

    if (state.weeks.length === 0) {
        container.innerHTML = "<p>No weekly volume counts found.</p>";
        return { weeklySets: null, weeklyFatigue: null };
    }

    const weeklySetsPanel = createChartPanel("Weekly Set Count");
    const weeklyFatiguePanel = createChartPanel("Weekly Fatigue");
    container.appendChild(weeklySetsPanel);
    container.appendChild(weeklyFatiguePanel);

    const chartStart = state.weeks[0].timestamp;
    const chartEnd = state.weeks.length > 1
        ? state.weeks[state.weeks.length - 1].timestamp
        : chartStart + (7 * 24 * 60 * 60);
    const baseDatasetOptions = { tension: 0.2, pointRadius: 3 };

    const weeklySets = buildChart(
        weeklySetsPanel.querySelector("canvas"),
        state.weeks,
        chartStart,
        chartEnd,
        [
            {
                ...baseDatasetOptions,
                label: "Upper body",
                data: state.weeks.map((week) => ({ x: week.timestamp, y: week.upperSets })),
                borderColor: "#007bff",
                backgroundColor: "#007bff"
            },
            {
                ...baseDatasetOptions,
                label: "Lower body",
                data: state.weeks.map((week) => ({ x: week.timestamp, y: week.lowerSets })),
                borderColor: "#28a745",
                backgroundColor: "#28a745"
            },
            {
                ...baseDatasetOptions,
                label: "Cardio 10m",
                data: state.weeks.map((week) => ({ x: week.timestamp, y: week.cardioSets })),
                borderColor: "#fd7e14",
                backgroundColor: "#fd7e14"
            }
        ],
        "Sets",
        getDateLabel
    );

    const weeklyFatigue = buildChart(
        weeklyFatiguePanel.querySelector("canvas"),
        state.weeks,
        chartStart,
        chartEnd,
        [
            {
                ...baseDatasetOptions,
                label: "Upper body fatigue",
                data: state.weeks.map((week) => ({ x: week.timestamp, y: week.upperFatigue })),
                borderColor: "#6f42c1",
                backgroundColor: "#6f42c1"
            },
            {
                ...baseDatasetOptions,
                label: "Lower body fatigue",
                data: state.weeks.map((week) => ({ x: week.timestamp, y: week.lowerFatigue })),
                borderColor: "#dc3545",
                backgroundColor: "#dc3545"
            }
        ],
        "Fatigue units",
        getDateLabel
    );

    return { weeklySets, weeklyFatigue };
}
