import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQueues, getQueueMessages, sendMessage, purgeQueue } from '../api';
import styles from './SQSView.module.css';

export default function SQSView() {
  const queryClient = useQueryClient();
  const [selectedQueue, setSelectedQueue] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showSendForm, setShowSendForm] = useState(false);

  const { data: queues = [], isLoading, refetch: refetchQueues } = useQuery({
    queryKey: ['queues'],
    queryFn: getQueues,
  });

  const { data: messages = [], isLoading: loadingMessages, refetch: refetchMessages } = useQuery({
    queryKey: ['queue-messages', selectedQueue?.url],
    queryFn: () => getQueueMessages(selectedQueue.url),
    enabled: !!selectedQueue,
  });

  const sendMutation = useMutation({
    mutationFn: () => sendMessage(selectedQueue.url, newMessage),
    onSuccess: () => { setNewMessage(''); setShowSendForm(false); refetchMessages(); refetchQueues(); },
  });

  const purgeMutation = useMutation({
    mutationFn: () => purgeQueue(selectedQueue.url),
    onSuccess: () => refetchMessages(),
  });

  const getAttr = (attr: Record<string, string> | undefined, key: string) => attr?.[key] ?? '0';

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Filas</h2>
          <button onClick={() => refetchQueues()} className={styles.refreshBtn}>↻</button>
        </div>
        {isLoading ? (
          <p className={styles.loading}>Carregando...</p>
        ) : queues.length === 0 ? (
          <p className={styles.empty}>Nenhuma fila encontrada</p>
        ) : (
          <ul className={styles.list}>
            {queues.map((q: any) => (
              <li
                key={q.url}
                className={`${styles.item} ${selectedQueue?.url === q.url ? styles.selected : ''}`}
                onClick={() => setSelectedQueue(q)}
              >
                <span className={styles.itemName}>📨 {q.name}</span>
                <span className={styles.badge}>{getAttr(q.attributes, 'ApproximateNumberOfMessages')}</span>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Content */}
      <div className={styles.content}>
        {!selectedQueue ? (
          <div className={styles.placeholder}>
            <span>📨</span>
            <p>Selecione uma fila para visualizar</p>
          </div>
        ) : (
          <>
            <div className={styles.contentHeader}>
              <div>
                <h2>{selectedQueue.name}</h2>
                <p className={styles.url}>{selectedQueue.url}</p>
              </div>
              <div className={styles.actions}>
                <button onClick={() => setShowSendForm(v => !v)} className={styles.sendBtn}>
                  + Enviar mensagem
                </button>
                <button
                  onClick={() => { if (confirm('Purgar fila?')) purgeMutation.mutate(); }}
                  className={styles.purgeBtn}
                >
                  🗑 Purgar fila
                </button>
                <button onClick={() => refetchMessages()} className={styles.refreshBtn}>↻</button>
              </div>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Mensagens</span>
                <span className={styles.statValue}>{getAttr(selectedQueue.attributes, 'ApproximateNumberOfMessages')}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Em voo</span>
                <span className={styles.statValue}>{getAttr(selectedQueue.attributes, 'ApproximateNumberOfMessagesNotVisible')}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Delay (s)</span>
                <span className={styles.statValue}>{getAttr(selectedQueue.attributes, 'DelaySeconds')}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Retenção (s)</span>
                <span className={styles.statValue}>{getAttr(selectedQueue.attributes, 'MessageRetentionPeriod')}</span>
              </div>
            </div>

            {/* Send Form */}
            {showSendForm && (
              <div className={styles.sendForm}>
                <textarea
                  className={styles.textarea}
                  placeholder='{"key": "value"}'
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  rows={4}
                />
                <div className={styles.sendActions}>
                  <button onClick={() => sendMutation.mutate()} className={styles.sendBtn} disabled={!newMessage}>
                    {sendMutation.isPending ? 'Enviando...' : 'Enviar'}
                  </button>
                  <button onClick={() => setShowSendForm(false)} className={styles.cancelBtn}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Messages */}
            {loadingMessages ? (
              <p className={styles.loading}>Carregando mensagens...</p>
            ) : messages.length === 0 ? (
              <p className={styles.empty}>Nenhuma mensagem visível no momento</p>
            ) : (
              <div className={styles.messages}>
                {messages.map((msg: any) => (
                  <div key={msg.MessageId} className={styles.message}>
                    <div className={styles.messageHeader}>
                      <span className={styles.messageId}>ID: {msg.MessageId}</span>
                    </div>
                    <pre className={styles.messageBody}>{msg.Body}</pre>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

