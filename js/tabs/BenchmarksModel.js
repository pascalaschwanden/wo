function computeSlope(points) {
    if (!points || points.length < 2) return 0;

    const t0 = points[0].x;
    const norm = points.map((point) => ({
        x: (point.x - t0) / 86400,
        y: point.y
    }));

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;

    for (const point of norm) {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumX2 += point.x * point.x;
    }

    const n = norm.length;
    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return 0;

    return (n * sumXY - sumX * sumY) / denom;
}

function getNearest(points, timestamp) {
    let best = points[0];
    for (const point of points) {
        if (point.x <= timestamp) best = point;
        else break;
    }
    return best;
}

function computeBenchmarkStats(points) {
    if (points.length < 2) return null;

    const start = points[0];
    const end = points[points.length - 1];
    const days = (end.x - start.x) / 86400;
    if (days <= 0) return null;

    const slope = computeSlope(points);
    const deltaLbs = slope * days;
    const safeStart = Math.max(start.y, 50);
    const percent = (deltaLbs / safeStart) * 100;
    const deltaLbs30 = deltaLbs * (30 / days);
    const percent30 = percent * (30 / days);

    return {
        deltaLbs,
        percent,
        deltaLbs30,
        percent30,
        days,
        startTimestamp: start.x,
        endTimestamp: end.x,
        startValue: start.y,
        endValue: start.y + deltaLbs
    };
}

function getAlpha(exercise) {
    if (exercise.includes("Deadlift") || exercise.includes("Squat")) return 0.15;
    if (exercise.includes("Bench") || exercise.includes("Press")) return 0.25;
    return 0.35;
}

function exponentialSmooth(points, alpha = 0.25) {
    if (points.length === 0) return [];

    const sorted = [...points].sort((a, b) => a.x - b.x);
    const smoothed = [];
    let prev = sorted[0].y;

    smoothed.push({
        x: sorted[0].x,
        y: prev
    });

    for (let index = 1; index < sorted.length; index += 1) {
        const current = sorted[index].y;
        const value = alpha * current + (1 - alpha) * prev;
        smoothed.push({
            x: sorted[index].x,
            y: value
        });
        prev = value;
    }

    return smoothed;
}

function bestPointPerDay(points) {
    const byDay = new Map();

    for (const point of points) {
        const day = Math.floor(point.x / 86400);
        if (!byDay.has(day)) {
            byDay.set(day, { ...point });
        } else if (point.y > byDay.get(day).y) {
            byDay.get(day).y = point.y;
        }
    }

    return Array.from(byDay.values()).sort((a, b) => a.x - b.x);
}

function computeWeightedBenchmarkStats(exerciseEntries, exerciseName, startTimestamp, endTimestamp, helpers) {
    const { getBenchmarkLiftWeight, getEstimatedOneRepMax } = helpers;
    const groups = new Map();

    exerciseEntries.forEach((entry) => {
        const weight = getBenchmarkLiftWeight(entry);
        if (!groups.has(weight)) groups.set(weight, []);
        groups.get(weight).push({
            x: entry.timestamp,
            y: getEstimatedOneRepMax(weight, entry.reps)
        });
    });

    let totalWeight = 0;
    let deltaLbs = 0;
    let percent = 0;
    let deltaLbs30 = 0;
    let percent30 = 0;
    let observedDays = 0;

    for (const points of groups.values()) {
        if (points.length < 2) continue;

        points.sort((a, b) => a.x - b.x);
        const dailyPoints = bestPointPerDay(points);
        const filteredPoints = dailyPoints.filter((point) => point.x >= startTimestamp && point.x <= endTimestamp);
        if (filteredPoints.length < 2) continue;

        const stats = computeBenchmarkStats(filteredPoints);
        if (!stats) continue;

        const weight = filteredPoints.length;

        totalWeight += weight;
        deltaLbs += stats.deltaLbs * weight;
        percent += stats.percent * weight;
        observedDays += stats.days * weight;
    }

    if (totalWeight === 0) return null;

    const weightedDeltaLbs = deltaLbs / totalWeight;
    const weightedPercent = percent / totalWeight;
    const weightedObservedDays = observedDays / totalWeight;

    return {
        deltaLbs: weightedDeltaLbs,
        percent: weightedPercent,
        deltaLbs30: weightedObservedDays > 0 ? weightedDeltaLbs * (30 / weightedObservedDays) : 0,
        percent30: weightedObservedDays > 0 ? weightedPercent * (30 / weightedObservedDays) : 0
    };
}

function getWeightedTrendPoints(exerciseEntries, exerciseName, startTimestamp, endTimestamp, helpers) {
    const { getBenchmarkLiftWeight, getEstimatedOneRepMax } = helpers;
    const groups = new Map();

    exerciseEntries.forEach((entry) => {
        const weight = getBenchmarkLiftWeight(entry);
        if (!groups.has(weight)) groups.set(weight, []);
        groups.get(weight).push({
            x: entry.timestamp,
            y: getEstimatedOneRepMax(weight, entry.reps)
        });
    });

    let totalWeight = 0;
    let startX = 0;
    let endX = 0;
    let startY = 0;
    let endY = 0;

    for (const points of groups.values()) {
        if (points.length < 2) continue;

        const dailyPoints = bestPointPerDay(points.sort((a, b) => a.x - b.x));
        const filteredPoints = dailyPoints.filter((point) => point.x >= startTimestamp && point.x <= endTimestamp);
        if (filteredPoints.length < 2) continue;

        const stats = computeBenchmarkStats(filteredPoints);
        if (!stats) continue;

        const groupWeight = filteredPoints.length;

        totalWeight += groupWeight;
        startX += stats.startTimestamp * groupWeight;
        endX += stats.endTimestamp * groupWeight;
        startY += stats.startValue * groupWeight;
        endY += stats.endValue * groupWeight;
    }

    if (totalWeight === 0) return [];

    return [
        { x: startX / totalWeight, y: startY / totalWeight },
        { x: endX / totalWeight, y: endY / totalWeight }
    ];
}

export function buildBenchmarkState(entries, config, helpers) {
    const { benchmarkExercises, startTimestamp, nowTimestamp } = config;
    const { getBenchmarkLiftWeight, getExerciseLabel, getEstimatedOneRepMax, getLinearFit } = helpers;
    const endTimestamp = Math.max(nowTimestamp, startTimestamp + (7 * 24 * 60 * 60));
    const summaryRows = [];
    const charts = [];

    benchmarkExercises.forEach((benchmark) => {
        const exerciseEntries = entries
            .filter((entry) => getExerciseLabel(entry.exercise) === benchmark.name)
            .filter((entry) => entry.weight >= 0 && entry.reps > 0 && entry.timestamp);

        const rawPoints = exerciseEntries
            .map((entry) => ({
                x: entry.timestamp,
                y: getEstimatedOneRepMax(getBenchmarkLiftWeight(entry), entry.reps)
            }))
            .filter((point) => Number.isFinite(point.y) && point.y > 0)
            .sort((a, b) => a.x - b.x);

        const dailyPoints = bestPointPerDay(rawPoints);
        const filteredDailyPoints = dailyPoints.filter((point) => point.x >= startTimestamp);
        const visiblePoints = exponentialSmooth(filteredDailyPoints, getAlpha(benchmark.name));

        if (visiblePoints.length === 0) {
            charts.push({
                name: benchmark.name,
                empty: true
            });
            return;
        }

        const lastPoint = visiblePoints[visiblePoints.length - 1];
        const chartStart = startTimestamp;
        const chartEnd = Math.max(endTimestamp, lastPoint.x);
        const stats = computeWeightedBenchmarkStats(
            exerciseEntries,
            benchmark.name,
            startTimestamp,
            chartEnd,
            helpers
        );

        if (stats) {
            summaryRows.push({
                name: benchmark.name,
                ...stats
            });
        }

        const fit = visiblePoints.length >= 2 ? getLinearFit(visiblePoints) : null;
        const firstPoint = visiblePoints[0];
        const yourTrendPoints = getWeightedTrendPoints(
            exerciseEntries,
            benchmark.name,
            chartStart,
            chartEnd,
            helpers
        );
        const typicalStartWeight = yourTrendPoints.length > 0
            ? yourTrendPoints[0].y
            : (fit ? fit.predict(chartStart) : firstPoint.y);
        const typicalStartTimestamp = yourTrendPoints.length > 0 ? yourTrendPoints[0].x : chartStart;
        const typicalEndTimestamp = yourTrendPoints.length > 0 ? yourTrendPoints[1].x : chartEnd;
        const typicalEndWeight = typicalStartWeight + (((typicalEndTimestamp - typicalStartTimestamp) / (7 * 24 * 60 * 60)) * benchmark.weeklyGain);
        const typicalPoints = [
            { x: typicalStartTimestamp, y: typicalStartWeight },
            { x: typicalEndTimestamp, y: typicalEndWeight }
        ];
        const plottedYValues = [...visiblePoints, ...yourTrendPoints, ...typicalPoints]
            .map((point) => point.y)
            .filter((value) => Number.isFinite(value));
        const lowestY = Math.min(...plottedYValues);
        const highestY = Math.max(...plottedYValues);
        const yPadding = Math.max((highestY - lowestY) * 0.12, highestY * 0.03, 5);

        charts.push({
            name: benchmark.name,
            empty: false,
            visiblePoints,
            yourTrendPoints,
            typicalPoints,
            chartStart,
            chartEnd,
            yMin: Math.max(0, Math.floor((lowestY - yPadding) / 5) * 5)
        });
    });

    summaryRows.sort((a, b) => b.percent30 - a.percent30);

    return {
        summaryRows,
        charts
    };
}
