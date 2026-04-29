import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getLambdaFunctions, getLambdaEventSources, invokeLambda } from '../api';
import styles from './LambdaView.module.css';

export default function LambdaView() {
  const [selected, setSelected] = useState<any | null>(null);
  const [tab, setTab] = useState<'details' | 'invoke' | 'events'>('details');
  const [payload, setPayload] = useState('{}');
  const [invokeResult, setInvokeResult] = useState<any | null>(null);

  const { data: functions = [], isLoading, refetch } = useQuery({
    queryKey: ['lambda-functions'],
    queryFn: getLambdaFunctions,
  });

  const { data: eventSources = [] } = useQuery({
    queryKey: ['lambda-events', selected?.FunctionName],
    queryFn: () => getLambdaEventSources(selected.FunctionName),
    enabled: !!selected && tab === 'events',
  });

  const invokeMutation = useMutation({
    mutationFn: () => invokeLambda(selected.FunctionName, JSON.parse(payload)),
    onSuccess: (data) => setInvokeResult(data),
    onError: (err: any) => setInvokeResult({ error: err.message }),
  });

  const runtimeColor = (rt: string = '') => {
    if (rt.startsWith('nodejs')) return styles.nodejs;
    if (rt.startsWith('python')) return styles.python;
    if (rt.startsWith('java')) return styles.java;
    return styles.other;
  };

  const formatSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Funções</h2>
          <button onClick={() => refetch()} className={styles.refreshBtn}>↻</button>
        </div>
        {isLoading ? (
          <p className={styles.loading}>Carregando...</p>
        ) : functions.length === 0 ? (
          <p className={styles.empty}>Nenhuma função encontrada</p>
        ) : (
          <ul className={styles.list}>
            {functions.map((fn: any) => (
              <li
                key={fn.FunctionName}
                className={`${styles.item} ${selected?.FunctionName === fn.FunctionName ? styles.selected : ''}`}
                onClick={() => { setSelected(fn); setTab('details'); setInvokeResult(null); }}
              >
                <span className={styles.itemName}>⚡ {fn.FunctionName}</span>
                <span className={`${styles.runtime} ${runtimeColor(fn.Runtime)}`}>{fn.Runtime}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Content */}
      <div className={styles.content}>
        {!selected ? (
          <div className={styles.placeholder}>
            <span>⚡</span>
            <p>Selecione uma função para visualizar</p>
          </div>
        ) : (
          <>
            <div className={styles.contentHeader}>
              <div>
                <h2>{selected.FunctionName}</h2>
                <p className={styles.arn}>{selected.FunctionArn}</p>
              </div>
              <div className={styles.tabs}>
                <button className={tab === 'details' ? styles.activeTab : styles.tabBtn} onClick={() => setTab('details')}>Detalhes</button>
                <button className={tab === 'invoke' ? styles.activeTab : styles.tabBtn} onClick={() => setTab('invoke')}>▶ Invocar</button>
                <button className={tab === 'events' ? styles.activeTab : styles.tabBtn} onClick={() => setTab('events')}>Event Sources</button>
              </div>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Runtime</span>
                <span className={`${styles.statValue} ${runtimeColor(selected.Runtime)}`}>{selected.Runtime}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Memória</span>
                <span className={styles.statValue}>{selected.MemorySize} MB</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Timeout</span>
                <span className={styles.statValue}>{selected.Timeout}s</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Tamanho</span>
                <span className={styles.statValue}>{selected.CodeSize ? formatSize(selected.CodeSize) : '-'}</span>
              </div>
            </div>

            {/* Details */}
            {tab === 'details' && (
              <div className={styles.details}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>Handler</span><span className={styles.detailValue}>{selected.Handler}</span></div>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>Role</span><span className={styles.detailValue}>{selected.Role}</span></div>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>Última modificação</span><span className={styles.detailValue}>{selected.LastModified}</span></div>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>Arquitetura</span><span className={styles.detailValue}>{selected.Architectures?.join(', ')}</span></div>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>Versão</span><span className={styles.detailValue}>{selected.Version}</span></div>
                  <div className={styles.detailItem}><span className={styles.detailLabel}>Estado</span><span className={styles.detailValue}>{selected.State ?? 'Active'}</span></div>
                </div>
                {selected.Description && (
                  <div className={styles.description}>
                    <span className={styles.detailLabel}>Descrição</span>
                    <p>{selected.Description}</p>
                  </div>
                )}
                {selected.Environment?.Variables && Object.keys(selected.Environment.Variables).length > 0 && (
                  <div className={styles.envSection}>
                    <span className={styles.detailLabel}>Variáveis de Ambiente</span>
                    <table className={styles.envTable}>
                      <thead><tr><th>Chave</th><th>Valor</th></tr></thead>
                      <tbody>
                        {Object.entries(selected.Environment.Variables).map(([k, v]) => (
                          <tr key={k}><td>{k}</td><td>{String(v)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Invoke */}
            {tab === 'invoke' && (
              <div className={styles.invokeSection}>
                <label className={styles.label}>Payload (JSON)</label>
                <textarea
                  className={styles.textarea}
                  value={payload}
                  onChange={e => setPayload(e.target.value)}
                  rows={6}
                  placeholder='{}'
                />
                <div className={styles.invokeActions}>
                  <button
                    className={styles.invokeBtn}
                    onClick={() => invokeMutation.mutate()}
                    disabled={invokeMutation.isPending}
                  >
                    {invokeMutation.isPending ? '⏳ Invocando...' : '▶ Invocar'}
                  </button>
                  {invokeResult && <button className={styles.clearBtn} onClick={() => setInvokeResult(null)}>✕ Limpar</button>}
                </div>

                {invokeResult && (
                  <div className={styles.result}>
                    <div className={styles.resultHeader}>
                      <span className={invokeResult.functionError ? styles.errorBadge : styles.successBadge}>
                        {invokeResult.functionError ? '❌ Erro' : `✅ Status ${invokeResult.statusCode}`}
                      </span>
                    </div>
                    <div className={styles.resultBlock}>
                      <span className={styles.resultLabel}>Response</span>
                      <pre>{invokeResult.payload ?? invokeResult.error}</pre>
                    </div>
                    {invokeResult.logs && (
                      <div className={styles.resultBlock}>
                        <span className={styles.resultLabel}>Logs</span>
                        <pre className={styles.logs}>{invokeResult.logs}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Event Sources */}
            {tab === 'events' && (
              <div className={styles.tableWrapper}>
                {eventSources.length === 0 ? (
                  <p className={styles.empty}>Nenhum event source mapping</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr><th>UUID</th><th>Event Source</th><th>Estado</th><th>Batch Size</th></tr>
                    </thead>
                    <tbody>
                      {eventSources.map((es: any) => (
                        <tr key={es.UUID}>
                          <td>{es.UUID}</td>
                          <td>{es.EventSourceArn}</td>
                          <td><span className={es.State === 'Enabled' ? styles.available : styles.stopped}>{es.State}</span></td>
                          <td>{es.BatchSize}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

