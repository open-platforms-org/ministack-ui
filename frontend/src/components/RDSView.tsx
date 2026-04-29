import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getRdsInstances, getRdsClusters, startRdsInstance, stopRdsInstance } from '../api';
import styles from './RDSView.module.css';

export default function RDSView() {
  const [tab, setTab] = useState<'instances' | 'clusters'>('instances');

  const { data: instances = [], isLoading: loadingInstances, refetch: refetchInstances } = useQuery({
    queryKey: ['rds-instances'],
    queryFn: getRdsInstances,
  });

  const { data: clusters = [], isLoading: loadingClusters, refetch: refetchClusters } = useQuery({
    queryKey: ['rds-clusters'],
    queryFn: getRdsClusters,
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => startRdsInstance(id),
    onSuccess: () => refetchInstances(),
  });

  const stopMutation = useMutation({
    mutationFn: (id: string) => stopRdsInstance(id),
    onSuccess: () => refetchInstances(),
  });

  const statusColor = (status: string) => {
    if (status === 'available') return styles.available;
    if (status === 'stopped') return styles.stopped;
    if (status?.includes('start') || status?.includes('creat')) return styles.starting;
    return styles.other;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button className={tab === 'instances' ? styles.activeTab : styles.tabBtn} onClick={() => setTab('instances')}>
            Instâncias ({instances.length})
          </button>
          <button className={tab === 'clusters' ? styles.activeTab : styles.tabBtn} onClick={() => setTab('clusters')}>
            Clusters ({clusters.length})
          </button>
        </div>
        <button onClick={() => tab === 'instances' ? refetchInstances() : refetchClusters()} className={styles.refreshBtn}>↻</button>
      </div>

      {tab === 'instances' && (
        <>
          {loadingInstances ? (
            <p className={styles.loading}>Carregando instâncias...</p>
          ) : instances.length === 0 ? (
            <div className={styles.empty}>
              <span>🐘</span>
              <p>Nenhuma instância RDS encontrada</p>
              <small>Crie uma instância com <code>aws --endpoint-url=http://localhost:4566 rds create-db-instance ...</code></small>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Identificador</th>
                    <th>Engine</th>
                    <th>Versão</th>
                    <th>Classe</th>
                    <th>Status</th>
                    <th>Endpoint</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {instances.map((inst: any) => (
                    <tr key={inst.DBInstanceIdentifier}>
                      <td><strong>{inst.DBInstanceIdentifier}</strong></td>
                      <td>{inst.Engine}</td>
                      <td>{inst.EngineVersion}</td>
                      <td>{inst.DBInstanceClass}</td>
                      <td><span className={`${styles.badge} ${statusColor(inst.DBInstanceStatus)}`}>{inst.DBInstanceStatus}</span></td>
                      <td className={styles.endpoint}>{inst.Endpoint ? `${inst.Endpoint.Address}:${inst.Endpoint.Port}` : '-'}</td>
                      <td>
                        <div className={styles.actions}>
                          {inst.DBInstanceStatus === 'stopped' && (
                            <button className={styles.startBtn} onClick={() => startMutation.mutate(inst.DBInstanceIdentifier)}>▶ Start</button>
                          )}
                          {inst.DBInstanceStatus === 'available' && (
                            <button className={styles.stopBtn} onClick={() => stopMutation.mutate(inst.DBInstanceIdentifier)}>■ Stop</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'clusters' && (
        <>
          {loadingClusters ? (
            <p className={styles.loading}>Carregando clusters...</p>
          ) : clusters.length === 0 ? (
            <div className={styles.empty}>
              <span>🐘</span>
              <p>Nenhum cluster RDS encontrado</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Identificador</th>
                    <th>Engine</th>
                    <th>Versão</th>
                    <th>Status</th>
                    <th>Endpoint</th>
                    <th>Membros</th>
                  </tr>
                </thead>
                <tbody>
                  {clusters.map((c: any) => (
                    <tr key={c.DBClusterIdentifier}>
                      <td><strong>{c.DBClusterIdentifier}</strong></td>
                      <td>{c.Engine}</td>
                      <td>{c.EngineVersion}</td>
                      <td><span className={`${styles.badge} ${statusColor(c.Status)}`}>{c.Status}</span></td>
                      <td className={styles.endpoint}>{c.Endpoint ?? '-'}</td>
                      <td>{c.DBClusterMembers?.length ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

