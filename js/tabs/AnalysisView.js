function renderAnalysisTable(title, tableRows, periods, helpers) {
    const { formatPercent, getAverage } = helpers;
    const totals = {};
    periods.forEach((period) => {
        totals[period.key] = getAverage(tableRows.map((row) => row.trends[period.key]));
    });

    const headerCells = periods.map((period) => `<th>${period.label}</th>`).join("");
    const bodyRows = tableRows.length === 0
        ? `<tr><td colspan="${periods.length + 1}">No entries found.</td></tr>`
        : tableRows.map((row) => `
            <tr>
                <td>${row.exercise}</td>
                ${periods.map((period) => `<td>${formatPercent(row.trends[period.key])}</td>`).join("")}
            </tr>
        `).join("");
    const footerCells = periods.map((period) => `<td>${formatPercent(totals[period.key])}</td>`).join("");

    return `
        <h3>${title}</h3>
        <table class="analysis-table">
            <thead>
                <tr>
                    <th>Exercise</th>
                    ${headerCells}
                </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
            <tfoot>
                <tr>
                    <td>Average</td>
                    ${footerCells}
                </tr>
            </tfoot>
        </table>
    `;
}

export function renderAnalysis(analysisTable, state, helpers) {
    if (state.isEmpty) {
        analysisTable.innerHTML = "<p>No entries found.</p>";
        return;
    }

    analysisTable.innerHTML = state.tables
        .map((table) => renderAnalysisTable(table.title, table.rows, state.periods, helpers))
        .join("");
}
