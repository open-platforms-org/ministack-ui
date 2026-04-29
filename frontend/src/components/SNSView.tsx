import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getTopics, getSubscriptions, publishMessage } from '../api';
import styles from './SNSView.module.css';

export default function SNSView() {
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [tab, setTab] = useState<'subscriptions' | 'publish'>('subscriptions');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');

  const { data: topics = [], isLoading, refetch: refetchTopics } = useQuery({
    queryKey: ['topics'],
    queryFn: getTopics,
  });

  const { data: subscriptions = [], isLoading: loadingSubs, refetch: refetchSubs } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getSubscriptions,
  });

  const topicSubs = subscriptions.filter((s: any) => s.TopicArn === selectedTopic?.arn);

  const publishMutation = useMutation({
    mutationFn: () => publishMessage(selectedTopic.arn, message, subject || undefined),
    onSuccess: () => { setMessage(''); setSubject(''); },
  });

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Tópicos</h2>
          <button onClick={() => refetchTopics()} className={styles.refreshBtn}>↻</button>
        </div>
        {isLoading ? (
          <p className={styles.loading}>Carregando...</p>
        ) : topics.length === 0 ? (
          <p className={styles.empty}>Nenhum tópico encontrado</p>
        ) : (
          <ul className={styles.list}>
            {topics.map((t: any) => (
              <li
                key={t.arn}
                className={`${styles.item} ${selectedTopic?.arn === t.arn ? styles.selected : ''}`}
                onClick={() => { setSelectedTopic(t); setTab('subscriptions'); }}
              >
                📢 {t.name}
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Content */}
      <div className={styles.content}>
        {!selectedTopic ? (
          <div className={styles.placeholder}>
            <span>📢</span>
            <p>Selecione um tópico para visualizar</p>
          </div>
        ) : (
          <>
            <div className={styles.contentHeader}>
              <div>
                <h2>{selectedTopic.name}</h2>
                <p className={styles.arn}>{selectedTopic.arn}</p>
              </div>
              <div className={styles.tabs}>
                <button className={tab === 'subscriptions' ? styles.activeTab : styles.tabBtn} onClick={() => setTab('subscriptions')}>
                  Assinaturas ({topicSubs.length})
                </button>
                <button className={tab === 'publish' ? styles.activeTab : styles.tabBtn} onClick={() => setTab('publish')}>
                  Publicar
                </button>
                <button onClick={() => refetchSubs()} className={styles.refreshBtn}>↻</button>
              </div>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Assinaturas</span>
                <span className={styles.statValue}>{selectedTopic.attributes?.SubscriptionsConfirmed ?? '0'}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Pendentes</span>
                <span className={styles.statValue}>{selectedTopic.attributes?.SubscriptionsPending ?? '0'}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Deletadas</span>
                <span className={styles.statValue}>{selectedTopic.attributes?.SubscriptionsDeleted ?? '0'}</span>
              </div>
            </div>

            {tab === 'subscriptions' && (
              <div className={styles.tableWrapper}>
                {loadingSubs ? (
                  <p className={styles.loading}>Carregando...</p>
                ) : topicSubs.length === 0 ? (
                  <p className={styles.empty}>Nenhuma assinatura neste tópico</p>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Protocolo</th>
                        <th>Endpoint</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topicSubs.map((s: any) => (
                        <tr key={s.SubscriptionArn}>
                          <td><span className={styles.protocol}>{s.Protocol}</span></td>
                          <td title={s.Endpoint}>{s.Endpoint}</td>
                          <td>
                            <span className={s.SubscriptionArn === 'PendingConfirmation' ? styles.pending : styles.confirmed}>
                              {s.SubscriptionArn === 'PendingConfirmation' ? 'Pendente' : 'Confirmado'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {tab === 'publish' && (
              <div className={styles.publishForm}>
                <label className={styles.label}>Assunto (opcional)</label>
                <input
                  className={styles.input}
                  placeholder="Assunto da mensagem"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                />
                <label className={styles.label}>Mensagem *</label>
                <textarea
                  className={styles.textarea}
                  placeholder='{"event": "test", "data": {}}'
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={6}
                />
                <div className={styles.publishActions}>
                  <button
                    onClick={() => publishMutation.mutate()}
                    className={styles.publishBtn}
                    disabled={!message || publishMutation.isPending}
                  >
                    {publishMutation.isPending ? 'Publicando...' : '📤 Publicar'}
                  </button>
                  {publishMutation.isSuccess && (
                    <span className={styles.successMsg}>✅ Mensagem publicada!</span>
                  )}
                  {publishMutation.isError && (
                    <span className={styles.errorMsg}>❌ Erro ao publicar</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

