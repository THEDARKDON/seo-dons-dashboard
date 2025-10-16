/**
 * Commission Calculator Service
 * Handles commission calculations for sales deals
 * - 50% commission for first month
 * - 10% ongoing commission for subsequent months
 */

export class CommissionCalculator {
  /**
   * Calculate first month commission (50% of deal value)
   */
  static calculateFirstMonth(dealValue: number): number {
    return dealValue * 0.50;
  }

  /**
   * Calculate ongoing monthly commission (10% of deal value)
   */
  static calculateOngoing(dealValue: number): number {
    return dealValue * 0.10;
  }

  /**
   * Project total commission over a period
   * @param dealValue - The monthly value of the deal
   * @param expectedMonths - Number of months to project
   * @returns Object with first month, monthly, and total commission
   */
  static projectCommission(
    dealValue: number,
    expectedMonths: number
  ): { firstMonth: number; monthly: number; total: number } {
    const firstMonth = this.calculateFirstMonth(dealValue);
    const monthly = this.calculateOngoing(dealValue);
    const total = firstMonth + (monthly * (expectedMonths - 1));

    return {
      firstMonth: Number(firstMonth.toFixed(2)),
      monthly: Number(monthly.toFixed(2)),
      total: Number(total.toFixed(2))
    };
  }

  /**
   * Calculate total commission earned for a specific period
   * @param deals - Array of deal values
   * @param isFirstMonth - Whether this is the first month for these deals
   */
  static calculatePeriodTotal(deals: number[], isFirstMonth: boolean): number {
    const rate = isFirstMonth ? 0.50 : 0.10;
    const total = deals.reduce((sum, dealValue) => sum + (dealValue * rate), 0);
    return Number(total.toFixed(2));
  }
}
