export function renderAthleteView(benchmarkState) {
    const bodyweight = 150;

    const strengthData = [
        { exercise: "Bench Press",           values: [0.75, 1.0, 1.3, 1.5, 1.75] },
        { exercise: "Squat",                 values: [1.0, 1.2, 1.5, 1.75, 2.0] },
        { exercise: "Deadlift",              values: [1.0, 1.3, 1.65, 2.0, 2.5] },
        { exercise: "Military Press",        values: [0.5, 0.65, 0.85, 1.0, 1.25] },
        { exercise: "Barbell Row",           values: [0.6, 0.8, 1.0, 1.2, 1.4] },
        { exercise: "Good Morning",           values: [0.4, 0.55, 0.7, 0.85, 1.0] },
        { exercise: "Barbell Bicep Curl",    values: [0.25, 0.35, 0.45, 0.55, 0.65] },
        { exercise: "Skull Crushers",        values: [0.25, 0.35, 0.45, 0.55, 0.65] },
        { exercise: "Squat - bulgarian",     values: [0.35, 0.5, 0.65, 0.8, 1.0] },
        // { exercise: "Calf Raises, single", values: [0.25, 0.4, 0.55, 0.7, 0.85] },
        { exercise: "Side Laterals",         values: [0.1, 0.15, 0.2, 0.25, 0.30] },
        { exercise: "Hip Thrust",            values: [1, 1.5, 2, 2.5, 3] },
        { exercise: "Pull ups",              values: [3, 8, 12, 15, 20], pullups: true }
    ];

    const levels = [
        "Decent",
        "Good",
        "Optimal",
        "Advanced",
        "Athlete"
    ];


    // ---------------------------------------------------------
    // Get the current 1RM from the benchmark chart data
    // ---------------------------------------------------------

    const currentOneRMs = {};

    if (benchmarkState?.charts) {
        benchmarkState.charts.forEach(chart => {

            if (
                !chart.empty &&
                chart.visiblePoints &&
                chart.visiblePoints.length > 0
            ) {
                const lastPoint =
                    chart.visiblePoints[
                        chart.visiblePoints.length - 1
                    ];

                currentOneRMs[chart.name] = lastPoint.y;
            }
        });
    }


    // ---------------------------------------------------------
    // Formatting
    // ---------------------------------------------------------

    function formatNumber(value) {
        return Math.round(value).toString();
    }

    function formatMultiple(value) {
        return `×${value
            .toFixed(2)
            .replace(/0+$/, "")
            .replace(/\.$/, "")}`;
    }


    // ---------------------------------------------------------
    // Convert 1RM to equivalent rep max
    // ---------------------------------------------------------

    function repMax(oneRM, reps) {
        return oneRM / (1 + reps / 30);
    }


    // ---------------------------------------------------------
    // Determine the highest benchmark level reached
    // ---------------------------------------------------------

    function getCurrentLevel(row) {

        const currentValue =
            currentOneRMs[row.exercise];

        if (
            currentValue === null ||
            currentValue === undefined
        ) {
            return -1;
        }

        let currentLevel = -1;

        row.values.forEach((benchmark, index) => {

            const benchmarkValue =
                row.pullups
                    ? benchmark
                    : benchmark * bodyweight;

            if (currentValue >= benchmarkValue) {
                currentLevel = index;
            }
        });

        return currentLevel;
    }


    // ---------------------------------------------------------
    // Create table
    // ---------------------------------------------------------

    function createTable(
        title,
        getValue,
        formatValue = formatNumber,
        getCurrentValue = null,
        formatCurrentValue = formatNumber
    ) {

        let table = `
            <h4>${title}</h4>

            <table class="strength-table mope">

                <tbody>
                    <tr>
                        <td>Exercise</td>

                        ${levels.map(
                            level => `<td>${level}</td>`
                        ).join("")}

                    </tr>
        `;


        strengthData.forEach(row => {

            const currentLevel =
                getCurrentLevel(row);

            const currentOneRM =
                currentOneRMs[row.exercise];

            table += `
                <tr>
                    <td>${row.exercise}</td>
            `;


            row.values.forEach((value, index) => {

                const calculatedValue =
                    getValue(row, value, index);

                const isCurrentLevel =
                    index === currentLevel;


                const displayedValue =
                    formatValue(
                        calculatedValue,
                        row
                    );


                // Show the user's actual current value
                // underneath the benchmark value.
                let currentValueDisplay = "";

                if (
                    isCurrentLevel &&
                    currentOneRM !== null &&
                    currentOneRM !== undefined &&
                    getCurrentValue
                ) {
                    const currentValue =
                        getCurrentValue(
                            row,
                            currentOneRM
                        );

                    currentValueDisplay = `
                        <br>
                        <small>
                            ${formatCurrentValue(
                                currentValue,
                                row
                            )}
                        </small>
                    `;
                }


                table += `
                    <td class="${
                        isCurrentLevel
                            ? "current-strength-level"
                            : ""
                    }">
                        ${displayedValue}
                        ${currentValueDisplay}
                    </td>
                `;
            });


            table += `
                </tr>
            `;
        });


        table += `
                </tbody>
            </table>
        `;

        return table;
    }


    // ---------------------------------------------------------
    // Multiples
    // ---------------------------------------------------------

    const multiplesTable = createTable(

        "Strength Standards — Multiples of Bodyweight",

        (row, value) =>
            value,

        (value, row) =>
            row.pullups
                ? formatNumber(value)
                : formatMultiple(value),

        // Current value as a bodyweight multiple
        (row, currentOneRM) =>
            row.pullups
                ? currentOneRM
                : currentOneRM / bodyweight,

        (value, row) =>
            row.pullups
                ? formatNumber(value)
                : formatMultiple(value)
    );


    // ---------------------------------------------------------
    // 150 lb bodyweight
    // ---------------------------------------------------------

    const bodyweightTable = createTable(

        "Strength Standards — 150 lb Bodyweight",

        (row, value) =>
            row.pullups
                ? value
                : value * bodyweight,

        formatNumber,

        // Current 1RM
        (row, currentOneRM) =>
            row.pullups
                ? currentOneRM
                : currentOneRM,

        (value, row) =>
            row.pullups
                ? formatNumber(value)
                : `${formatNumber(value)} lb`
    );


    // ---------------------------------------------------------
    // 5 Rep Max
    // ---------------------------------------------------------

    const fiveRepTable = createTable(

        "5-Rep Max Equivalent",

        (row, value) =>
            row.pullups
                ? value
                : repMax(
                    value * bodyweight,
                    5
                ),

        formatNumber,

        // Current 5RM calculated from current 1RM
        (row, currentOneRM) =>
            row.pullups
                ? currentOneRM
                : repMax(currentOneRM, 5),

        (value, row) =>
            row.pullups
                ? formatNumber(value)
                : `${formatNumber(value)} lb`
    );


    // ---------------------------------------------------------
    // 10 Rep Max
    // ---------------------------------------------------------

    const tenRepTable = createTable(

        "10-Rep Max Equivalent",

        (row, value) =>
            row.pullups
                ? value
                : repMax(
                    value * bodyweight,
                    10
                ),

        formatNumber,

        // Current 10RM calculated from current 1RM
        (row, currentOneRM) =>
            row.pullups
                ? currentOneRM
                : repMax(currentOneRM, 10),

        (value, row) =>
            row.pullups
                ? formatNumber(value)
                : `${formatNumber(value)} lb`
    );


    // ---------------------------------------------------------
    // 20 Rep Max
    // ---------------------------------------------------------

    const twentyRepTable = createTable(

        "20-Rep Max Equivalent",

        (row, value) =>
            row.pullups
                ? value
                : repMax(
                    value * bodyweight,
                    20
                ),

        formatNumber,

        // Current 20RM calculated from current 1RM
        (row, currentOneRM) =>
            row.pullups
                ? currentOneRM
                : repMax(currentOneRM, 20),

        (value, row) =>
            row.pullups
                ? formatNumber(value)
                : `${formatNumber(value)} lb`
    );


    // ---------------------------------------------------------
    // Render
    // ---------------------------------------------------------

    const html = `
        ${multiplesTable}
        ${bodyweightTable}
        ${fiveRepTable}
        ${tenRepTable}
        ${twentyRepTable}
    `;

    document.querySelector(
        ".athlete-view-content"
    ).innerHTML = html;
}