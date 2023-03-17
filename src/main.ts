import { NestFactory } from '@nestjs/core';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as awsSDK from 'aws-sdk';
import { AppModule } from './app.module';
import { queueManager } from './queue-manager/queue-manager';
import { ValidationPipe } from '@nestjs/common'; // import built-in ValidationPipe

async function bootstrap() {
  const port = process.env.PORT || 3000;
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  await startUpScript();
  const config = new DocumentBuilder()
    .setTitle('ServiceBuddy API')
    .setDescription('ServiceBuddy API description')
    .setVersion('1.0')
    .addBearerAuth()
    .addSecurityRequirements('bearer')
    .addTag('dev')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
  await app.listen(port);
}

async function startUpScript() {
  await registerAllQueues();
  await createHTMLTemplateInAWSForCustomVerification();

  console.log('Script Executed');
}

async function createHTMLTemplateInAWSForCustomVerification() {
  awsSDK.config.update({ region: process.env.AWS_REGION });

  const ses = new awsSDK.SES();

  try {
    const templateName = process.env.VERIFICATION_EMAIL_TEMPLATE;

    const getEmailTemplate = await ses
      .listCustomVerificationEmailTemplates()
      .promise();

    const allTemplates: any = getEmailTemplate.$response.data;
    console.log(allTemplates);
    let doesTemplateExist = false;
    if (
      allTemplates &&
      allTemplates.CustomVerificationEmailTemplates &&
      allTemplates.CustomVerificationEmailTemplates.length > 0
    ) {
      const findItem = allTemplates.CustomVerificationEmailTemplates.find(
        (elem) => elem[`TemplateName`] === templateName,
      );
      if (findItem) {
        doesTemplateExist = true;
      }
    }

    if (!doesTemplateExist) {
      const createEmailTemplate = await ses
        .createCustomVerificationEmailTemplate({
          TemplateName: 'custom-email-verification-template-servicebuddy',
          FromEmailAddress: 'no-reply@servicebuddy.io',
          TemplateSubject: 'Custom Email Verification from ServiceBuddy',
          SuccessRedirectionURL: 'https://app.servicebuddy.io',
          FailureRedirectionURL: 'https://app.servicebuddy.io',
          TemplateContent: `<p>This is custom verification email for ServiceBuddy.io. <br />Please click the link below.<br /></p>`,
        })
        .promise();
      console.log('email template created');
    } else {
      console.log('template already exists');
    }
  } catch (err) {
    console.log(err);
  }
}

async function registerAllQueues() {
  awsSDK.config.update({ region: process.env.AWS_REGION });
  const sqs = new awsSDK.SQS();

  const allQueues = [];
  const isQueueFifo = [];
  Object.keys(queueManager).forEach((elem) => {
    Object.keys(queueManager[elem]).forEach((child_elem) => {
      allQueues.push(queueManager[elem][child_elem][`queueName`]);
      isQueueFifo.push(queueManager[elem][child_elem][`isFifo`]);
    });
  });

  const listAllQueues = await sqs.listQueues().promise();
  const listAllQueueNames =
    listAllQueues &&
    listAllQueues.QueueUrls &&
    listAllQueues.QueueUrls.length > 0
      ? listAllQueues.QueueUrls.map(
          (elem) => elem.split('/')[elem.split('/').length - 1],
        )
      : [];
  for (let i = 0; i < allQueues.length; i++) {
    const currentEnv = process.env.APP_ENV;
    let queueName = `${allQueues[i]}`;
    const isFifo = isQueueFifo[i];
    if (isFifo) {
      const replacedName = queueName.replace('.fifo', '');
      queueName = `${replacedName}_${currentEnv}.fifo`;
    } else {
      queueName = `${queueName}_${currentEnv}`;
    }

    if (listAllQueueNames.includes(queueName)) {
      console.log(`${queueName}: queue already exists`);
    } else {
      let attr: any = {
        MessageRetentionPeriod: '86400',
      };
      if (isFifo) {
        attr = {
          ...attr,
          FifoQueue: 'true',
        };
      }
      const createQueue = await sqs
        .createQueue({
          QueueName: queueName,

          Attributes: attr,
        })
        .promise();
      console.log('queue created');
    }
  }
  console.log('ALL QUEUES CREATED');
}
bootstrap();
