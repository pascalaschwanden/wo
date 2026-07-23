export const analysisPeriods = [
    { key: "twoWeeks", label: "2 weeks", days: 14 },
    { key: "fourWeeks", label: "4 weeks", days: 28 },
    { key: "twoMonths", label: "2 months", days: 61 },
    { key: "fourMonths", label: "4 months", days: 122 }
];

const mainAnalysisExercises = [
    { label: "Bench Press", matches: ["Bench Press"] },
    { label: "Barbell Row", matches: ["Barbell Row"] },
    { label: "Military Press", matches: ["Military Press"] },
    { label: "Squat", matches: ["Squat"] },
    { label: "Deadlift", matches: ["Deadlift"] },
    { label: "Bicep Curl", matches: ["Bicep Curl"] },
    { label: "Tricep Curl", matches: ["Tricep Curl"] },
    { label: "Lateral Raises", matches: ["Lateral Raises", "Side Laterals"] }
];

export function buildAnalysisTables(entries, helpers) {
    const { getAverage, getExerciseLabel, getTrendPercent } = helpers;
    const groupedEntries = entries.reduce((groups, entry) => {
        const exercise = getExerciseLabel(entry.exercise);
        const weightKey = String(entry.weight);

        if (!groups.has(exercise)) {
            groups.set(exercise, new Map());
        }
        if (!groups.get(exercise).has(weightKey)) {
            groups.get(exercise).set(weightKey, []);
        }
        groups.get(exercise).get(weightKey).push(entry);
        return groups;
    }, new Map());

    const rows = Array.from(groupedEntries.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([exercise, weightGroups]) => {
            const trends = {};
            analysisPeriods.forEach((period) => {
                const weightTrends = Array.from(weightGroups.values())
                    .map((points) => getTrendPercent(points, period.days));
                trends[period.key] = getAverage(weightTrends);
            });
            return { exercise, trends };
        });

    const mainExerciseNames = new Set(mainAnalysisExercises.flatMap((exercise) => exercise.matches));
    const mainRows = mainAnalysisExercises.map((exercise) => {
        const matchingRows = rows.filter((row) => exercise.matches.includes(row.exercise));
        const trends = {};
        analysisPeriods.forEach((period) => {
            trends[period.key] = getAverage(matchingRows.map((row) => row.trends[period.key]));
        });
        return { exercise: exercise.label, trends };
    });
    const otherRows = rows.filter((row) => !mainExerciseNames.has(row.exercise));

    return {
        isEmpty: groupedEntries.size === 0,
        periods: analysisPeriods,
        tables: [
            { title: "Main exercises", rows: mainRows },
            { title: "Other exercises", rows: otherRows }
        ]
    };
}
