// 艾尔德兰编年史 - 游戏时间系统
// 昼夜循环、时间流逝、等待机制

const TIME_PERIODS = {
  morning:   { name: '清晨', emoji: '🌅', hourRange: [6, 11],  desc: '晨光熹微，鸟儿在枝头鸣叫。新的一天刚刚开始。' },
  afternoon: { name: '上午', emoji: '☀️', hourRange: [11, 17], desc: '阳光正好，正是冒险的好时候。' },
  evening:   { name: '傍晚', emoji: '🌇', hourRange: [17, 20], desc: '夕阳西下，天边的云彩被染成了金红色。' },
  night:     { name: '深夜', emoji: '🌙', hourRange: [20, 6],  desc: '夜色深沉，月光洒在大地上。暗处的生物开始活跃……' },
};

class TimeSystem {
  constructor() {
    // 每个角色/世界的游戏时间
    this.worldTimes = new Map(); // worldId -> { hour, day, month, year }
  }

  /** 获取或初始化游戏时间 */
  getTime(worldId) {
    if (!this.worldTimes.has(worldId)) {
      this.worldTimes.set(worldId, { hour: 8, day: 1, month: 3, year: 1 });
    }
    return this.worldTimes.get(worldId);
  }

  /** 推进时间（分钟） */
  advanceTime(worldId, minutes) {
    const time = this.getTime(worldId);
    time.hour += minutes / 60;
    while (time.hour >= 24) {
      time.hour -= 24;
      time.day++;
      if (time.day > 30) { time.day = 1; time.month++; }
      if (time.month > 12) { time.month = 1; time.year++; }
    }
    if (time.hour < 0) time.hour = 0;
    return this.getTimeOfDay(worldId);
  }

  /** 获取当前时段 */
  getTimeOfDay(worldId) {
    const time = this.getTime(worldId);
    const hour = time.hour;
    if (hour >= 6 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    return 'night';
  }

  /** 是否是夜晚 */
  isNight(worldId) {
    return this.getTimeOfDay(worldId) === 'night';
  }

  /** 是否是白天 */
  isDaytime(worldId) {
    return ['morning', 'afternoon', 'evening'].includes(this.getTimeOfDay(worldId));
  }

  /** 等待到下一个时段 */
  waitToNext(worldId, targetPeriod) {
    const time = this.getTime(worldId);
    if (targetPeriod) {
      // 等待到指定时段
      const periodHours = {
        morning: 6, afternoon: 12, evening: 17, night: 21,
      };
      const targetHour = periodHours[targetPeriod];
      if (targetHour !== undefined) {
        if (time.hour < targetHour) {
          time.hour = targetHour;
        } else {
          time.hour = targetHour;
          time.day++;
          if (time.day > 30) { time.day = 1; time.month++; }
          if (time.month > 12) { time.month = 1; time.year++; }
        }
      }
    } else {
      // 等待到下一个时段
      time.hour += 4;
      if (time.hour >= 24) {
        time.hour -= 24;
        time.day++;
        if (time.day > 30) { time.day = 1; time.month++; }
        if (time.month > 12) { time.month = 1; time.year++; }
      }
    }
    return this.getTimeOfDay(worldId);
  }

  /** 格式化时间显示 */
  formatTime(worldId) {
    const time = this.getTime(worldId);
    const period = this.getTimeOfDay(worldId);
    const p = TIME_PERIODS[period];
    const hour = Math.floor(time.hour);
    const minute = Math.floor((time.hour - hour) * 60);
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return {
      full: `第${time.day}天 · ${p.emoji} ${p.name} ${hh}:${mm}`,
      short: `${p.emoji} ${p.name}`,
      emoji: p.emoji,
      period: period,
      periodName: p.name,
      periodDesc: p.desc,
      hour,
      day: time.day,
      isNight: period === 'night',
      isDaytime: period !== 'night',
    };
  }

  /** 获取时间段描述 */
  getPeriodDesc(worldId) {
    const period = this.getTimeOfDay(worldId);
    return TIME_PERIODS[period]?.desc || '';
  }

  /** 时间片段描述（用于叙事中穿插时间描述） */
  getTimeContext(worldId) {
    const time = this.formatTime(worldId);
    return `${time.full} - ${time.periodDesc}`;
  }
}

module.exports = new TimeSystem();
module.exports.TIME_PERIODS = TIME_PERIODS;
