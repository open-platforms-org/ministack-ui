import express, { Request, Response } from 'express';
import { Readable } from 'stream';
import cors from 'cors';
import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
  ScanCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  SQSClient,
  ListQueuesCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  PurgeQueueCommand,
  SendMessageCommand,
} from '@aws-sdk/client-sqs';
import {
  SNSClient,
  ListTopicsCommand,
  GetTopicAttributesCommand,
  ListSubscriptionsCommand,
  PublishCommand,
  DeleteTopicCommand,
} from '@aws-sdk/client-sns';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBClustersCommand,
  StartDBInstanceCommand,
  StopDBInstanceCommand,
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  ListFunctionsCommand,
  GetFunctionCommand,
  InvokeCommand,
  ListEventSourceMappingsCommand,
} from '@aws-sdk/client-lambda';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const ENDPOINT = process.env.MINISTACK_ENDPOINT || 'http://localhost:4566';
const REGION = process.env.AWS_REGION || 'us-east-1';
const PUBLIC_MINISTACK_URL = process.env.PUBLIC_MINISTACK_URL || 'http://localhost:4566';

const awsConfig = {
  endpoint: ENDPOINT,
  region: REGION,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
  forcePathStyle: true,
};

const dynamoClient = new DynamoDBClient(awsConfig);
const s3Client = new S3Client(awsConfig);
const sqsClient = new SQSClient(awsConfig);
const snsClient = new SNSClient(awsConfig);
const rdsClient = new RDSClient(awsConfig);
const lambdaClient = new LambdaClient(awsConfig);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', endpoint: ENDPOINT });
});

// ─── DynamoDB ─────────────────────────────────────────────────────────────────
app.get('/api/dynamodb/tables', async (_req: Request, res: Response) => {
  try {
    const data = await dynamoClient.send(new ListTablesCommand({}));
    res.json(data.TableNames ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dynamodb/tables/:tableName', async (req: Request, res: Response) => {
  try {
    const data = await dynamoClient.send(
      new DescribeTableCommand({ TableName: req.params.tableName })
    );
    res.json(data.Table);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dynamodb/tables/:tableName/items', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const data = await dynamoClient.send(
      new ScanCommand({ TableName: req.params.tableName, Limit: limit })
    );
    res.json({ items: data.Items ?? [], count: data.Count, scannedCount: data.ScannedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/dynamodb/tables/:tableName/items', async (req: Request, res: Response) => {
  try {
    await dynamoClient.send(
      new DeleteItemCommand({ TableName: req.params.tableName, Key: req.body.key })
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── S3 ───────────────────────────────────────────────────────────────────────
app.get('/api/s3/buckets', async (_req: Request, res: Response) => {
  try {
    const data = await s3Client.send(new ListBucketsCommand({}));
    res.json(data.Buckets ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/s3/buckets/:bucketName/objects', async (req: Request, res: Response) => {
  try {
    const data = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: req.params.bucketName,
        Prefix: (req.query.prefix as string) || undefined,
        MaxKeys: req.query.limit ? Number(req.query.limit) : 100,
      })
    );
    res.json({ objects: data.Contents ?? [], count: data.KeyCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/s3/buckets/:bucketName/objects/presign', async (req: Request, res: Response) => {
  try {
    const rawKey = req.query.key as string | undefined;
    if (!rawKey) return res.status(400).json({ error: 'missing query parameter: key' });

    const key = decodeURIComponent(rawKey);
    const filename = req.query.filename as string | undefined;

    const params: any = { Bucket: req.params.bucketName, Key: key };
    if (filename) {
      params.ResponseContentDisposition = `attachment; filename="${filename}"`;
    }

    let url = await getSignedUrl(
      s3Client,
      new GetObjectCommand(params),
      { expiresIn: 3600 }
    );

    try {
      const internalOrigin = new URL(ENDPOINT).origin;
      const publicOrigin = new URL(PUBLIC_MINISTACK_URL).origin;
      if (internalOrigin !== publicOrigin) {
        url = url.replace(internalOrigin, publicOrigin);
      }
    } catch (e) {
      // ignore URL parsing errors and return the generated url
    }

    res.json({ url });
  } catch (err: any) {
    console.error('Error generating presigned URL (presign endpoint)', err);
    res.status(500).json({ error: err.message || 'failed to generate presigned url' });
  }
});

app.get('/api/s3/buckets/:bucketName/objects/download', async (req: Request, res: Response) => {
  try {
    const rawKey = req.query.key as string | undefined;
    if (!rawKey) return res.status(400).json({ error: 'missing query parameter: key' });

    const key = decodeURIComponent(rawKey);

    const filename = req.query.filename as string | undefined;
    const redirect = (req.query.redirect as string | undefined) === 'true';

    const params: any = { Bucket: req.params.bucketName, Key: key };
    if (filename) {
      params.ResponseContentDisposition = `attachment; filename="${filename}"`;
    }

    if (redirect) {
      const url = await getSignedUrl(
        s3Client,
        new GetObjectCommand(params),
        { expiresIn: 3600 }
      );

      return res.redirect(url);
    }

    const data = await s3Client.send(new GetObjectCommand(params));
    const body = data.Body as any;

    if (data.ContentType) res.setHeader('Content-Type', data.ContentType);
    if (data.ContentLength) res.setHeader('Content-Length', String(data.ContentLength));
    const disposition = filename ? `attachment; filename="${filename}"` : data.ContentDisposition;
    if (disposition) res.setHeader('Content-Disposition', disposition);

    if (body && typeof body.pipe === 'function') {
      return body.pipe(res);
    }

    if (body && typeof body[Symbol.asyncIterator] === 'function') {
      for await (const chunk of body) {
        res.write(Buffer.from(chunk));
      }
      return res.end();
    }

    let fallbackUrl = await getSignedUrl(s3Client, new GetObjectCommand(params), { expiresIn: 3600 });
    try {
      const internalOrigin = new URL(ENDPOINT).origin;
      const publicOrigin = new URL(PUBLIC_MINISTACK_URL).origin;
      if (internalOrigin !== publicOrigin) {
        fallbackUrl = fallbackUrl.replace(internalOrigin, publicOrigin);
      }
    } catch (e) {}
    res.json({ url: fallbackUrl });
  } catch (err: any) {
    console.error('Error generating presigned URL', err);
    res.status(500).json({ error: err.message || 'failed to generate presigned url' });
  }
});

app.delete('/api/s3/buckets/:bucketName/objects', async (req: Request, res: Response) => {
  try {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: req.params.bucketName, Key: req.body.key })
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SQS ──────────────────────────────────────────────────────────────────────
app.get('/api/sqs/queues', async (_req: Request, res: Response) => {
  try {
    const data = await sqsClient.send(new ListQueuesCommand({ MaxResults: 100 }));
    const urls = data.QueueUrls ?? [];
    const queues = await Promise.all(
      urls.map(async (url) => {
        const attrs = await sqsClient.send(new GetQueueAttributesCommand({
          QueueUrl: url,
          AttributeNames: ['All'],
        }));
        return { url, name: url.split('/').pop(), attributes: attrs.Attributes };
      })
    );
    res.json(queues);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sqs/queues/messages', async (req: Request, res: Response) => {
  try {
    const url = req.query.url as string;
    const data = await sqsClient.send(new ReceiveMessageCommand({
      QueueUrl: url,
      MaxNumberOfMessages: 10,
      VisibilityTimeout: 0,
      WaitTimeSeconds: 0,
      MessageAttributeNames: ['All'],
    }));
    res.json(data.Messages ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sqs/queues/send', async (req: Request, res: Response) => {
  try {
    const { url, body } = req.body;
    await sqsClient.send(new SendMessageCommand({ QueueUrl: url, MessageBody: body }));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sqs/queues/purge', async (req: Request, res: Response) => {
  try {
    await sqsClient.send(new PurgeQueueCommand({ QueueUrl: req.body.url }));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sqs/queues/messages', async (req: Request, res: Response) => {
  try {
    const { url, receiptHandle } = req.body;
    await sqsClient.send(new DeleteMessageCommand({ QueueUrl: url, ReceiptHandle: receiptHandle }));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SNS ──────────────────────────────────────────────────────────────────────
app.get('/api/sns/topics', async (_req: Request, res: Response) => {
  try {
    const data = await snsClient.send(new ListTopicsCommand({}));
    const arns = data.Topics ?? [];
    const topics = await Promise.all(
      arns.map(async ({ TopicArn }) => {
        const attrs = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: TopicArn! }));
        return { arn: TopicArn, name: TopicArn!.split(':').pop(), attributes: attrs.Attributes };
      })
    );
    res.json(topics);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sns/subscriptions', async (_req: Request, res: Response) => {
  try {
    const data = await snsClient.send(new ListSubscriptionsCommand({}));
    res.json(data.Subscriptions ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sns/topics/publish', async (req: Request, res: Response) => {
  try {
    const { arn, message, subject } = req.body;
    const result = await snsClient.send(new PublishCommand({ TopicArn: arn, Message: message, Subject: subject }));
    res.json({ messageId: result.MessageId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── RDS ──────────────────────────────────────────────────────────────────────
app.get('/api/rds/instances', async (_req: Request, res: Response) => {
  try {
    const data = await rdsClient.send(new DescribeDBInstancesCommand({}));
    res.json(data.DBInstances ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rds/clusters', async (_req: Request, res: Response) => {
  try {
    const data = await rdsClient.send(new DescribeDBClustersCommand({}));
    res.json(data.DBClusters ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rds/instances/:id/start', async (req: Request, res: Response) => {
  try {
    await rdsClient.send(new StartDBInstanceCommand({ DBInstanceIdentifier: req.params.id }));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rds/instances/:id/stop', async (req: Request, res: Response) => {
  try {
    await rdsClient.send(new StopDBInstanceCommand({ DBInstanceIdentifier: req.params.id }));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Lambda ───────────────────────────────────────────────────────────────────
app.get('/api/lambda/functions', async (_req: Request, res: Response) => {
  try {
    const data = await lambdaClient.send(new ListFunctionsCommand({}));
    res.json(data.Functions ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lambda/functions/:name', async (req: Request, res: Response) => {
  try {
    const data = await lambdaClient.send(new GetFunctionCommand({ FunctionName: req.params.name }));
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lambda/functions/:name/event-sources', async (req: Request, res: Response) => {
  try {
    const data = await lambdaClient.send(new ListEventSourceMappingsCommand({ FunctionName: req.params.name }));
    res.json(data.EventSourceMappings ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lambda/functions/:name/invoke', async (req: Request, res: Response) => {
  try {
    const payload = req.body.payload ? JSON.stringify(req.body.payload) : '{}';
    const result = await lambdaClient.send(new InvokeCommand({
      FunctionName: req.params.name,
      Payload: Buffer.from(payload),
      LogType: 'Tail',
    }));
    const responsePayload = result.Payload ? Buffer.from(result.Payload).toString() : null;
    const logs = result.LogResult ? Buffer.from(result.LogResult, 'base64').toString() : null;
    res.json({ statusCode: result.StatusCode, payload: responsePayload, logs, functionError: result.FunctionError });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✓ MiniStack UI Backend rodando em http://localhost:${PORT}`);
  console.log(`✓ Conectado ao MiniStack em ${ENDPOINT}`);
});

