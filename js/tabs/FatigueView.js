function destroyCharts(charts) {
    Object.values(charts).forEach((chart) => chart?.destroy());
}

function buildChart(canvas, chartStart, chartEnd, datasets, yAxisTitle, getDateLabel, xAxisTitle = "Week") {
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
                        title: (items) => `${xAxisTitle === "Week" ? "Week of " : ""}${getDateLabel(items[0].parsed.x)}`,
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
                    title: { display: true, text: xAxisTitle }
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

function createTestPanel(title, type, results, getDateLabel, onSubmitTest) {
    const panel = document.createElement("section");
    panel.className = "chart-panel";
    panel.innerHTML = `
        <h3>${title}</h3>
        <form class="fatigue-test-form">
            <input type="number" min="0" step="1" inputmode="numeric" required aria-label="${title} result">
            <button type="submit">Submit</button>
        </form>
    `;

    const form = panel.querySelector("form");
    const input = panel.querySelector("input");
    const submitButton = panel.querySelector("button");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const value = Number(input.value);
        if (!Number.isInteger(value) || value < 0) {
            input.setCustomValidity("Enter a whole number that is zero or greater.");
            input.reportValidity();
            return;
        }

        input.setCustomValidity("");
        submitButton.disabled = true;
        try {
            await onSubmitTest(type, value);
            form.reset();
        } catch (error) {
            console.error("Error saving fatigue test: ", error);
            alert("Failed to save test result. Check database rules.");
        } finally {
            submitButton.disabled = false;
        }
    });

    if (results.length === 0) {
        panel.insertAdjacentHTML("beforeend", "<p>No results yet.</p>");
        return { panel, chart: null };
    }

    const chartWrap = document.createElement("div");
    chartWrap.className = "chart-canvas-wrap";
    const canvas = document.createElement("canvas");
    chartWrap.appendChild(canvas);
    panel.appendChild(chartWrap);

    const chartStart = results[0].timestamp;
    const chartEnd = results.length > 1
        ? results[results.length - 1].timestamp
        : chartStart + (24 * 60 * 60);
    const chart = buildChart(
        canvas,
        chartStart,
        chartEnd,
        [{
            label: "Result",
            data: results.map((result) => ({ x: result.timestamp, y: result.value })),
            borderColor: "#007bff",
            backgroundColor: "#007bff",
            tension: 0.15,
            pointRadius: 4
        }],
        "Result",
        getDateLabel,
        "Date"
    );

    return { panel, chart };
}

export function renderFatigueView(container, currentCharts, state, helpers) {
    const { getDateLabel, testResults, onSubmitTest } = helpers;
    destroyCharts(currentCharts);
    container.innerHTML = "";

    let weeklySets = null;
    let weeklyFatigue = null;
    if (state.weeks.length === 0) {
        container.insertAdjacentHTML("beforeend", "<p>No weekly volume counts found.</p>");
    } else {
        const weeklySetsPanel = createChartPanel("Weekly Set Count");
        const weeklyFatiguePanel = createChartPanel("Weekly Fatigue");
        container.appendChild(weeklySetsPanel);
        container.appendChild(weeklyFatiguePanel);

        const chartStart = state.weeks[0].timestamp;
        const chartEnd = state.weeks.length > 1
            ? state.weeks[state.weeks.length - 1].timestamp
            : chartStart + (7 * 24 * 60 * 60);
        const baseDatasetOptions = { tension: 0.2, pointRadius: 3 };

        weeklySets = buildChart(
            weeklySetsPanel.querySelector("canvas"), chartStart, chartEnd,
            [
                { ...baseDatasetOptions, label: "Upper body", data: state.weeks.map((week) => ({ x: week.timestamp, y: week.upperSets })), borderColor: "#007bff", backgroundColor: "#007bff" },
                { ...baseDatasetOptions, label: "Lower body", data: state.weeks.map((week) => ({ x: week.timestamp, y: week.lowerSets })), borderColor: "#28a745", backgroundColor: "#28a745" },
                { ...baseDatasetOptions, label: "Cardio 2m", data: state.weeks.map((week) => ({ x: week.timestamp, y: week.cardioSets })), borderColor: "#fd7e14", backgroundColor: "#fd7e14" }
            ],
            "Sets", getDateLabel
        );

        weeklyFatigue = buildChart(
            weeklyFatiguePanel.querySelector("canvas"), chartStart, chartEnd,
            [
                { ...baseDatasetOptions, label: "Upper body fatigue", data: state.weeks.map((week) => ({ x: week.timestamp, y: week.upperFatigue })), borderColor: "#6f42c1", backgroundColor: "#6f42c1" },
                { ...baseDatasetOptions, label: "Lower body fatigue", data: state.weeks.map((week) => ({ x: week.timestamp, y: week.lowerFatigue })), borderColor: "#dc3545", backgroundColor: "#dc3545" }
            ],
            "Fatigue units", getDateLabel
        );
    }

    const carbonDioxide = createTestPanel(
        "Carbon dioxide tolerance test", "carbonDioxide",
        testResults.filter((result) => result.type === "carbonDioxide"), getDateLabel, onSubmitTest
    );
    const gripStrength = createTestPanel(
        "Grip Strength test", "gripStrength",
        testResults.filter((result) => result.type === "gripStrength"), getDateLabel, onSubmitTest
    );
    container.appendChild(carbonDioxide.panel);
    container.appendChild(gripStrength.panel);

    return { weeklySets, weeklyFatigue, carbonDioxide: carbonDioxide.chart, gripStrength: gripStrength.chart };
}
