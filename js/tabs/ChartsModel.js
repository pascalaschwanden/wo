export function buildChartGroups(entries, activeChartCategory, helpers) {
    const { exerciseCategories, getExerciseLabel } = helpers;
    return entries
        .filter((entry) => exerciseCategories[entry.exercise] === activeChartCategory)
        .reduce((groups, entry) => {
            const exercise = getExerciseLabel(entry.exercise);
            if (!groups.has(exercise)) {
                groups.set(exercise, {
                    exercise,
                    weights: new Map()
                });
            }

            const weightKey = String(entry.weight);
            const group = groups.get(exercise);
            if (!group.weights.has(weightKey)) {
                group.weights.set(weightKey, []);
            }
            group.weights.get(weightKey).push(entry);
            return groups;
        }, new Map());
}
