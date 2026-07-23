export function buildNextRows(entries, helpers) {
    const { getAllExerciseLabels, getExerciseLabel } = helpers;
    const trackingSet = new Set([
        "Upright Row - barbell", "Shrugs", "Pull ups", "Chin ups",
        "Overhead tricep extention", "Push ups", "Squat - bulgarian",
        "Lunge - reverse", "Bench Press", "Shoulder Hammer Press",
        "Lying Reverse Fly", "Reverse Dumbbell Fly", "Leg Raises",
        "Bicep Curl", "Barbell Row", "Chest Fly Bench", "Lying Side Raise",
        "Deadlif - Romanian", "Barbell Bicep Curl", "Side Laterals",
        "Bath dips", "Hip Thrust", "Calf Raises, single", "Military Press",
        "Skull Crushers", "Step Up", "Squat", "Deadlift"
    ]);

    const exerciseHistory = entries.reduce((history, entry) => {
        const exercise = getExerciseLabel(entry.exercise);
        if (!trackingSet.has(exercise)) return history;

        if (!history.has(exercise)) {
            history.set(exercise, {
                latestTimestamp: null,
                weights: new Set()
            });
        }

        const exerciseData = history.get(exercise);
        if (!exerciseData.latestTimestamp || entry.timestamp > exerciseData.latestTimestamp) {
            exerciseData.latestTimestamp = entry.timestamp;
        }
        if (Number.isFinite(entry.weight)) {
            exerciseData.weights.add(entry.weight);
        }
        return history;
    }, new Map());

    return getAllExerciseLabels()
        .filter((exercise) => trackingSet.has(exercise))
        .map((exercise) => {
            const history = exerciseHistory.get(exercise);
            return {
                exercise,
                timestamp: history?.latestTimestamp || null,
                weights: history ? Array.from(history.weights) : []
            };
        })
        .sort((a, b) => {
            if (!a.timestamp && !b.timestamp) {
                return a.exercise.localeCompare(b.exercise);
            }
            if (!a.timestamp) return -1;
            if (!b.timestamp) return 1;
            return a.timestamp - b.timestamp;
        });
}
