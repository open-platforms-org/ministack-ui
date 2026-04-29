import { useState } from 'react';
import DynamoDBView from './components/DynamoDBView';
import S3View from './components/S3View';
import SQSView from './components/SQSView';
import SNSView from './components/SNSView';
import RDSView from './components/RDSView';
import LambdaView from './components/LambdaView';
import Header from './components/Header';
import styles from './App.module.css';

type Tab = 'dynamodb' | 's3' | 'sqs' | 'sns' | 'rds' | 'lambda';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dynamodb');

  return (
    <div className={styles.app}>
      <Header />
      <nav className={styles.nav}>
        <button
          className={`${styles.tab} ${activeTab === 'dynamodb' ? styles.active : ''}`}
          onClick={() => setActiveTab('dynamodb')}
        >
          🗃️ DynamoDB
        </button>
        <button
          className={`${styles.tab} ${activeTab === 's3' ? styles.active : ''}`}
          onClick={() => setActiveTab('s3')}
        >
          🪣 S3
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'sqs' ? styles.active : ''}`}
          onClick={() => setActiveTab('sqs')}
        >
          📨 SQS
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'sns' ? styles.active : ''}`}
          onClick={() => setActiveTab('sns')}
        >
          📢 SNS
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'rds' ? styles.active : ''}`}
          onClick={() => setActiveTab('rds')}
        >
          🐘 RDS
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'lambda' ? styles.active : ''}`}
          onClick={() => setActiveTab('lambda')}
        >
          ⚡ Lambda
        </button>
      </nav>
      <main className={styles.main}>
        {activeTab === 'dynamodb' && <DynamoDBView />}
        {activeTab === 's3' && <S3View />}
        {activeTab === 'sqs' && <SQSView />}
        {activeTab === 'sns' && <SNSView />}
        {activeTab === 'rds' && <RDSView />}
        {activeTab === 'lambda' && <LambdaView />}
      </main>
    </div>
  );
}
