const BASE = '/api';

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if ((options as any).body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  if (res.status === 204) return null as unknown as T;

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  const text = await res.text();
  return text as unknown as T;
}

// DynamoDB
export const getTables = () => request<string[]>('/dynamodb/tables');
export const getTableDetails = (name: string) => request(`/dynamodb/tables/${name}`);
export const getTableItems = (name: string, limit = 50) =>
  request(`/dynamodb/tables/${name}/items?limit=${limit}`);
export const deleteTableItem = (tableName: string, key: Record<string, unknown>) =>
  request(`/dynamodb/tables/${tableName}/items`, { method: 'DELETE', body: JSON.stringify({ key }) });

// S3
export const getBuckets = () => request('/s3/buckets');
export const getBucketObjects = (bucket: string, prefix = '') =>
  request(`/s3/buckets/${bucket}/objects?prefix=${encodeURIComponent(prefix)}`);
export const getDownloadUrl = (bucket: string, key: string) =>
  request<{ url: string }>(`/s3/buckets/${bucket}/objects/presign?key=${encodeURIComponent(key)}`).then(r => r.url);
export const deleteObject = (bucket: string, key: string) =>
  request(`/s3/buckets/${bucket}/objects`, { method: 'DELETE', body: JSON.stringify({ key }) });

// SQS
export const getQueues = () => request('/sqs/queues');
export const getQueueMessages = (url: string) =>
  request(`/sqs/queues/messages?url=${encodeURIComponent(url)}`);
export const sendMessage = (url: string, body: string) =>
  request('/sqs/queues/send', { method: 'POST', body: JSON.stringify({ url, body }) });
export const purgeQueue = (url: string) =>
  request('/sqs/queues/purge', { method: 'POST', body: JSON.stringify({ url }) });
export const deleteMessage = (url: string, receiptHandle: string) =>
  request('/sqs/queues/messages', { method: 'DELETE', body: JSON.stringify({ url, receiptHandle }) });

// SNS
export const getTopics = () => request('/sns/topics');
export const getSubscriptions = () => request('/sns/subscriptions');
export const publishMessage = (arn: string, message: string, subject?: string) =>
  request('/sns/topics/publish', { method: 'POST', body: JSON.stringify({ arn, message, subject }) });

// RDS
export const getRdsInstances = () => request('/rds/instances');
export const getRdsClusters = () => request('/rds/clusters');
export const startRdsInstance = (id: string) => request(`/rds/instances/${id}/start`, { method: 'POST' });
export const stopRdsInstance = (id: string) => request(`/rds/instances/${id}/stop`, { method: 'POST' });

// Lambda
export const getLambdaFunctions = () => request('/lambda/functions');
export const getLambdaFunction = (name: string) => request(`/lambda/functions/${name}`);
export const getLambdaEventSources = (name: string) => request(`/lambda/functions/${name}/event-sources`);
export const invokeLambda = (name: string, payload: any) =>
  request(`/lambda/functions/${name}/invoke`, { method: 'POST', body: JSON.stringify({ payload }) });

export const getHealth = () => request('/health');

