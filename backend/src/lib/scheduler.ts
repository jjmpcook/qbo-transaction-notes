import * as cron from 'node-cron';
import { DailyReportsService } from './dailyReports.js';

export class ReportScheduler {
  private static scheduledTask: cron.ScheduledTask | null = null;

  /**
   * Start the daily report scheduler
   * Default: 9:00 AM Eastern Time, Monday through Friday
   */
  static start(cronExpression: string = '0 9 * * 1-5'): void {
    if (this.scheduledTask) {
      console.log('⚠️  Report scheduler is already running');
      return;
    }

    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      console.error('❌ Invalid cron expression:', cronExpression);
      return;
    }

    console.log(`🕒 Starting daily report scheduler with expression: ${cronExpression}`);
    console.log('📅 Schedule examples (Pacific Time):');
    console.log('   • "0 9 * * 1-5" = 9:00 AM, Monday-Friday');
    console.log('   • "0 17 * * *" = 5:00 PM, daily');
    console.log('   • "0 8 * * 1,3,5" = 8:00 AM, Monday/Wednesday/Friday');

    this.scheduledTask = cron.schedule(cronExpression, async () => {
      console.log('⏰ Scheduled daily report execution started');
      try {
        await DailyReportsService.sendDailyReport();
        console.log('✅ Scheduled daily report completed successfully');
      } catch (error) {
        console.error('❌ Scheduled daily report failed:', error);
      }
    }, {
      timezone: 'America/Los_Angeles', // Pacific Time
    });

    console.log('✅ Daily report scheduler started successfully');
  }

  /**
   * Stop the daily report scheduler
   */
  static stop(): void {
    if (this.scheduledTask) {
      this.scheduledTask.stop();
      this.scheduledTask.destroy();
      this.scheduledTask = null;
      console.log('🛑 Daily report scheduler stopped');
    } else {
      console.log('⚠️  No scheduler is currently running');
    }
  }

  /**
   * Get scheduler status
   */
  static getStatus(): { isRunning: boolean; cronExpression?: string } {
    const isRunning = this.scheduledTask !== null;
    return {
      isRunning,
      cronExpression: isRunning ? 'Active' : undefined,
    };
  }

  /**
   * Trigger manual report (for testing)
   */
  static async triggerManualReport(date?: string): Promise<void> {
    console.log('🔄 Triggering manual daily report...');
    try {
      await DailyReportsService.sendDailyReport(date);
      console.log('✅ Manual daily report completed');
    } catch (error) {
      console.error('❌ Manual daily report failed:', error);
      throw error;
    }
  }

  /**
   * Test the scheduler setup without starting it
   */
  static testSchedule(cronExpression: string): void {
    if (!cron.validate(cronExpression)) {
      console.error('❌ Invalid cron expression:', cronExpression);
      return;
    }

    console.log(`✅ Valid cron expression: ${cronExpression}`);

    // Show next few execution times
    const task = cron.schedule(cronExpression, () => {});

    console.log('📅 Next execution times:');
    try {
      // Note: node-cron doesn't have a direct "next execution" method,
      // so we'll just validate and show the expression
      console.log(`   Expression: ${cronExpression}`);
      console.log(`   Timezone: America/Los_Angeles (Pacific Time)`);
    } catch (error) {
      console.error('❌ Error calculating next execution:', error);
    }

    task.destroy();
  }

  /**
   * Get common cron expressions
   */
  static getCommonSchedules(): Record<string, string> {
    return {
      'daily_9am': '0 9 * * *',           // 9:00 AM daily
      'weekdays_9am': '0 9 * * 1-5',      // 9:00 AM weekdays only
      'daily_5pm': '0 17 * * *',          // 5:00 PM daily
      'weekdays_8am': '0 8 * * 1-5',      // 8:00 AM weekdays only
      'monday_wednesday_friday_10am': '0 10 * * 1,3,5', // 10:00 AM MWF
      'end_of_business': '0 18 * * 1-5',  // 6:00 PM weekdays
    };
  }

  /**
   * Initialize scheduler from environment variables
   */
  static initFromEnvironment(): void {
    const cronExpression = process.env.DAILY_REPORT_SCHEDULE;
    const autoStart = process.env.AUTO_START_SCHEDULER === 'true';

    if (cronExpression) {
      console.log(`📋 Found scheduled expression in environment: ${cronExpression}`);
      if (autoStart) {
        console.log('🚀 Auto-starting scheduler...');
        this.start(cronExpression);
      } else {
        console.log('ℹ️  Scheduler configured but not auto-started (set AUTO_START_SCHEDULER=true to enable)');
      }
    } else {
      console.log('ℹ️  No DAILY_REPORT_SCHEDULE found in environment variables');
      console.log('Common schedules:', this.getCommonSchedules());
    }
  }
}