import type { GraphOptions } from '@antv/g6';
import { Graph as G6Graph, treeToGraphData } from '@antv/g6';
import { useEffect, useRef, useMemo } from 'react';

export interface ConceptData {
  concepts: string;
  description: string;
  context?: string;
}

export interface VideoData {
  video_id: string;
}

export type ConceptTree =
  | {
    id: string;
    name: string;
    type: 'concept';
    data: ConceptData;
    children?: ConceptTree[];
  }
  | {
    id: string;
    name: string;
    type: 'video';
    data: VideoData;
    children?: ConceptTree[];
  };

export interface GraphProps {
  conceptTree?: ConceptTree;
  options?: Partial<GraphOptions>;
  onRender?: (graph: G6Graph) => void;
  onDestroy?: () => void;
}


const mockConceptTree: ConceptTree = {
  id: 'root',
  name: 'Learning Topics',
  type: 'concept',
  data: {
    concepts: 'Educational Content',
    description: 'Root node containing various learning topics and related videos',
    context: 'This is the main concept tree for organizing educational content'
  },
  children: [
    {
      id: 'ml-basics',
      name: 'Machine Learning Basics',
      type: 'concept',
      data: {
        concepts: 'Machine Learning',
        description: 'Fundamental concepts and techniques in machine learning including supervised and unsupervised learning',
        context: 'Covers neural networks, decision trees, and regression models'
      },
      children: [
        {
          id: 'neural-networks',
          name: 'Neural Networks',
          type: 'concept',
          data: {
            concepts: 'Neural Networks',
            description: 'Deep dive into artificial neural networks, backpropagation, and activation functions',
            context: 'Includes feedforward and convolutional neural network architectures'
          },
          children: [
            {
              id: 'video-nn-intro',
              name: 'Introduction to Neural Networks',
              type: 'video',
              data: {
                video_id: 'dQw4w9WgXcQ'
              }
            }
          ]
        },
        {
          id: 'video-ml-overview',
          name: 'ML Overview Video',
          type: 'video',
          data: {
            video_id: 'aircAruvnKk'
          }
        }
      ]
    },
    {
      id: 'data-science',
      name: 'Data Science',
      type: 'concept',
      data: {
        concepts: 'Data Science',
        description: 'Comprehensive guide to data science workflows, data preprocessing, and analysis techniques',
        context: 'Covers data collection, cleaning, visualization, and statistical analysis'
      },
      children: [
        {
          id: 'data-visualization',
          name: 'Data Visualization',
          type: 'concept',
          data: {
            concepts: 'Data Visualization',
            description: 'Techniques for creating effective visualizations and dashboards',
            context: 'Includes matplotlib, seaborn, and plotly examples'
          }
        },
        {
          id: 'video-ds-tutorial',
          name: 'Data Science Tutorial',
          type: 'video',
          data: {
            video_id: 'ua-CiDNNj30'
          }
        }
      ]
    },
    {
      id: 'video-main',
      name: 'Main Learning Video',
      type: 'video',
      data: {
        video_id: 'RBmOgQi4Fr0'
      }
    }
  ]
}


export interface GraphDataNode {
  id: string;
  value?: number;
  depth?: number;
  children?: GraphDataNode[];
  [key: string]: unknown;
}

export const transformConceptTreeToGraphData = (tree: ConceptTree, depth = 0): GraphDataNode => {
  return {
    id: tree.id,
    value: 10, // Default value to match mock data structure
    depth,
    children: tree.children?.map((child) => transformConceptTreeToGraphData(child, depth + 1)),
    data: tree, // Store original data for label rendering
  };
};



export const Graph = (props: GraphProps) => {
  const { conceptTree, options: customOptions, onRender, onDestroy } = props;
  const graphRef = useRef<G6Graph | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const graphOptions = useMemo<GraphOptions>(() => {
    const baseOptions: GraphOptions = {
      // Use container size or default
      width: containerRef.current?.clientWidth || 800,
      height: containerRef.current?.clientHeight || 600,
      autoFit: 'center', // Center the graph in the viewport
      padding: 50,
      node: {
        style: {
          size: 12,
          fill: (d) => {
            const depth = (d.depth as number) || 0;
            if (depth === 0) return '#fff';
            if (depth === 1) return '#ddd';
            const nodeData = d.data as ConceptTree | undefined;
            return nodeData?.type === 'video' ? '#f5222d' : '#ccc';
          },
          shadowColor: (d) => {
            const depth = (d.depth as number) || 0;
            if (depth === 0) return '#fff';
            if (depth === 1) return '#ddd';
            const nodeData = d.data as ConceptTree | undefined;
            return nodeData?.type === 'video' ? '#f5222d' : '#ccc';
          },
          shadowBlur: 10,
          labelText: (d) => {
            const depth = (d.depth as number) || 0;
            if (depth === 0) return '';
            const nodeData = d.data as ConceptTree | undefined;
            return nodeData?.name || (d.id as string);
          },
          labelFontSize: (d) => {
            const depth = (d.depth as number) || 0;
            // Base size 24, decrease by 2 for each level, minimum 12
            return Math.max(14, 30 - depth * 10);
          },
          labelFontFamily: 'Gill Sans',
          labelFill: '#fff', // White text
          labelFontWeight: 'bold', // Bold text
          labelPlacement: 'right',
        },
      },
      edge: {
        type: 'cubic-radial',
        style: {
          lineWidth: 3,
        },
      },
      layout: {
        type: 'compact-box',
        radial: true,
        direction: 'RL',
        getVGap: () => 40,
        getHGap: () => 80,
        preLayout: false,
      },
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        'drag-element',
        {
          key: 'hover-activate',
          type: 'hover-activate',
          degree: 5,
          direction: 'in',
          inactiveState: 'inactive',
        },
      ],
      transforms: [
        {
          type: 'place-radial-labels',
          offset: 10,
        },
      ],
      animation: false,
      plugins: [
        {
          type: 'tooltip',
          trigger: 'hover',
          enterable: true,
          getContent: (_: any, items: any[]) => {
            // items[0] is the node being hovered
            if (!items || items.length === 0) return '';

            const model = items[0];
            const nodeData = model.data as ConceptTree | undefined;

            if (nodeData?.type === 'concept' && nodeData.data) {
              const description = (nodeData.data as ConceptData).description;
              const nodeTitle = nodeData.name || 'Untitled';
              return `
                <div style="
                  background: rgba(0, 0, 0, 0.75);
                  padding: 12px 16px;
                  color: #fff;
                  border-radius: 4px;
                  font-family: 'Gill Sans', sans-serif;
                  max-width: 500px;
                  pointer-events: none;
                ">
                  <div style="
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 8px;
                  ">
                    ${nodeTitle}
                  </div>
                  <div style="
                    font-size: 16px;
                  ">
                    ${description || 'No description available'}
                  </div>
                </div>
              `;
            } else if (nodeData?.type === 'video' && nodeData.data) {
              const videoId = (nodeData.data as VideoData).video_id;
              const nodeTitle = nodeData.name || 'Video';
              return `
                <div style="
                  display: inline-block;
                  background: rgba(0, 0, 0, 0.75);
                  padding: 12px 16px;
                  color: #fff;
                  border-radius: 4px;
                  font-family: 'Gill Sans', sans-serif;
                  width: 350px;
                  box-sizing: border-box;
                ">
                  <div style="
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 8px;
                  ">
                    ${nodeTitle}
                  </div>
                  
                  <iframe 
                    style="width: 100%; height: 225px; display: block; border: none;"
                    src="https://www.youtube.com/embed/${videoId}" 
                    title="${nodeTitle}"
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                  ></iframe>
                </div>
              `;
            }
            return '';
          },
        },
      ],
    };

    const dataTree = conceptTree;

    if (dataTree) {
      const transformedData = transformConceptTreeToGraphData(dataTree);
      // console.log('Transformed Graph Data:', transformedData);
      const graphData = treeToGraphData(transformedData || mockConceptTree)
      // console.log(graphData);
      baseOptions.data = graphData;
    }

    return { ...baseOptions, ...customOptions };
  }, [conceptTree, customOptions]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const graph = new G6Graph({ container });
    graphRef.current = graph;

    return () => {
      const graph = graphRef.current;
      if (graph && !graph.destroyed) {
        graph.destroy();
        onDestroy?.();
        graphRef.current = undefined;
      }
    };
  }, [onDestroy]);

  useEffect(() => {
    const container = containerRef.current;
    const graph = graphRef.current;

    if (!graphOptions || !container || !graph) return;

    // Check if graph is destroyed before any operations
    if (graph.destroyed) return;

    try {
      graph.setOptions(graphOptions);
      graph
        .render()
        .then(() => {
          // Check if graph is still valid before calling onRender
          const currentGraph = graphRef.current;
          if (currentGraph && !currentGraph.destroyed) {
            onRender?.(currentGraph);
          }
        })
        .catch((error: unknown) => {
          // Only log if graph wasn't destroyed (which is expected during cleanup)
          const currentGraph = graphRef.current;
          if (currentGraph && !currentGraph.destroyed) {
            console.debug(error);
          }
        });
    } catch (error) {
      // Graph might have been destroyed during setOptions
      if (graphRef.current && !graphRef.current.destroyed) {
        console.debug(error);
      }
    }
  }, [graphOptions, onRender]);

  // Handle container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeTimeout: ReturnType<typeof setTimeout>;

    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const graph = graphRef.current;
        if (!graph || graph.destroyed) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        if (width === 0 || height === 0) return;

        try {
          graph.resize(width, height);
          graph.fitView();
        } catch (error) {
          if (graphRef.current && !graphRef.current.destroyed) {
            console.debug('Error during graph resize:', error);
          }
        }
      }, 100);
    });

    resizeObserver.observe(container);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, []);

  return <div style={{ width: '100%', height: '100%' }}><img
                    src="src/graph.png"
                    alt="Graph preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', marginBottom: '8px', borderRadius: '4px', display: 'block' }}
                  /></div>;
};

export const isConceptTree = (node: any): node is ConceptTree => {
  if (typeof node !== 'object' || node === null) return false;
  if (typeof node.id !== 'string') return false;
  if (typeof node.name !== 'string') return false;

  if (node.type === 'concept') {
    if (typeof node.data?.concepts !== 'string') return false;
    if (typeof node.data?.description !== 'string') return false;
  } else if (node.type === 'video') {
    if (typeof node.data?.video_id !== 'string') return false;
  } else {
    return false;
  }

  if (node.children) {
    if (!Array.isArray(node.children)) return false;
    return node.children.every(isConceptTree);
  }

  return true;
};
