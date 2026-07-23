export function renderNextTable(nextTable, rows, helpers) {
    const { getDaysSince, formatWeightList } = helpers;
    const bodyRows = rows.map((row) => `
        <tr>
            <td>${row.exercise}</td>
            <td>${getDaysSince(row.timestamp)}</td>
            <td>${formatWeightList(row.weights)}</td>
        </tr>
    `).join("");

    nextTable.innerHTML = `
        <table class="next-table">
            <thead>
                <tr>
                    <th>Exercise</th>
                    <th>Days since last done</th>
                    <th>Weights</th>
                </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
        </table>
    `;
}
