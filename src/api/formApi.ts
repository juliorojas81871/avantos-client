import axios from 'axios';
import type { FormGraph } from '../types';

const API_BASE_URL = 'http://localhost:3000';


export const getFormGraph = async (): Promise<FormGraph> => {
  // Using a mock ID for demonstration - in a real app this would come from the route/context
  const response = await axios.get(`${API_BASE_URL}/api/v1/1/actions/blueprints/bp_01jk766tckfwx84xjcxazggzyc/graph`);
  
  // Transform the response to match our expected types
  const data = response.data;
  return {
    nodes: data.nodes.map((node: any) => ({
      id: node.id,
      name: node.data.name,
      dependencies: node.data.prerequisites || [],
      fields: Object.entries(data.forms.find((f: any) => f.id === node.data.component_id)?.field_schema.properties || {}).map(([key, value]: [string, any]) => ({
        id: key,
        name: value.title || key,
        type: value.avantos_type || value.type,
      })),
    })),
    edges: data.edges,
  };
};


export const getGlobalData = async (): Promise<Record<string, any>> => {
  // Mock global data - in a real app this would come from an API
  return {
    actionProperties: {
      actionId: '123',
      actionName: 'Sample Action',
      createdAt: new Date().toISOString(),
    },
    clientProperties: {
      clientId: '456',
      clientName: 'Sample Client',
      region: 'US',
    },
  };
}; 