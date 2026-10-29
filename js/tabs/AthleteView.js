export function renderAthleteView(benchmarkState) {
    const bodyweight = 150;
    console.dir(benchmarkState);

    /*
    * Bulgarian split squat info source:
    *
1. The 45%–55% Structural Balance Ratio

In athletic strength and conditioning, it is widely accepted that a balanced lifter's working 1RM on a Bulgarian Split Squat is approximately 45% to 55% of their bilateral Back Squat.
• For example, the Trainnode Strength Ratio Calculator utilizes 45% as the standard target conversion for single-leg load balance.
• Applying a 50% structural balance anchor to standard back squat targets (e.g., an intermediate back squat of 1.5x bodyweight or an elite back squat of 2.4x bodyweight) directly yields the 0.75x and 1.20x–1.25x bodyweight multiplier boundaries.

2. Empirical Lifting Data (Crowdsourced Benchmarks)

To make sure the targets match what lifters actually achieve under the bar, the values are cross-referenced with user repositories like the Strength Level Exercise Standards Database.
• Intermediate ("Optimal"): For a 150 lbs male, the database tracks the 50th percentile (Intermediate) around a 110–120 lbs 1-rep max. Scaling this down slightly to accommodate a safe 8-rep working set aligns perfectly with the 75 lbs (0.50x) working mark.
• Elite / Freak: The database places top-tier male lifters (95th percentile and above) at an estimated 1RM of 1.45x–1.50x bodyweight or higher. For a 150 lbs individual, a 1.50x bodyweight working set (225 lbs) matches the absolute peak of realistic human unilateral leg strength.
   Jeff Nippard: 2.6/2.1/2.9.   Beginner =    ben: 1, squat 1.25, dead: 1.5
   * Intermediate (Good) (2-5 years) Ben: 1-1.5, squat: 1.25-1.75, deadlift: 1.5 - 2.25
   * Advanced (5+ years of lifting) Ben: 1.5-2  squat: 1.75-2.5, Dead: 2.25-3
   * Elite (5-10+ years, requires specialization) Ben: 2-2.25  squat: 2.5-3x  Dead: 3-3.35    = not everyone can get to this level, highest level natural lifters can get here (can perhaps do only 2 categories)
   * Freak - need really good genetics. most people can't get there.
     */
    const strengthData = [
        { exercise: "Bench Press",           values: [0.75, 1.0, 1.3, 1.5, 1.75, 2, 2.25] },
        { exercise: "Squat",                 values: [1.0, 1.2, 1.5, 1.75, 2.0, 2.5, 3] },
        { exercise: "Deadlift",              values: [1.0, 1.3, 1.65, 2.0, 2.5, 3, 3.5] },
        { exercise: "Deadlift - Romanian",     values: [0.9, 1.25, 1.5, 1.9, 2.2, 2.5, 2.9]},
        { exercise: "Squat - bulgarian", values: [0.0,  0.25, 0.5,  0.75, 1.0,  1.25, 1.5] },
        { exercise: "Military Press",     values: [0.41, 0.57, 0.77, 1.01, 1.26, 1.50, 1.75] },
        { exercise: "Barbell Row",        values: [0.56, 0.80, 1.10, 1.44, 1.82, 2.20, 2.60] },
        // { exercise: "Good Morning",    values: [0.40, 0.55, 0.70, 0.85, 1.00] },
        { exercise: "Barbell Bicep Curl", values: [0.30, 0.45, 0.60, 0.75, 0.85, 1.00, 1.15] },
        { exercise: "Skull Crushers",    values: [0.25, 0.40, 0.55, 0.70, 0.80, 0.95, 1.10] },
        // { exercise: "Calf Raises, single", values: [0.25, 0.40, 0.55, 0.70, 0.85] },
        { exercise: "Side Laterals",     values: [0.067, 0.13, 0.20, 0.30, 0.39, 0.47, 0.60] },
        { exercise: "Hip Thrust",        values: [0.62, 1.13, 1.83, 2.71, 3.69, 4.40, 5.20] },
        { exercise: "Pull ups",          values: [3, 8, 12, 15, 20, 25, 30], byReps: true },
        { exercise: "Push ups",          values: [13, 15, 23, 29, 35, 40, 50], byReps: true },
        { exercise: "Chin ups",          values: [7, 12, 17, 21, 27, 33, 40], byReps: true }
        //{ exercise: "Leg Raises",               values: [8, 17, 28, 39, 45], byReps: true },
        //{ exercise: "Vertical Dips",            values: [8, 15, 20, 25, 30], byReps: true },
        //{ exercise: "Calf Raises, single",      values: [13, 25, 35, 45, 50], byReps: true }
    ];

    const levels = [
        "Decent",
        "Good",
        "Optimal",
        "Advanced",
        "Athlete",
        "Elite",
        "Freak"
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

    function getRepMaxDivisor(row) {
        if (row.exercise === "Side Laterals") return 15;
        if (row.exercise === "Barbell Bicep Curl" || row.exercise === "Bicep Curl" || row.exercise === "Skull Crushers") return 20;
        return 30;
    }

    function repMax(row, oneRM, reps) {
        var rmd = getRepMaxDivisor(row);
        return oneRM / (1 + reps / rmd);
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
                    row,
                    value * bodyweight,
                    5
                ),

        formatNumber,

        // Current 5RM calculated from current 1RM
        (row, currentOneRM) =>
            row.byReps
                ? currentOneRM
                : repMax(row, currentOneRM, 5),

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
                    row,
                    value * bodyweight,
                    10
                ),

        formatNumber,

        // Current 10RM calculated from current 1RM
        (row, currentOneRM) =>
            row.byReps
                ? currentOneRM
                : repMax(row, currentOneRM, 10),

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
                    row,
                    value * bodyweight,
                    20
                ),

        formatNumber,

        // Current 20RM calculated from current 1RM
        (row, currentOneRM) =>
            row.byReps
                ? currentOneRM
                : repMax(row, currentOneRM, 20),

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
