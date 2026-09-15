function getProgressTargetValue(target) {
    if (Array.isArray(target)) {
        return (target[0] + target[1]) / 2;
    }
    return target;
}

function getProgressMonthsForValue(value, targets, progressReferenceMonths) {
    const targetValues = targets.map(getProgressTargetValue);

    if (!Number.isFinite(value) || targetValues.length < 2) return null;

    for (let index = 1; index < targetValues.length; index += 1) {
        const lowerValue = targetValues[index - 1];
        const upperValue = targetValues[index];
        const lowerMonth = progressReferenceMonths[index - 1];
        const upperMonth = progressReferenceMonths[index];

        if (value <= upperValue) {
            if (upperValue === lowerValue) {
                return upperMonth;
            }
            const progressBetweenTargets = (value - lowerValue) / (upperValue - lowerValue);
            return Math.max(0, lowerMonth + ((upperMonth - lowerMonth) * progressBetweenTargets));
        }
    }

    const lastIndex = targetValues.length - 1;
    const previousValue = targetValues[lastIndex - 1];
    const lastValue = targetValues[lastIndex];
    const previousMonth = progressReferenceMonths[lastIndex - 1];
    const lastMonth = progressReferenceMonths[lastIndex];
    const monthlyGain = (lastValue - previousValue) / (lastMonth - previousMonth);

    if (monthlyGain <= 0) return lastMonth;
    return lastMonth + ((value - lastValue) / monthlyGain);
}

function getProgressMonthsForReps(reps, targets, progressReferenceMonths) {
    const targetValues = targets.map(getProgressTargetValue);
    if (targetValues.length === 0) return null;

    if (targetValues[0] > 0) {
        const firstStep = progressReferenceMonths[1] - progressReferenceMonths[0];
        const shiftedMonths = [
            progressReferenceMonths[0],
            ...progressReferenceMonths.map((month) => month + firstStep)
        ];
        return getProgressMonthsForValue(reps, [0, ...targetValues], shiftedMonths);
    }

    return getProgressMonthsForValue(reps, targetValues, progressReferenceMonths);
}

function hasWeightTargets(progressExercise) {
    return Array.isArray(progressExercise.targets) && progressExercise.targets.length > 0;
}

function getRepTargets(progressExercise) {
    return Array.isArray(progressExercise.targetReps) ? progressExercise.targetReps : null;
}

function normalizeExerciseLabel(label) {
    return String(label).trim().toLowerCase();
}

function getMatchingEntries(entries, progressExercise, getExerciseLabel) {
    const matches = new Set(progressExercise.matches.map(normalizeExerciseLabel));
    return entries.filter((entry) => matches.has(normalizeExerciseLabel(getExerciseLabel(entry.exercise))));
}

function getBestWeightProgressValue(entries, progressExercise, helpers) {
    const { getExerciseLabel, getEstimatedWeightForReps } = helpers;
    const estimates = getMatchingEntries(entries, progressExercise, getExerciseLabel)
        .filter((entry) => Number.isFinite(entry.weight) && Number.isFinite(entry.reps) && entry.reps > 0)
        .map((entry) => getEstimatedWeightForReps(entry.weight, entry.reps, progressExercise.targetReps))
        .filter((weight) => Number.isFinite(weight) && weight >= 0);

    if (estimates.length === 0) return null;
    return Math.max(...estimates);
}

function getBestRepProgressValue(entries, progressExercise, helpers) {
    const { getExerciseLabel } = helpers;
    const reps = getMatchingEntries(entries, progressExercise, getExerciseLabel)
        .map((entry) => entry.reps)
        .filter((repCount) => Number.isFinite(repCount) && repCount > 0);

    if (reps.length === 0) return null;
    return Math.max(...reps);
}

export function buildProgressRows(entries, config, helpers) {
    const { progressExercises, progressReferenceMonths } = config;
    const rows = progressExercises.map((progressExercise) => {
        const isWeightBased = hasWeightTargets(progressExercise);
        const targets = isWeightBased ? progressExercise.targets : getRepTargets(progressExercise);
        const progressValue = isWeightBased
            ? getBestWeightProgressValue(entries, progressExercise, helpers)
            : getBestRepProgressValue(entries, progressExercise, helpers);
        const months = progressValue === null || !targets
            ? null
            : isWeightBased
                ? getProgressMonthsForValue(progressValue, targets, progressReferenceMonths)
                : getProgressMonthsForReps(progressValue, targets, progressReferenceMonths);

        return {
            label: progressExercise.label,
            targetReps: progressExercise.targetReps,
            progressGroup: progressExercise.progressGroup || "lower",
            metric: isWeightBased ? "weight" : "reps",
            value: progressValue,
            estimatedWeight: isWeightBased ? progressValue : null,
            estimatedReps: isWeightBased ? null : progressValue,
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
