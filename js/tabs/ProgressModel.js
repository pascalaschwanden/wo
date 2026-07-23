function getProgressTargetValue(target) {
    if (Array.isArray(target)) {
        return (target[0] + target[1]) / 2;
    }
    return target;
}

function getProgressMonthsForWeight(weight, targets, progressReferenceMonths) {
    const targetValues = targets.map(getProgressTargetValue);

    if (!Number.isFinite(weight)) return null;

    for (let index = 1; index < targetValues.length; index += 1) {
        const lowerWeight = targetValues[index - 1];
        const upperWeight = targetValues[index];
        const lowerMonth = progressReferenceMonths[index - 1];
        const upperMonth = progressReferenceMonths[index];

        if (weight <= upperWeight) {
            if (upperWeight === lowerWeight) {
                return upperMonth;
            }
            const progressBetweenTargets = (weight - lowerWeight) / (upperWeight - lowerWeight);
            return Math.max(0, lowerMonth + ((upperMonth - lowerMonth) * progressBetweenTargets));
        }
    }

    const lastIndex = targetValues.length - 1;
    const previousWeight = targetValues[lastIndex - 1];
    const lastWeight = targetValues[lastIndex];
    const previousMonth = progressReferenceMonths[lastIndex - 1];
    const lastMonth = progressReferenceMonths[lastIndex];
    const monthlyGain = (lastWeight - previousWeight) / (lastMonth - previousMonth);

    if (monthlyGain <= 0) return lastMonth;
    return lastMonth + ((weight - lastWeight) / monthlyGain);
}

function getBestProgressEstimate(entries, progressExercise, helpers) {
    const { getExerciseLabel, getEstimatedWeightForReps } = helpers;
    const estimates = entries
        .filter((entry) => progressExercise.matches.includes(getExerciseLabel(entry.exercise)))
        .filter((entry) => Number.isFinite(entry.weight) && Number.isFinite(entry.reps) && entry.reps > 0)
        .map((entry) => getEstimatedWeightForReps(entry.weight, entry.reps, progressExercise.targetReps))
        .filter((weight) => Number.isFinite(weight) && weight >= 0);

    if (estimates.length === 0) return null;
    return Math.max(...estimates);
}

export function buildProgressRows(entries, config, helpers) {
    const { progressExercises, progressReferenceMonths } = config;
    const rows = progressExercises.map((progressExercise) => {
        const estimatedWeight = getBestProgressEstimate(entries, progressExercise, helpers);
        const months = estimatedWeight === null
            ? null
            : getProgressMonthsForWeight(estimatedWeight, progressExercise.targets, progressReferenceMonths);
        return {
            label: progressExercise.label,
            targetReps: progressExercise.targetReps,
            estimatedWeight,
            months
        };
    });
    const validMonths = rows
        .map((row) => row.months)
        .filter((months) => Number.isFinite(months));
    const maxMonth = validMonths.length
        ? Math.max(2, Math.ceil(Math.max(...validMonths) / 2) * 2)
        : 24;

    return { rows, maxMonth };
}
