/* ====================================
   BIBLE READING PLAN DATA
   "God's Glory in Salvation Through Judgment"
   by Hamilton/Dendy/Jacobs (2014)
   365-day plan following Hebrew Bible order + NT canonical
   ==================================== */

const BIBLE_READING_PLAN = [
  // JANUARY (31 days)
  "Gen 1-3","Gen 4-7","Gen 8-11","Gen 12-15","Gen 16-18","Gen 19-21","Gen 22-24",
  "Gen 25-26","Gen 27-29","Gen 30-31","Gen 32-34","Gen 35-37","Gen 38-40",
  "Gen 41-42","Gen 43-45","Gen 46-47","Gen 48-50",
  "Exod 1-3","Exod 4-6","Exod 7-9","Exod 10-12","Exod 13-15","Exod 16-18",
  "Exod 19-21","Exod 22-24","Exod 25-27","Exod 28-29","Exod 30-32","Exod 33-35",
  "Exod 36-38","Exod 39-40",
  // FEBRUARY (28 days)
  "Lev 1-4","Lev 5-7","Lev 8-10","Lev 11-13","Lev 14-15","Lev 16-18","Lev 19-21",
  "Lev 22-23","Lev 24-25","Lev 26-27",
  "Num 1-2","Num 3-4","Num 5-6","Num 7","Num 8-10","Num 11-13","Num 14-15",
  "Num 16-17","Num 18-20","Num 21-22","Num 23-25","Num 26-27","Num 28-30",
  "Num 31-32","Num 33-34","Num 35-36",
  "Deut 1-2","Deut 3-4",
  // MARCH (31 days)
  "Deut 5-7","Deut 8-10","Deut 11-13","Deut 14-16","Deut 17-20","Deut 21-23",
  "Deut 24-27","Deut 28-29","Deut 30-31","Deut 32-34",
  "Josh 1-4","Josh 5-8","Josh 9-11","Josh 12-15","Josh 16-18","Josh 19-21","Josh 22-24",
  "Judg 1-2","Judg 3-5","Judg 6-7","Judg 8-9","Judg 10-12","Judg 13-15",
  "Judg 16-18","Judg 19-21",
  "1 Sam 1-3","1 Sam 4-8","1 Sam 9-12","1 Sam 13-14","1 Sam 15-17","1 Sam 18-20",
  // APRIL (30 days)
  "1 Sam 21-24","1 Sam 25-27","1 Sam 28-31",
  "2 Sam 1-3","2 Sam 4-7","2 Sam 8-12","2 Sam 13-15","2 Sam 16-18","2 Sam 19-21","2 Sam 22-24",
  "1 Kgs 1-2","1 Kgs 3-5","1 Kgs 6-7","1 Kgs 8-9","1 Kgs 10-11","1 Kgs 12-14",
  "1 Kgs 15-17","1 Kgs 18-20","1 Kgs 21-22",
  "2 Kgs 1-3","2 Kgs 4-5","2 Kgs 6-8","2 Kgs 9-11","2 Kgs 12-14","2 Kgs 15-17",
  "2 Kgs 18-19","2 Kgs 20-22","2 Kgs 23-25",
  "Isa 1-4","Isa 5-8",
  // MAY (31 days)
  "Isa 9-12","Isa 13-17","Isa 18-22","Isa 23-27","Isa 28-30","Isa 31-35",
  "Isa 36-41","Isa 42-44","Isa 45-48","Isa 49-53","Isa 54-58","Isa 59-63","Isa 64-66",
  "Jer 1-3","Jer 4-6","Jer 7-9","Jer 10-13","Jer 14-17","Jer 18-22",
  "Jer 23-25","Jer 26-29","Jer 30-31","Jer 32-34","Jer 35-37","Jer 38-41",
  "Jer 42-45","Jer 46-48","Jer 49-50","Jer 51-52",
  "Ezek 1-4","Ezek 5-8",
  // JUNE (30 days)
  "Ezek 9-12","Ezek 13-15","Ezek 16-17","Ezek 18-20","Ezek 21-22","Ezek 23-24",
  "Ezek 25-27","Ezek 28-30","Ezek 31-33","Ezek 34-36","Ezek 37-39",
  "Ezek 40-42","Ezek 43-45","Ezek 46-48",
  "Hos 1-7","Hos 8-14","Joel","Amos 1-5","Amos 6-9",
  "Obad & Jonah","Micah","Nah & Hab","Zeph & Hag",
  "Zech 1-7","Zech 8-14","Malachi",
  "Ps 1-8","Ps 9-16","Ps 17-20","Ps 21-25",
  // JULY (31 days)
  "Ps 26-31","Ps 32-35","Ps 36-39","Ps 40-45","Ps 46-50","Ps 51-57","Ps 58-65",
  "Ps 66-69","Ps 70-73","Ps 74-77","Ps 78-79","Ps 80-85","Ps 86-89",
  "Ps 90-95","Ps 96-102","Ps 103-105","Ps 106-107","Ps 108-114","Ps 115-118",
  "Ps 119","Ps 120-125","Ps 126-132","Ps 133-139","Ps 140-145","Ps 146-150",
  "Prov 1-3","Prov 4-6","Prov 7-9","Prov 10-12","Prov 13-15","Prov 16-18",
  // AUGUST (31 days)
  "Prov 19-21","Prov 22-23","Prov 24-26","Prov 27-29","Prov 30-31",
  "Job 1-4","Job 5-7","Job 8-10","Job 11-13","Job 14-16","Job 17-20",
  "Job 21-23","Job 24-28","Job 29-31","Job 32-34","Job 35-37","Job 38-42",
  "Song of Solomon","Ruth","Lam 1-2","Lam 3-5",
  "Eccl 1-3","Eccl 4-6","Eccl 7-9","Eccl 10-12",
  "Esth 1-5","Esth 6-10",
  "Dan 1-2","Dan 3-4","Dan 5-6","Dan 7-8",
  // SEPTEMBER (30 days)
  "Dan 9-10","Dan 11-12",
  "Ezra 1-3","Ezra 4-7","Ezra 8-10",
  "Neh 1-3","Neh 4-6","Neh 7","Neh 8-9","Neh 10-11","Neh 12-13",
  "1 Chr 1-2","1 Chr 3-5","1 Chr 6","1 Chr 7-8","1 Chr 9-10",
  "1 Chr 11-12","1 Chr 13-15","1 Chr 16-17","1 Chr 18-20","1 Chr 21-23",
  "1 Chr 24-25","1 Chr 26-27","1 Chr 28-29",
  "2 Chr 1-4","2 Chr 5-7","2 Chr 8-10","2 Chr 11-14","2 Chr 15-18","2 Chr 19-21",
  // OCTOBER (31 days)
  "2 Chr 22-24","2 Chr 25-27","2 Chr 28-29","2 Chr 30-32","2 Chr 33-34","2 Chr 35-36",
  "Matt 1-4","Matt 5-7","Matt 8-9","Matt 10-12","Matt 13-14","Matt 15-17",
  "Matt 18-20","Matt 21-22","Matt 23-24","Matt 25-26","Matt 27-28",
  "Mark 1-3","Mark 4-5","Mark 6-7","Mark 8-9","Mark 10-11","Mark 12-13","Mark 14","Mark 15-16",
  "Luke 1","Luke 2-3","Luke 4-5","Luke 6-7","Luke 8-9","Luke 10-11",
  // NOVEMBER (30 days)
  "Luke 12-13","Luke 14-16","Luke 17-18","Luke 19-20","Luke 21-22","Luke 23-24",
  "John 1-2","John 3-4","John 5-6","John 7-8","John 9-10","John 11-12",
  "John 13-15","John 16-18","John 19-21",
  "Acts 1-3","Acts 4-6","Acts 7-8","Acts 9-10","Acts 11-13","Acts 14-15",
  "Acts 16-17","Acts 18-20","Acts 21-23","Acts 24-26","Acts 27-28",
  "Rom 1-3","Rom 4-7","Rom 8-10","Rom 11-13",
  // DECEMBER (31 days)
  "Rom 14-16",
  "1 Cor 1-4","1 Cor 5-8","1 Cor 9-11","1 Cor 12-14","1 Cor 15-16",
  "2 Cor 1-4","2 Cor 5-9","2 Cor 10-13",
  "Gal 1-3","Gal 4-6",
  "Eph 1-3","Eph 4-6",
  "Philippians","Colossians","1 Thessalonians","2 Thessalonians",
  "1 Timothy","2 Timothy","Titus & Philemon",
  "Heb 1-6","Heb 7-10","Heb 11-13",
  "James","Luke 1-2",
  "1 Peter & 2 Peter & Jude","1 John & 2 John & 3 John",
  "Rev 1-5","Rev 6-11","Rev 12-18","Rev 19-22"
];

// Get the day-of-year (1-indexed, Jan 1 = day 1)
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  return Math.floor(diff / 86400000);
}

// Get today's reading plan entry
function getTodaysReading(date) {
  const dayOfYear = getDayOfYear(date || new Date());
  // Clamp to 1-365
  const idx = Math.max(0, Math.min(dayOfYear - 1, BIBLE_READING_PLAN.length - 1));
  return {
    day: dayOfYear,
    total: BIBLE_READING_PLAN.length,
    reading: BIBLE_READING_PLAN[idx],
    month: (date || new Date()).toLocaleString('en-US', { month: 'long' }),
    dayOfMonth: (date || new Date()).getDate()
  };
}

// Get readings for a range of days around today
function getReadingsAround(date, before, after) {
  const d = date || new Date();
  const dayOfYear = getDayOfYear(d);
  const results = [];
  for (let offset = -before; offset <= after; offset++) {
    const idx = dayOfYear - 1 + offset;
    if (idx >= 0 && idx < BIBLE_READING_PLAN.length) {
      const refDate = new Date(d);
      refDate.setDate(refDate.getDate() + offset);
      results.push({
        day: idx + 1,
        reading: BIBLE_READING_PLAN[idx],
        date: refDate,
        isToday: offset === 0,
        isPast: offset < 0
      });
    }
  }
  return results;
}
