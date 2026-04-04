/**
 * Workflow Designer - Tip Tanimlari
 * ==================================
 * Gorsel workflow tasarimcisinin kullandigi veri yapilari.
 * Her node tipi FSL workflow adimina karsilik gelir.
 */

export type WorkflowNodeType = 'start' | 'end' | 'decision' | 'approval' | 'action' | 'wait';

export interface WorkflowNodeData {
  label: string;
  type: WorkflowNodeType;
  /** Decision node icin kosul ifadesi */
  condition?: string;
  /** Approval node icin atanan kisi/rol */
  assignee?: string;
  /** Approval node icin zaman asimi */
  timeout?: string;
  /** Action node icin islem turu */
  actionType?: 'send_email' | 'create_record' | 'update_record' | 'custom';
  /** Action node icin detay ayarlari */
  actionConfig?: Record<string, string>;
  /** Wait node icin bekleme suresi */
  waitDuration?: string;
}
