export function renderAthleteView(benchmarkState) {
    const bodyweight = 150;
    console.dir(benchmarkState);

    const strengthData = [
        { exercise: "Bench Press",           values: [0.75, 1.0, 1.3, 1.5, 1.75] },
        { exercise: "Squat",                 values: [1.0, 1.2, 1.5, 1.75, 2.0] },
        { exercise: "Deadlift",              values: [1.0, 1.3, 1.65, 2.0, 2.5] },
        { exercise: "Military Press",        values: [0.41, 0.57, 0.77, 1.01,1.26]},
        { exercise: "Barbell Row",           values: [0.56,0.80, 1.1, 1.44, 1.82] },
        //{ exercise: "Good Morning",           values: [0.4, 0.55, 0.7, 0.85, 1.0] },
        { exercise: "Barbell Bicep Curl",    values: [0.26, 0.41, .59, .82, 1.07] },
        { exercise: "Skull Crushers",        values: [0.23, 0.36, 0.53, 0.75, 0.98] },
        //{ exercise: "Squat - bulgarian",     values: [0.21, 0.46, 0.82, 1.29, 1.84] },
        // { exercise: "Calf Raises, single", values: [0.25, 0.4, 0.55, 0.7, 0.85] },
        { exercise: "Side Laterals",         values: [0.067, 0.13, 0.2, 0.3, 0.40] },
        { exercise: "Hip Thrust",            values: [0.62, 1.13, 1.83, 2.71, 3.69] },
        { exercise: "Pull ups",              values: [3, 8, 12, 15, 20], byReps: true },
        { exercise: "Push ups",                 values: [13, 15, 23, 29, 35], byReps: true },
        { exercise: "Chin ups",                 values: [7, 13, 21, 30, 35], byReps: true },
        //{ exercise: "Leg Raises",               values: [8, 17, 28, 39, 45], byReps: true },
        //{ exercise: "Vertical Dips",            values: [8, 15, 20, 25, 30], byReps: true },
        //{ exercise: "Calf Raises, single",      values: [13, 25, 35, 45, 50], byReps: true }
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

    // const currentOneRMs = {};

    if (benchmarkState?.charts) {
        benchmarkState.charts.forEach((chart, x) => {

        if (
            !chart.empty &&
            chart.visiblePoints &&
            chart.visiblePoints.length > 0
        ) {
            const y = chart.visiblePoints.length - 1;

            const lastPoint =
                chart.visiblePoints[y];

            const row =
                strengthData.find(
                    item => item.exercise === chart.name
                );

            if (row?.byReps) {
                currentOneRMs[chart.name] =
                    benchmarkState.charts[x]
                        .visiblePoints[y]
                        .entry.reps;
            } else if (chart.name.toLowerCase().includes("squat")) {
                currentOneRMs[chart.name] = lastPoint.y2;
            } else {
                currentOneRMs[chart.name] = lastPoint.y;
            }
        }
    });
    }

    console.dir(currentOneRMs);

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
                row.byReps
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


                // Show the user's actual current value underneath
                // the benchmark value for the current level.
                //
                // For byReps exercises, currentOneRM is actually
                // the user's real rep count.
                let currentValueDisplay = "";

                if (
                    isCurrentLevel &&
                    currentOneRM !== null &&
                    currentOneRM !== undefined
                ) {
                    const currentValue =
                        row.byReps
                            ? currentOneRM
                            : getCurrentValue
                                ? getCurrentValue(row, currentOneRM)
                                : currentOneRM;

                    currentValueDisplay = `
                        <br>
                        <small>
                            ${row.byReps
                                ? `${formatNumber(currentValue)} reps`
                                : formatCurrentValue(currentValue, row)
                            }
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
            row.byReps
                ? formatNumber(value)
                : formatMultiple(value),

        // Current value as a bodyweight multiple
        (row, currentOneRM) =>
            row.byReps
                ? currentOneRM
                : currentOneRM / bodyweight,

        (value, row) =>
            row.byReps
                ? formatNumber(value)
                : formatMultiple(value)
    );


    // ---------------------------------------------------------
    // 150 lb bodyweight
    // ---------------------------------------------------------

    const bodyweightTable = createTable(

        "1 Rep Max — 150 lb Bodyweight",

        (row, value) =>
            row.byReps
                ? value
                : value * bodyweight,

        formatNumber,

        // Current 1RM
        (row, currentOneRM) =>
            row.byReps
                ? currentOneRM
                : currentOneRM,

        (value, row) =>
            row.byReps
                ? formatNumber(value)
                : `${formatNumber(value)} lb`
    );


    // ---------------------------------------------------------
    // 5 Rep Max
    // ---------------------------------------------------------

    const fiveRepTable = createTable(

        "5-Rep Max Equivalent",

        (row, value) =>
            row.byReps
                ? value
                : repMax(
                    value * bodyweight,
                    5
                ),

        formatNumber,

        // Current 5RM calculated from current 1RM
        (row, currentOneRM) =>
            row.byReps
                ? currentOneRM
                : repMax(currentOneRM, 5),

        (value, row) =>
            row.byReps
                ? formatNumber(value)
                : `${formatNumber(value)} lb`
    );


    // ---------------------------------------------------------
    // 10 Rep Max
    // ---------------------------------------------------------

    const tenRepTable = createTable(

        "10-Rep Max Equivalent",

        (row, value) =>
            row.byReps
                ? value
                : repMax(
                    value * bodyweight,
                    10
                ),

        formatNumber,

        // Current 10RM calculated from current 1RM
        (row, currentOneRM) =>
            row.byReps
                ? currentOneRM
                : repMax(currentOneRM, 10),

        (value, row) =>
            row.byReps
                ? formatNumber(value)
                : `${formatNumber(value)} lb`
    );


    // ---------------------------------------------------------
    // 20 Rep Max
    // ---------------------------------------------------------

    const twentyRepTable = createTable(

        "20-Rep Max Equivalent",

        (row, value) =>
            row.byReps
                ? value
                : repMax(
                    value * bodyweight,
                    20
                ),

        formatNumber,

        // Current 20RM calculated from current 1RM
        (row, currentOneRM) =>
            row.byReps
                ? currentOneRM
                : repMax(currentOneRM, 20),

        (value, row) =>
            row.byReps
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