export interface Form {
  id: string;
  name: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  name: string;
  type: string;
  prefill?: PrefillConfig | null;
}

export interface PrefillConfig {
  sourceType: 'form' | 'global';
  sourceFormId: string;
  sourceFieldId: string;
}

export interface FormNode {
  id: string;
  name: string;
  dependencies: string[];
  fields: FormField[];
}

export interface FormGraph {
  nodes: FormNode[];
  edges: Edge[];
}

export interface Edge {
  source: string;
  target: string;
}

export interface GlobalData {
  actionProperties: Record<string, any>;
  clientProperties: Record<string, any>;
} 