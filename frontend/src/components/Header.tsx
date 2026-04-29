import { useQuery } from '@tanstack/react-query';
import { getHealth } from '../api';
import styles from './Header.module.css';

export default function Header() {
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
    refetchInterval: 10000,
  });

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        🐳 <span>MiniStack UI</span>
      </div>
      <div className={`${styles.status} ${isError ? styles.offline : styles.online}`}>
        <span className={styles.dot} />
        {isError ? 'Offline' : `Online · ${data?.endpoint ?? 'localhost:4566'}`}
      </div>
    </header>
  );
}

