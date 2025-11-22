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

export const Graph = (props: GraphProps) => {
  const { conceptTree, options: customOptions, onRender, onDestroy } = props;
  const graphRef = useRef<G6Graph | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const graphOptions = useMemo<GraphOptions>(() => {
    const baseOptions: GraphOptions = {
      autoFit: 'view',
      padding: 50,
      node: {
        style: {
          size: 12,
          labelText: (d) => {
            const nodeData = d.data as ConceptTree | undefined;
            return nodeData?.name || (d.id as string);
          },
          labelBackground: true,
          labelFontSize: 14,
          labelFontFamily: 'Gill Sans',
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
      transforms: ['place-radial-labels'],
      animation: false,
    };

    if (conceptTree) {
      baseOptions.data = treeToGraphData(conceptTree);
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
      if (graph) {
        graph.destroy();
        onDestroy?.();
        graphRef.current = undefined;
      }
    };
  }, [onDestroy]);

  useEffect(() => {
    const container = containerRef.current;
    const graph = graphRef.current;

    if (!graphOptions || !container || !graph || graph.destroyed) return;

    graph.setOptions(graphOptions);
    graph
      .render()
      .then(() => onRender?.(graph))
      .catch((error: unknown) => console.debug(error));
  }, [graphOptions, onRender]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};
