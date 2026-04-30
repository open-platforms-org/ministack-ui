import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBuckets, getBucketObjects, getDownloadUrl, deleteObject } from '../api';
import styles from './S3View.module.css';

export default function S3View() {
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [prefix, setPrefix] = useState('');

  const { data: buckets = [], isLoading: loadingBuckets, refetch: refetchBuckets } = useQuery({
    queryKey: ['buckets'],
    queryFn: getBuckets,
  });

  const { data: objectsData, isLoading: loadingObjects, refetch: refetchObjects } = useQuery({
    queryKey: ['bucket-objects', selectedBucket, prefix],
    queryFn: () => getBucketObjects(selectedBucket!, prefix),
    enabled: !!selectedBucket,
  });

  const objects = objectsData?.objects ?? [];

  const handleDownload = async (key: string) => {
    if (!selectedBucket) return;
    const win = window.open('', '_blank');
    try {
      const presigned = await getDownloadUrl(selectedBucket, key);
      if (!presigned) throw new Error('no presigned url returned');
      win!.location.href = presigned;
    } catch (err) {
      try { win && win.close(); } catch (e) {}
      console.error('Download failed', err);
      alert('Falha ao iniciar download: ' + (err as any)?.message || 'unknown error');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Buckets</h2>
          <button onClick={() => refetchBuckets()} className={styles.refreshBtn} title="Atualizar">↻</button>
        </div>
        {loadingBuckets ? (
          <p className={styles.loading}>Carregando...</p>
        ) : buckets.length === 0 ? (
          <p className={styles.empty}>Nenhum bucket encontrado</p>
        ) : (
          <ul className={styles.bucketList}>
            {buckets.map((bucket: any) => (
              <li
                key={bucket.Name}
                className={`${styles.bucketItem} ${selectedBucket === bucket.Name ? styles.selected : ''}`}
                onClick={() => { setSelectedBucket(bucket.Name); setPrefix(''); }}
              >
                🪣 {bucket.Name}
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Main Content */}
      <div className={styles.content}>
        {!selectedBucket ? (
          <div className={styles.placeholder}>
            <span>🪣</span>
            <p>Selecione um bucket para visualizar</p>
          </div>
        ) : (
          <>
            <div className={styles.contentHeader}>
              <h2>{selectedBucket}</h2>
              <div className={styles.actions}>
                <input
                  className={styles.searchInput}
                  placeholder="Filtrar por prefixo..."
                  value={prefix}
                  onChange={e => setPrefix(e.target.value)}
                />
                <button onClick={() => refetchObjects()} className={styles.refreshBtn} title="Atualizar">↻</button>
              </div>
            </div>

            {loadingObjects ? (
              <p className={styles.loading}>Carregando objetos...</p>
            ) : objects.length === 0 ? (
              <p className={styles.empty}>Nenhum objeto encontrado</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Chave</th>
                      <th>Tamanho</th>
                      <th>Última Modificação</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {objects.map((obj: any) => (
                      <tr key={obj.Key}>
                        <td title={obj.Key}>{obj.Key}</td>
                        <td>{formatSize(obj.Size)}</td>
                        <td>{new Date(obj.LastModified).toLocaleString('pt-BR')}</td>
                        <td>
                          <button
                            className={styles.downloadBtn}
                            onClick={() => handleDownload(obj.Key)}
                            title="Download"
                          >
                            ⬇️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

