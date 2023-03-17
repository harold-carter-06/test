import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Consumer } from 'sqs-consumer';
import { Producer } from 'sqs-producer';
import {
  Message,
  QueueName,
  SqsConsumerEventHandlerMeta,
  SqsMessageHandlerMeta,
  SqsOptions,
} from './sqs.types';
import { DiscoveryService } from '@nestjs-plus/discovery';
import {
  SQS_CONSUMER_EVENT_HANDLER,
  SQS_CONSUMER_METHOD,
  SQS_OPTIONS,
} from './sqs.constants';
import * as AWS from 'aws-sdk';
import type { QueueAttributeName } from 'aws-sdk/clients/sqs';
import { randomUUID } from 'crypto';

@Injectable()
export class SqsService implements OnModuleInit, OnModuleDestroy {
  public readonly consumers = new Map<QueueName, Consumer>();
  public readonly producers = new Map<QueueName, Producer>();

  private readonly logger = new Logger('SqsService', {
    timestamp: false,
  });

  public constructor(
    @Inject(SQS_OPTIONS) public readonly options: SqsOptions,
    private readonly discover: DiscoveryService,
  ) {}

  public async onModuleInit(): Promise<void> {
    const messageHandlers =
      await this.discover.providerMethodsWithMetaAtKey<SqsMessageHandlerMeta>(
        SQS_CONSUMER_METHOD,
      );
    const eventHandlers =
      await this.discover.providerMethodsWithMetaAtKey<SqsConsumerEventHandlerMeta>(
        SQS_CONSUMER_EVENT_HANDLER,
      );
    this.options.consumers?.forEach((options) => {
      const { name, ...consumerOptions } = options;
      if (this.consumers.has(name)) {
        throw new Error(`Consumer already exists: ${name}`);
      }

      const metadata = messageHandlers.find(({ meta }) => {
        return `${meta.name}` === name;
      });
      if (!metadata) {
        this.logger.warn(`No metadata found for: ${name}`);
      }

      const isBatchHandler = metadata.meta.batch === true;
      const consumer = Consumer.create({
        ...consumerOptions,
        queueUrl: this.getQueueURL(this.getQueueName(name)),
        region: process.env.AWS_REGION,
        ...(isBatchHandler
          ? {
              handleMessageBatch: metadata.discoveredMethod.handler.bind(
                metadata.discoveredMethod.parentClass.instance,
              ),
            }
          : {
              handleMessage: metadata.discoveredMethod.handler.bind(
                metadata.discoveredMethod.parentClass.instance,
              ),
            }),
      });
      const eventsMetadata = eventHandlers.filter(
        ({ meta }) => `${meta.name}` === name,
      );
      for (const eventMetadata of eventsMetadata) {
        if (eventMetadata) {
          consumer.addListener(
            eventMetadata.meta.eventName,
            eventMetadata.discoveredMethod.handler.bind(
              metadata.discoveredMethod.parentClass.instance,
            ),
          );
        }
      }
      this.consumers.set(this.getQueueName(name), consumer);
    });

    this.options.producers?.forEach((options) => {
      const { name, ...producerOptions } = options;
      if (this.producers.has(name)) {
        throw new Error(`Producer already exists: ${name}`);
      }

      const producer = Producer.create({
        ...producerOptions,
        queueUrl: this.getQueueURL(this.getQueueName(name)),
        region: process.env.AWS_REGION,
      });
      this.producers.set(this.getQueueName(name), producer);
    });

    for (const consumer of this.consumers.values()) {
      consumer.start();
    }
  }

  public onModuleDestroy() {
    for (const consumer of this.consumers.values()) {
      consumer.stop();
    }
  }

  private isFifoQueue(name: string) {
    return name.endsWith('.fifo');
  }
  private getQueueName(name: string) {
    const currentEnv = `${process.env.APP_ENV}`;
    let tempQueueName = `${name}`;
    if (tempQueueName.endsWith('.fifo')) {
      tempQueueName = tempQueueName.replace('.fifo', '');
      tempQueueName = `${tempQueueName}_${currentEnv}.fifo`;
    } else {
      tempQueueName = `${tempQueueName}_${currentEnv}`;
    }
    return tempQueueName;
  }
  private getQueueURL(name: string) {
    return `${process.env.QUEUE_URL}/${name}`;
  }

  private getQueueInfo(name: QueueName) {
    const getQueueNameFormatted = this.getQueueName(name);
    if (!this.consumers.has(getQueueNameFormatted)) {
      throw new Error(`Consumer does not exist: ${getQueueNameFormatted}`);
    }
    if (!this.producers.has(getQueueNameFormatted)) {
      throw new Error(`Producer does not exist: ${getQueueNameFormatted}`);
    }
    const queueUrl = this.getQueueURL(getQueueNameFormatted);
    const { sqs } = (this.consumers.get(getQueueNameFormatted) ??
      this.producers.get(getQueueNameFormatted)) as {
      sqs: AWS.SQS;
      queueUrl: string;
    };
    if (!sqs) {
      throw new Error('SQS instance does not exist');
    }

    return {
      sqs,
      queueUrl,
    };
  }

  public async purgeQueue(name: QueueName) {
    const { sqs, queueUrl } = this.getQueueInfo(name);
    return sqs
      .purgeQueue({
        QueueUrl: queueUrl,
      })
      .promise();
  }

  public async getQueueAttributes(name: QueueName) {
    const { sqs, queueUrl } = this.getQueueInfo(name);
    const response = await sqs
      .getQueueAttributes({
        QueueUrl: queueUrl,
        AttributeNames: ['All'],
      })
      .promise();
    return response.Attributes as { [key in QueueAttributeName]: string };
  }

  public getProducerQueueSize(name: QueueName) {
    if (!this.producers.has(name)) {
      throw new Error(`Producer does not exist: ${name}`);
    }

    return this.producers.get(name).queueSize();
  }

  public send<T = any>(name: QueueName, payload: Message<T> | Message<T>[]) {
    const formattedName = this.getQueueName(name);
    if (!this.producers.has(formattedName)) {
      throw new Error(`Producer does not exist: ${formattedName}`);
    }

    const originalMessages = Array.isArray(payload) ? payload : [payload];
    const messages = originalMessages.map((message) => {
      let body = message.body;
      let finalVal = {};
      if (typeof body !== 'string') {
        body = JSON.stringify(body) as any;
      }
      finalVal = {
        ...message,

        body,
      };
      if (this.isFifoQueue(name)) {
        finalVal = {
          ...message,
          body,
          groupId: randomUUID(),
          deduplicationId: randomUUID(),
        };
      }

      return finalVal;
    });

    const producer = this.producers.get(formattedName);
    return producer.send(messages as any[]);
  }
}
