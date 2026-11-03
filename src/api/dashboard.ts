import type { DashboardAccessTrend, DashboardChartItem, DashboardOverview } from './types/dashboard'
import { http } from '@/http/http'

export function fetchDashboardPv() {
  return http.get<DashboardOverview>('/dashboard/analysis/overview/pv')
}

export function fetchDashboardIp() {
  return http.get<DashboardOverview>('/dashboard/analysis/overview/ip')
}

export function fetchDashboardTrend() {
  return http.get<DashboardAccessTrend[]>('/dashboard/access/trend/7')
}

export function fetchDashboardModules() {
  return http.get<DashboardChartItem[]>('/dashboard/analysis/module')
}
