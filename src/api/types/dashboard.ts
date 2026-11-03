export interface DashboardOverview {
  total: number
  today: number
  growth: number | string
}

export interface DashboardAccessTrend {
  date: string
  pvCount: number
  ipCount: number
}

export interface DashboardChartItem {
  name: string
  value: number
}
