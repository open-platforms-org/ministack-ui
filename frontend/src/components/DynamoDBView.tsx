import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTables, getTableDetails, getTableItems } from '../api';
import styles from './DynamoDBView.module.css';

export default function DynamoDBView() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tab, setTab] = useState<'items' | 'details'>('items');

  const { data: tables = [], isLoading: loadingTables, refetch: refetchTables } = useQuery({
    queryKey: ['tables'],
    queryFn: getTables,
  });

  const { data: details, isLoading: loadingDetails } = useQuery({
    queryKey: ['table-details', selectedTable],
    queryFn: () => getTableDetails(selectedTable!),
    enabled: !!selectedTable,
  });

  const { data: itemsData, isLoading: loadingItems, refetch: refetchItems } = useQuery({
    queryKey: ['table-items', selectedTable],
    queryFn: () => getTableItems(selectedTable!, 100),
    enabled: !!selectedTable,
  });

  const items = itemsData?.items ?? [];

  const getColumns = () => {
    if (!items.length) return [];
    const cols = new Set<string>();
    items.forEach((item: Record<string, any>) => Object.keys(item).forEach(k => cols.add(k)));
    return Array.from(cols);
  };

  const getValue = (cell: any): string => {
    if (!cell) return '-';
    const type = Object.keys(cell)[0];
    return String(cell[type]);
  };

  const columns = getColumns();

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Tabelas</h2>
          <button onClick={() => refetchTables()} className={styles.refreshBtn} title="Atualizar">↻</button>
        </div>
        {loadingTables ? (
          <p className={styles.loading}>Carregando...</p>
        ) : tables.length === 0 ? (
          <p className={styles.empty}>Nenhuma tabela encontrada</p>
        ) : (
          <ul className={styles.tableList}>
            {tables.map((table) => (
              <li
                key={table}
                className={`${styles.tableItem} ${selectedTable === table ? styles.selected : ''}`}
                onClick={() => { setSelectedTable(table); setTab('items'); }}
              >
                🗃️ {table}
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* Main Content */}
      <div className={styles.content}>
        {!selectedTable ? (
          <div className={styles.placeholder}>
            <span>👈</span>
            <p>Selecione uma tabela para visualizar</p>
          </div>
        ) : (
          <>
            <div className={styles.contentHeader}>
              <h2>{selectedTable}</h2>
              <div className={styles.tabs}>
                <button className={tab === 'items' ? styles.activeTab : styles.tabBtn} onClick={() => setTab('items')}>
                  Itens {itemsData?.count != null ? `(${itemsData.count})` : ''}
                </button>
                <button className={tab === 'details' ? styles.activeTab : styles.tabBtn} onClick={() => setTab('details')}>
                  Detalhes
                </button>
                <button onClick={() => refetchItems()} className={styles.refreshBtn} title="Atualizar">↻</button>
              </div>
            </div>

            {tab === 'items' && (
              <>
                {loadingItems ? (
                  <p className={styles.loading}>Carregando itens...</p>
                ) : items.length === 0 ? (
                  <p className={styles.empty}>Nenhum item na tabela</p>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          {columns.map(col => <th key={col}>{col}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: any, i: number) => (
                          <tr key={i}>
                            {columns.map(col => (
                              <td key={col}>{getValue(item[col])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {tab === 'details' && (
              <div className={styles.jsonWrapper}>
                {loadingDetails ? (
                  <p className={styles.loading}>Carregando detalhes...</p>
                ) : (
                  <pre>{JSON.stringify(details, null, 2)}</pre>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

