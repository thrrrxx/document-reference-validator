'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  GitBranch,
  History,
  Package,
} from 'lucide-react';
import type { FlowLineageGraph, LineageNode } from '@/lib/analytics-service';

interface DocumentLineageGraphProps {
  flowId: string;
}

const STAGE_HEADERS = ['BOM', 'PR', 'PO', 'GR / Return', 'PI / CN', 'PP'];

const NODE_WIDTH = 164;
const NODE_HEIGHT = 82;
const COL_GAP = 54;
const ROW_GAP = 22;
const PAD_X = 16;
const PAD_Y = 36;

export default function DocumentLineageGraph({ flowId }: DocumentLineageGraphProps) {
  const [graph, setGraph] = useState<FlowLineageGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/references/${encodeURIComponent(flowId)}/lineage`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Gagal memuat graf lineage');
        }
        if (active) {
          setGraph(json.data);
          setSelectedNodeId(json.data.nodes?.[0]?.id ?? null);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Gagal memuat graf lineage');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [flowId]);

  const layout = useMemo(() => {
    if (!graph) return { positions: new Map<string, { x: number; y: number }>(), width: 960, height: 260 };

    const columnBuckets = new Map<number, LineageNode[]>();
    for (const node of graph.nodes) {
      const col = node.stageColumn;
      if (!columnBuckets.has(col)) columnBuckets.set(col, []);
      columnBuckets.get(col)!.push(node);
    }

    const positions = new Map<string, { x: number; y: number }>();
    let maxRows = 1;

    for (const [col, nodesInCol] of columnBuckets.entries()) {
      maxRows = Math.max(maxRows, nodesInCol.length);
      nodesInCol.forEach((n, rowIdx) => {
        const x = PAD_X + col * (NODE_WIDTH + COL_GAP);
        const y = PAD_Y + rowIdx * (NODE_HEIGHT + ROW_GAP);
        positions.set(n.id, { x, y });
      });
    }

    const width = PAD_X * 2 + 6 * NODE_WIDTH + 5 * COL_GAP;
    const height = Math.max(220, PAD_Y + maxRows * (NODE_HEIGHT + ROW_GAP) + 16);

    return { positions, width, height };
  }, [graph]);

  if (isLoading) {
    return (
      <div className="py-12 flex items-center justify-center text-xs text-gray-500">
        Memuat graf relasi dokumen...
      </div>
    );
  }

  if (error || !graph) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
        {error || 'Data graf tidak tersedia.'}
      </div>
    );
  }

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId) || graph.nodes[0] || null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <GitBranch className="w-4 h-4 text-blue-600" />
          <span>Interactive Document Lineage DAG ({graph.nodes.length} Dokumen, {graph.edges.length} Relasi)</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Valid</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Warning</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Invalid</span>
        </div>
      </div>

      {/* Scrollable DAG Canvas */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 p-2">
        <div className="relative" style={{ width: layout.width, height: layout.height }}>
          {/* Stage Column Headers */}
          {STAGE_HEADERS.map((title, colIdx) => (
            <div
              key={title}
              className="absolute top-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center"
              style={{
                left: PAD_X + colIdx * (NODE_WIDTH + COL_GAP),
                width: NODE_WIDTH,
              }}
            >
              {title}
            </div>
          ))}

          {/* SVG Bezier Edges */}
          <svg
            width={layout.width}
            height={layout.height}
            className="absolute inset-0 pointer-events-none"
          >
            {graph.edges.map((edge) => {
              const from = layout.positions.get(edge.sourceId);
              const to = layout.positions.get(edge.targetId);
              if (!from || !to) return null;

              const x1 = from.x + NODE_WIDTH;
              const y1 = from.y + NODE_HEIGHT / 2;
              const x2 = to.x;
              const y2 = to.y + NODE_HEIGHT / 2;
              const cx = (x1 + x2) / 2;

              const stroke =
                edge.validationStatus === 'INVALID'
                  ? '#E11D48'
                  : edge.validationStatus === 'WARNING'
                  ? '#D97706'
                  : '#10B981';

              return (
                <path
                  key={edge.id}
                  d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={2}
                  strokeDasharray={edge.validationStatus === 'WARNING' ? '5 3' : undefined}
                />
              );
            })}
          </svg>

          {/* Interactive Document Nodes */}
          {graph.nodes.map((node) => {
            const pos = layout.positions.get(node.id);
            if (!pos) return null;
            const isSelected = selectedNode?.id === node.id;

            const borderClass =
              node.status === 'VOID'
                ? 'border-gray-400 opacity-60'
                : node.validationStatus === 'INVALID'
                ? 'border-rose-400 dark:border-rose-700'
                : node.validationStatus === 'WARNING'
                ? 'border-amber-400 dark:border-amber-700'
                : 'border-emerald-400 dark:border-emerald-700';

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: NODE_WIDTH,
                  height: NODE_HEIGHT,
                }}
                className={`absolute text-left p-2.5 rounded-xl bg-white dark:bg-[#0F172A] border-2 shadow-xs transition hover:shadow-md flex flex-col justify-between ${borderClass} ${
                  isSelected ? 'ring-2 ring-blue-500/60' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    {node.documentType}
                  </span>
                  {node.validationStatus === 'VALID' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : node.validationStatus === 'INVALID' ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  ) : node.validationStatus === 'WARNING' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-mono font-bold text-gray-900 dark:text-white truncate">
                    {node.documentNumber}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center justify-between mt-0.5">
                    <span>{node.documentDate}</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {node.currency} {node.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Node Inspector & Forensic Audit Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {selectedNode && (
          <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-600" />
                <span>Detail Node: {selectedNode.documentNumber}</span>
              </h5>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {selectedNode.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-600 dark:text-gray-400">
              <div>Vendor: <strong className="text-gray-900 dark:text-white">{selectedNode.vendor}</strong></div>
              <div>Nilai IDR: <strong className="text-gray-900 dark:text-white">Rp {selectedNode.baseCurrencyAmount.toLocaleString('id-ID')}</strong></div>
              <div>PPN: <strong>Rp {selectedNode.taxAmount.toLocaleString('id-ID')}</strong></div>
              <div>PPh: <strong>Rp {selectedNode.withholdingTax.toLocaleString('id-ID')}</strong></div>
            </div>
            {selectedNode.items.length > 0 && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
                <div className="text-[10px] font-bold uppercase text-gray-400">
                  SKU Items ({selectedNode.items.length})
                </div>
                {selectedNode.items.slice(0, 4).map((it, idx) => (
                  <div key={`${it.itemCode}-${idx}`} className="flex justify-between text-[11px]">
                    <span className="font-mono text-gray-700 dark:text-gray-300">{it.itemCode}</span>
                    <span className="text-gray-500">
                      {it.quantity} × Rp {it.unitPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] space-y-2 max-h-48 overflow-y-auto">
          <h5 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit Trail Alur ({graph.auditLogs.length})</span>
          </h5>
          {graph.auditLogs.length === 0 ? (
            <p className="text-[11px] text-gray-500">Belum ada catatan audit.</p>
          ) : (
            <div className="space-y-1.5">
              {graph.auditLogs.slice(0, 8).map((log) => (
                <div key={log.id} className="text-[11px] border-b border-gray-100 dark:border-gray-800/60 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">{log.action}</span>
                    <span className="text-[10px] text-gray-400">{log.createdAt.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400 truncate">Oleh: {log.performedBy}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
