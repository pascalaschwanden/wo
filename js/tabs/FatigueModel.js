const FATIGUE_MULTIPLIERS = {
    "Front Delt": 0.65,
    "Side Delt": 0.4,
    "Rear Delt": 0.45,
    "Forearms": 0.3,
    "Flys": 0.5,
    "Push Type": 0.8,
    "Biceps": 0.4,
    "Triceps": 0.5,
    "Vertical Pull": 0.7,
    "Horizontal Pull": 0.7,
    "Pullovers": 0.65,
    "Shrugs": 0.45,
    "Deadlifts, RDL": 1,
    "Hip Thrust": 0.7,
    "Squats": 0.9,
    "Bulgarian": 0.85,
    "Step Up": 0.65,
    "Lunge": 0.7,
    "Nordic": 0.85,
    "Calves": 0.2,
    "Hip Abd/Add": 0.35
};

function parseWeekDate(weekKey) {
    const [year, month, day] = String(weekKey).split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

function getWeekKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMovementPatterns(volumeSections, getVolumeCounterKey) {
    const patterns = [];

    Object.entries(volumeSections).forEach(([sectionName, exercises]) => {
        exercises.forEach(([, label]) => {
            patterns.push({
                label,
                counterKey: getVolumeCounterKey(sectionName, label)
            });
        });
    });

    return patterns;
}

function getWeeklyAverage(countersByWeek, currentWeekDate, counterKey, weekCount) {
    let total = 0;

    for (let offset = 1; offset <= weekCount; offset += 1) {
        const weekDate = new Date(currentWeekDate);
        weekDate.setDate(weekDate.getDate() - (offset * 7));
        total += Number(countersByWeek.get(getWeekKey(weekDate))?.[counterKey]) || 0;
    }

    return total / weekCount;
}

function getCounterMetadata(volumeSections, volumePlannerItems, getVolumeCounterKey) {
    const metadata = new Map();

    Object.entries(volumeSections).forEach(([sectionName, exercises]) => {
        exercises.forEach(([, label]) => {
            const plannerItem = volumePlannerItems.find((item) =>
                item.section === sectionName && item.label === label
            );
            const group = sectionName === "Other" && label === "Cardio 2m"
                ? "cardio"
                : plannerItem?.type;

            if (group !== "upper" && group !== "lower" && group !== "cardio") return;

            metadata.set(getVolumeCounterKey(sectionName, label), {
                group,
                fatigue: FATIGUE_MULTIPLIERS[label] ?? (group === "upper" ? 0.55 : 0.65)
            });
        });
    });

    return metadata;
}

export function buildFatigueState(weekHistory, config) {
    const { volumeSections, volumePlannerItems, getVolumeCounterKey, currentWeekKey } = config;
    const validWeeks = weekHistory
        .map((week) => ({ ...week, date: parseWeekDate(week.id) }))
        .filter((week) => week.date)
        .sort((a, b) => a.date - b.date);

    const currentWeekDate = parseWeekDate(currentWeekKey);
    const countersByWeek = new Map(validWeeks.map((week) => [getWeekKey(week.date), week.counters || {}]));
    const volumeAverages = currentWeekDate
        ? getMovementPatterns(volumeSections, getVolumeCounterKey).map((pattern) => ({
            label: pattern.label,
            fourWeekAverage: getWeeklyAverage(countersByWeek, currentWeekDate, pattern.counterKey, 4),
            twelveWeekAverage: getWeeklyAverage(countersByWeek, currentWeekDate, pattern.counterKey, 12),
            twentyFourWeekAverage: getWeeklyAverage(countersByWeek, currentWeekDate, pattern.counterKey, 24)
        }))
        : [];

    if (validWeeks.length === 0) return { weeks: [], volumeAverages };

    const counterMetadata = getCounterMetadata(volumeSections, volumePlannerItems, getVolumeCounterKey);
    const totalsByWeek = new Map();
    const firstWeek = validWeeks[0].date;
    const lastWeek = validWeeks[validWeeks.length - 1].date;

    for (const cursor = new Date(firstWeek); cursor <= lastWeek; cursor.setDate(cursor.getDate() + 7)) {
        const date = new Date(cursor);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        totalsByWeek.set(key, {
            timestamp: Math.floor(date.getTime() / 1000),
            upperSets: 0,
            lowerSets: 0,
            cardioSets: 0,
            upperFatigue: 0,
            lowerFatigue: 0
        });
    }

    validWeeks.forEach((week) => {
        const key = `${week.date.getFullYear()}-${String(week.date.getMonth() + 1).padStart(2, "0")}-${String(week.date.getDate()).padStart(2, "0")}`;
        const totals = totalsByWeek.get(key);
        if (!totals) return;

        Object.entries(week.counters || {}).forEach(([counterKey, value]) => {
            const metadata = counterMetadata.get(counterKey);
            const sets = Number(value) || 0;
            if (!metadata || sets <= 0) return;

            if (metadata.group === "cardio") {
                totals.cardioSets += sets;
                return;
            }

            const setKey = metadata.group === "upper" ? "upperSets" : "lowerSets";
            const fatigueKey = metadata.group === "upper" ? "upperFatigue" : "lowerFatigue";
            totals[setKey] += sets;
            totals[fatigueKey] += sets * metadata.fatigue;
        });
    });

    return { weeks: Array.from(totalsByWeek.values()), volumeAverages };
}
