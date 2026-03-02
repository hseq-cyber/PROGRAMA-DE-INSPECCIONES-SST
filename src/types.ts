import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface InspectionType {
  id: number;
  name: string;
  frequency: string;
  responsible: string;
}

export interface ScheduleItem {
  id: number;
  type_id: number;
  type_name: string;
  scheduled_date: string;
  status: 'pending' | 'executed' | 'overdue';
  responsible: string;
}

export interface Finding {
  id: number;
  inspection_id: number;
  inspection_type: string;
  execution_date: string;
  description: string;
  risk_level: 'Low' | 'Medium' | 'High';
  action_plan: string;
  responsible: string;
  due_date: string;
  status: 'Open' | 'In Process' | 'Closed';
  photo_evidence?: string;
}

export interface DashboardStats {
  totalScheduled: number;
  executed: number;
  pending: number;
  openFindings: number;
  closedFindings: number;
  riskCorrectionIndex: number;
}
