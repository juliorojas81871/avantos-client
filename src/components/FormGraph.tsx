import { useCallback, useEffect, useState } from 'react';
import { Box, Paper } from '@mui/material';
import type { FormNode, FormGraph as FormGraphType, PrefillConfig } from '../types';
import { getFormGraph } from '../api/formApi';
import PrefillModal from './PrefillModal';

export default function FormGraph() {
  const [graph, setGraph] = useState<FormGraphType | null>(null);
  const [selectedForm, setSelectedForm] = useState<FormNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const data = await getFormGraph();
        setGraph(data);
      } catch (error) {
        console.error('Error fetching graph:', error);
      }
    };
    fetchGraph();
  }, []);

  const handleFormClick = useCallback((form: FormNode) => {
    setSelectedForm(form);
    setIsModalOpen(true);
  }, []);

  const handlePrefillChange = useCallback((fieldId: string, prefill: PrefillConfig | null) => {
    if (!selectedForm || !graph) return;

    // Update the form's fields with the new prefill configuration
    setGraph(prevGraph => {
      if (!prevGraph) return null;
      return {
        ...prevGraph,
        nodes: prevGraph.nodes.map(node => {
          if (node.id !== selectedForm.id) return node;
          return {
            ...node,
            fields: node.fields.map(field => {
              if (field.id !== fieldId) return field;
              return { ...field, prefill };
            }),
          };
        }),
      };
    });

    // Update the selected form as well
    setSelectedForm(prev => {
      if (!prev) return null;
      return {
        ...prev,
        fields: prev.fields.map(field => {
          if (field.id !== fieldId) return field;
          return { ...field, prefill };
        }),
      };
    });
  }, [selectedForm, graph]);

  if (!graph) return null;

  // Calculate positions for each node
  const nodePositions = new Map<string, { x: number; y: number }>();
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  
  // Calculate levels for each node (distance from root)
  const calculateLevels = (nodeId: string, level: number, path = new Set<string>()) => {
    if (path.has(nodeId)) {
      // Cycle detected, use the current level
      levels.set(nodeId, level);
      return;
    }

    if (levels.has(nodeId)) {
      levels.set(nodeId, Math.max(levels.get(nodeId)!, level));
    } else {
      levels.set(nodeId, level);
    }
    
    path.add(nodeId);
    visited.add(nodeId);
    
    const outgoingEdges = graph.edges.filter(e => e.source === nodeId);
    outgoingEdges.forEach(edge => {
      calculateLevels(edge.target, level + 1, new Set(path));
    });
  };

  // Find root nodes (nodes with no incoming edges)
  const rootNodes = graph.nodes
    .filter(node => !graph.edges.some(e => e.target === node.id))
    .map(node => node.id);

  // If there are no root nodes (due to cycles), use any unvisited node as root
  if (rootNodes.length === 0) {
    const firstUnvisited = graph.nodes.find(node => !visited.has(node.id));
    if (firstUnvisited) {
      rootNodes.push(firstUnvisited.id);
    }
  }

  // Calculate levels starting from root nodes
  rootNodes.forEach(rootId => calculateLevels(rootId, 0));

  // Handle any remaining unvisited nodes (disconnected components)
  graph.nodes.forEach(node => {
    if (!visited.has(node.id)) {
      calculateLevels(node.id, 0);
    }
  });

  // Calculate x positions based on nodes at each level
  const nodesAtLevel = new Map<number, string[]>();
  levels.forEach((level, nodeId) => {
    const nodesInLevel = nodesAtLevel.get(level) || [];
    nodesInLevel.push(nodeId);
    nodesAtLevel.set(level, nodesInLevel);
  });

  // Set positions for each node
  const levelWidth = 250; // Increased from 200 to add more space between nodes
  const nodeHeight = 100; // Increased from 80 to add more space between nodes
  const nodePadding = 20; // Added padding between nodes
  nodesAtLevel.forEach((nodes, level) => {
    const levelX = level * levelWidth + 50;
    nodes.forEach((nodeId, index) => {
      const y = index * (nodeHeight + nodePadding) + 50;
      nodePositions.set(nodeId, { x: levelX, y });
    });
  });

  // Calculate required SVG dimensions
  const maxLevel = Math.max(...Array.from(levels.values()));
  const maxNodesInLevel = Math.max(...Array.from(nodesAtLevel.values()).map(nodes => nodes.length));
  const svgWidth = (maxLevel + 1) * levelWidth + 100; // Add padding
  const svgHeight = maxNodesInLevel * (nodeHeight + nodePadding) + 100; // Add padding

  return (
    <Box sx={{ p: 2, overflow: 'auto' }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <svg width={svgWidth} height={svgHeight} style={{ maxWidth: '100%', height: 'auto' }}>
          {/* Draw edges first so they appear behind nodes */}
          {graph.edges.map(edge => {
            const start = nodePositions.get(edge.source)!;
            const end = nodePositions.get(edge.target)!;
            return (
              <g key={`${edge.source}-${edge.target}`}>
                <line
                  x1={start.x + 150}
                  y1={start.y + 30}
                  x2={end.x}
                  y2={end.y + 30}
                  stroke="#999"
                  strokeWidth={2}
                  markerEnd="url(#arrowhead)"
                />
              </g>
            );
          })}

          {graph.nodes.map(node => {
            const pos = nodePositions.get(node.id)!;
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => handleFormClick(node)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                aria-label={`Open ${node.name}`}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleFormClick(node);
                  }
                }}
              >
                <rect
                  width={150}
                  height={60}
                  rx={8}
                  fill="#fff"
                  stroke="#1976d2"
                  strokeWidth={2}
                />
                <text
                  x={75}
                  y={35}
                  textAnchor="middle"
                  fill="#000"
                  fontSize={14}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth={10}
              markerHeight={7}
              refX={9}
              refY={3.5}
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
            </marker>
          </defs>
        </svg>
      </Paper>

      {selectedForm && (
        <PrefillModal
          form={selectedForm}
          forms={graph.nodes}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPrefillChange={handlePrefillChange}
        />
      )}
    </Box>
  );
} 