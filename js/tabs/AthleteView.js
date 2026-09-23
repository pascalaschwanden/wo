export function renderAthleteView() {
    const bodyweight = 150;

    const strengthData = [
        { exercise: "Bench Press",           values: [0.75, 1.0, 1.3, 1.5, 1.75] },
        { exercise: "Squat",                 values: [1.0, 1.2, 1.5, 1.75, 2.0] },
        { exercise: "Deadlift",              values: [1.0, 1.3, 1.65, 2.0, 2.5] },
        { exercise: "Military Press",        values: [0.5, 0.65, 0.85, 1.0, 1.25] },
        { exercise: "Barbell Row",           values: [0.6, 0.8, 1.0, 1.2, 1.4] },
        { exercise: "Good Morning",          values: [0.4, 0.55, 0.7, 0.85, 1.0] },
        { exercise: "Bicep Curl",            values: [0.25, 0.35, 0.45, 0.55, 0.65] },
        { exercise: "Tricep Skull Crusher",  values: [0.25, 0.35, 0.45, 0.55, 0.65] },
        { exercise: "Bulgarian Split Squat", values: [0.35, 0.5, 0.65, 0.8, 1.0] },
        { exercise: "Single-Leg Calf Raise", values: [0.25, 0.4, 0.55, 0.7, 0.85] },
        { exercise: "Pull-ups",              values: [3, 8, 12, 15, 20], pullups: true }
    ];

    const levels = [
        "Decent",
        "Good",
        "Optimal",
        "Advanced",
        "Athlete"
    ];

    function formatNumber(value) {
        if (Number.isInteger(value)) {
            return value.toString();
        }

        return value.toFixed(1).replace(/\.0$/, "");
    }

    // Epley formula:
    // 1RM = weight × (1 + reps / 30)
    function repMax(oneRM, reps) {
        return oneRM / (1 + reps / 30);
    }

    function createTable(title, getValue, formatValue = formatNumber) {
        let table = `
            <h4>${title}</h4>

            <table class="strength-table mope">
                <tbody>
                    <tr>
                        <td>Exercise</td>
                        ${levels.map(level => `<td>${level}</td>`).join("")}
                    </tr>
        `;

        strengthData.forEach(row => {
            table += `
                <tr>
                    <td>${row.exercise}</td>
            `;

            row.values.forEach((value, index) => {
                const calculatedValue = getValue(row, value, index);

                table += `
                    <td>${formatValue(calculatedValue, row)}</td>
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


    // 1. Multiples
    const multiplesTable = createTable(
        "Strength Standards — Multiples of Bodyweight",

        (row, value) => value,

        (value, row) => row.pullups
            ? formatNumber(value)
            : `×${formatNumber(value)}`
    );


    // 2. Weight based on 150 lb bodyweight
    const bodyweightTable = createTable(
        "Strength Standards 1 RM — 150 lb Bodyweight",

        (row, value) => {
            if (row.pullups) {
                return value;
            }

            return value * bodyweight;
        }
    );


    // 3. 5-rep max equivalent
    const fiveRepTable = createTable(
        "5-Rep Max Equivalent",

        (row, value) => {
            if (row.pullups) {
                return value;
            }

            const oneRM = value * bodyweight;

            return repMax(oneRM, 5);
        }
    );


    // 4. 10-rep max equivalent
    const tenRepTable = createTable(
        "10-Rep Max Equivalent",

        (row, value) => {
            if (row.pullups) {
                return value;
            }

            const oneRM = value * bodyweight;

            return repMax(oneRM, 10);
        }
    );


    // 5. 20-rep max equivalent
    const twentyRepTable = createTable(
        "20-Rep Max Equivalent",

        (row, value) => {
            if (row.pullups) {
                return value;
            }

            const oneRM = value * bodyweight;

            return repMax(oneRM, 20);
        }
    );


    // Put everything inside athlete-view-content
    const html = `
        ${multiplesTable}
        ${bodyweightTable}
        ${fiveRepTable}
        ${tenRepTable}
        ${twentyRepTable}
    `;

    document.querySelector('.athlete-view-content').innerHTML = html;
}