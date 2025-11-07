/**
 * Centralized pipeline stages configuration
 * These stages are used globally throughout the application
 */

export const PIPELINE_STAGES = [
  {
    id: 'new_leads_call',
    value: 'new_leads_call',
    label: 'New leads (Call)',
    color: 'bg-slate-100 dark:bg-slate-800',
    textColor: 'text-slate-700 dark:text-slate-300',
    order: 1
  },
  {
    id: 'called_no_answer',
    value: 'called_no_answer',
    label: 'Called, No Answer',
    color: 'bg-yellow-50 dark:bg-yellow-950',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    order: 2
  },
  {
    id: 'called_more_action',
    value: 'called_more_action',
    label: 'Called, More Action Needed',
    color: 'bg-orange-50 dark:bg-orange-950',
    textColor: 'text-orange-700 dark:text-orange-300',
    order: 3
  },
  {
    id: 'meeting_booked',
    value: 'meeting_booked',
    label: 'Meeting Booked',
    color: 'bg-blue-50 dark:bg-blue-950',
    textColor: 'text-blue-700 dark:text-blue-300',
    order: 4
  },
  {
    id: 'meeting_rescheduled',
    value: 'meeting_rescheduled',
    label: 'Meeting Rescheduled',
    color: 'bg-indigo-50 dark:bg-indigo-950',
    textColor: 'text-indigo-700 dark:text-indigo-300',
    order: 5
  },
  {
    id: 'meeting_cancelled',
    value: 'meeting_cancelled',
    label: 'Meeting Cancelled',
    color: 'bg-red-50 dark:bg-red-950',
    textColor: 'text-red-700 dark:text-red-300',
    order: 6
  },
  {
    id: 'proposal_sent',
    value: 'proposal_sent',
    label: 'Proposal Sent',
    color: 'bg-purple-50 dark:bg-purple-950',
    textColor: 'text-purple-700 dark:text-purple-300',
    order: 7
  },
  {
    id: 'fup_call_booked',
    value: 'fup_call_booked',
    label: 'FUP Call Booked',
    color: 'bg-cyan-50 dark:bg-cyan-950',
    textColor: 'text-cyan-700 dark:text-cyan-300',
    order: 8
  },
  {
    id: 'closed_won',
    value: 'closed_won',
    label: 'Closed Won',
    color: 'bg-green-50 dark:bg-green-950',
    textColor: 'text-green-700 dark:text-green-300',
    order: 9
  },
  {
    id: 'closed_lost',
    value: 'closed_lost',
    label: 'Closed Lost',
    color: 'bg-gray-50 dark:bg-gray-950',
    textColor: 'text-gray-700 dark:text-gray-300',
    order: 10
  },
  {
    id: 'dead_lead',
    value: 'dead_lead',
    label: 'Dead Lead',
    color: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-500 dark:text-gray-400',
    order: 11
  }
] as const;

export type PipelineStageId = typeof PIPELINE_STAGES[number]['id'];
export type PipelineStageValue = typeof PIPELINE_STAGES[number]['value'];

// Helper functions
export function getStageById(id: string) {
  return PIPELINE_STAGES.find(stage => stage.id === id);
}

export function getStageByValue(value: string) {
  return PIPELINE_STAGES.find(stage => stage.value === value);
}

export function getStageLabel(value: string): string {
  const stage = getStageByValue(value);
  return stage?.label || value;
}

export function getStageColor(value: string): string {
  const stage = getStageByValue(value);
  return stage?.color || 'bg-gray-100 dark:bg-gray-800';
}

export function getStageTextColor(value: string): string {
  const stage = getStageByValue(value);
  return stage?.textColor || 'text-gray-700 dark:text-gray-300';
}

// Stage groups for analytics and filtering
export const ACTIVE_STAGES = [
  'new_leads_call',
  'called_no_answer',
  'called_more_action',
  'meeting_booked',
  'meeting_rescheduled',
  'proposal_sent',
  'fup_call_booked'
];

export const CLOSED_STAGES = ['closed_won', 'closed_lost'];
export const INACTIVE_STAGES = ['meeting_cancelled', 'dead_lead'];

// Legacy stage mapping (for migration from old system)
export const LEGACY_STAGE_MAPPING: Record<string, PipelineStageValue> = {
  'prospecting': 'new_leads_call',
  'qualification': 'called_more_action',
  'proposal': 'proposal_sent',
  'negotiation': 'fup_call_booked',
  'closed_won': 'closed_won',
  'closed_lost': 'closed_lost'
};