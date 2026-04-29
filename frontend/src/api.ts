import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// DynamoDB
export const getTables = () => api.get<string[]>('/dynamodb/tables').then(r => r.data);
export const getTableDetails = (name: string) => api.get(`/dynamodb/tables/${name}`).then(r => r.data);
export const getTableItems = (name: string, limit = 50) =>
  api.get(`/dynamodb/tables/${name}/items?limit=${limit}`).then(r => r.data);
export const deleteTableItem = (tableName: string, key: Record<string, unknown>) =>
  api.delete(`/dynamodb/tables/${tableName}/items`, { data: { key } }).then(r => r.data);

// S3
export const getBuckets = () => api.get('/s3/buckets').then(r => r.data);
export const getBucketObjects = (bucket: string, prefix = '') =>
  api.get(`/s3/buckets/${bucket}/objects?prefix=${prefix}`).then(r => r.data);
export const getDownloadUrl = (bucket: string, key: string) =>
  api.get(`/s3/buckets/${bucket}/objects/download?key=${encodeURIComponent(key)}`).then(r => r.data.url);
export const deleteObject = (bucket: string, key: string) =>
  api.delete(`/s3/buckets/${bucket}/objects`, { data: { key } }).then(r => r.data);

// SQS
export const getQueues = () => api.get('/sqs/queues').then(r => r.data);
export const getQueueMessages = (url: string) =>
  api.get(`/sqs/queues/messages?url=${encodeURIComponent(url)}`).then(r => r.data);
export const sendMessage = (url: string, body: string) =>
  api.post('/sqs/queues/send', { url, body }).then(r => r.data);
export const purgeQueue = (url: string) =>
  api.post('/sqs/queues/purge', { url }).then(r => r.data);
export const deleteMessage = (url: string, receiptHandle: string) =>
  api.delete('/sqs/queues/messages', { data: { url, receiptHandle } }).then(r => r.data);

// SNS
export const getTopics = () => api.get('/sns/topics').then(r => r.data);
export const getSubscriptions = () => api.get('/sns/subscriptions').then(r => r.data);
export const publishMessage = (arn: string, message: string, subject?: string) =>
  api.post('/sns/topics/publish', { arn, message, subject }).then(r => r.data);

// RDS
export const getRdsInstances = () => api.get('/rds/instances').then(r => r.data);
export const getRdsClusters = () => api.get('/rds/clusters').then(r => r.data);
export const startRdsInstance = (id: string) => api.post(`/rds/instances/${id}/start`).then(r => r.data);
export const stopRdsInstance = (id: string) => api.post(`/rds/instances/${id}/stop`).then(r => r.data);

// Lambda
export const getLambdaFunctions = () => api.get('/lambda/functions').then(r => r.data);
export const getLambdaFunction = (name: string) => api.get(`/lambda/functions/${name}`).then(r => r.data);
export const getLambdaEventSources = (name: string) => api.get(`/lambda/functions/${name}/event-sources`).then(r => r.data);
export const invokeLambda = (name: string, payload: any) =>
  api.post(`/lambda/functions/${name}/invoke`, { payload }).then(r => r.data);

export const getHealth = () => api.get('/health').then(r => r.data);

