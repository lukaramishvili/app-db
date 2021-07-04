import cdk from '@aws-cdk/core';
import * as s3 from'@aws-cdk/aws-s3';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as cognito from '@aws-cdk/aws-cognito';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as origins from '@aws-cdk/aws-cloudfront-origins';
import * as route53 from '@aws-cdk/aws-route53';
import * as route53Targets from '@aws-cdk/aws-route53-targets';
import * as acm from '@aws-cdk/aws-certificatemanager';
import path from 'path';

import AppConfig, { awsResourceName, stageDomainNameForAPI, stagePrefixForAPI } from '../cdk-app-config.js';

// TODO detect from build environment (duplicated in bin/cdk.js)
const stage = 'prod';

/** build a project- and stage-specific AWS resource name */
const awsName = (resourceName) => awsResourceName(AppConfig.appName, stage, resourceName);

export class AppDbStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here

    const currentStageAPIDomainName = stageDomainNameForAPI(stage);

    const websiteBucket = new s3.Bucket(this, awsName('website-bucket'), {
      versioned: true,
      // uncomment for auto-deleting the bucket after redeployment  
      // removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects: true,// otherwise S3 won't delete non-empty buckets
    });
    const deployment = new s3Deployment.BucketDeployment(
      this,
      awsName('website-bucket-deployment'),
      {
        sources: [s3Deployment.Source.asset(path.resolve('./web'))],
        destinationBucket: websiteBucket,
      }
    );

    const uploadsBucket = new s3.Bucket(this, awsName('uploads-bucket'), {
      versioned: true,
      // uncomment for auto-deleting the bucket after redeployment  
      // removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects: true,// otherwise S3 won't delete non-empty buckets
    });
    // Create a distribution for a S3 bucket. In this case, a CDN for uploads.
    /** docs: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cloudfront-readme.html */
    // can also use ELBv2 (elastic load-balancer) as an origin (see docs).
    // can also use any HTTP endpoint as an origin (see docs).
    // TODO for Domain Names and Certificates, see docs.
    // TODO use this bucket as an event source for post-processing the uploads (by setting the S3 bucket as an event source for a lambda). The uploads can happen with a pre-signed upload URL for this bucket, generated by AWS.
    new cloudfront.Distribution(this, awsName('uploads-dist'), {
      defaultBehavior: { origin: new origins.S3Origin(uploadsBucket) },
    });
    // create a CDN for assets (images, fonts, etc).
    const assetsBucket = new s3.Bucket(this, awsName('assets-bucket'), {
      versioned: true,
    });
    new cloudfront.Distribution(this, awsName('assets-dist'), {
      defaultBehavior: { origin: new origins.S3Origin(assetsBucket) },
    });

    /** docs:
     * https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cognito-readme.html
     * https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-attributes.html
     * https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-cognito.UserPool.html
     */
    const users = new cognito.UserPool(this, awsName('user-pool'), {
      userPoolName: awsName('user-pool'),
      // enable registration
      selfSignUpEnabled: true,
      // enable signing in with either username or email
      signInAliases: {
        username: true,
        email: true
      },
      // from docs: Phone numbers and email addresses only become active aliases for a user after the phone numbers and email addresses are verified. We therefore recommend that you choose automatic verification of email addresses and phone numbers if you use them as aliases.
      autoVerify: { email: true, phone: true },
      // enable user verification
      userVerification: {
        emailSubject: 'Verify your email for our awesome app!',
        emailBody: 'Thanks for signing up to our awesome app! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
        smsMessage: 'Thanks for signing up to our awesome app! Your verification code is {####}',
      },
      // enable admins inviting users
      userInvitation: {
        emailSubject: 'Invite to join our awesome app!',
        emailBody: 'Hello {username}, you have been invited to join our awesome app! Your temporary password is {####}',
        smsMessage: 'Your temporary password for our awesome app is {username} : {####}'
      },
    });

    /** general docs: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-dynamodb-readme.html */
    /** reference for all parameters: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-dynamodb.Table.html */
    /** datomic/datascript-like database */
    const factsTable = new dynamodb.Table(this, awsName('facts-table'), {
      partitionKey: { name: 'entity-id', type: dynamodb.AttributeType.STRING },
      sortKey:      { name: 'attribute', type: dynamodb.AttributeType.STRING },
      // unindexed attribute: `value`
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });
    /** docs: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-dynamodb.GlobalSecondaryIndexProps.html */
    factsTable.addGlobalSecondaryIndex({
      indexName: awsName('tx-id-index'),
      partitionKey: { name: 'entity-id', type: dynamodb.AttributeType.STRING },
      sortKey:  { name: 'tx-id', type: dynamodb.AttributeType.STRING },
    });

    // In reality, a pre-signed bucket upload url will be used. uploads going through a lambda is nonsense with AWS, because of egress fees and execution price concerns.
    // const uploadsLambda = new lambda.Function(this, awsName('upload-file'), {
    //   code: lambda.Code.directory('fn'),
    //   handler: 'fn.uploadFile',
    //   environment: {
    //     UPLOADS_BUCKET_NAME: uploadsBucket.bucketName,
    //     FACTS_TABLE_NAME:    factsTable.tableName,
    //   },
    //   // ...
    // });

    /** event sources (s3, sqs, sns, etc) for lambdas: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-event-sources-readme.html */
    // const queue = new sqs.Queue(this, awsName('MyQueue'));
    // const eventSource = fn.addEventSource(new SqsEventSource(queue));
    // const eventSourceId = eventSource.eventSourceId;
    // process S3 events
    // import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources';
    // lambda.addEventSource(new S3EventSource(bucket, {
    //   events: [ s3.EventType.OBJECT_CREATED, s3.EventType.OBJECT_REMOVED ],
    //   filters: [ { prefix: 'subdir/' } ] // optional
    // }));
    // Using Amazon MSK (Kafka) as an event source for AWS Lambda
    // https://docs.aws.amazon.com/lambda/latest/dg/with-msk.html
    // http://aws.amazon.com/blogs/compute/using-amazon-msk-as-an-event-source-for-aws-lambda/
    // AWS lambda event source mappings: https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html

    /** docs: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html */
    /** can also specify a docker image from which the lambda will run:
     * https://docs.aws.amazon.com/lambda/latest/dg/images-create.html
     * https://docs.aws.amazon.com/cdk/api/latest/docs/aws-lambda-readme.html#docker-images
     */
    const appDbApiLambda = new lambda.Function(this, awsName('app-db-api'), {
      // ES modules can't use __dirname and __filename
      //code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler')),
      code: lambda.Code.fromAsset(path.resolve('./fn')),// relative to project root
      handler: 'app-db.appDbApi',// must export appDbApi from app-db.js
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        UPLOADS_BUCKET_NAME: uploadsBucket.bucketName,
        FACTS_TABLE_NAME:    factsTable.tableName,
        USER_POOL_ARN:       users.userPoolArn,
      },
      // ...
    });
    /** create a "hosted zone" for this domain (needed by API config)
     * since a hosted zone created by CDK will change name servers on every deployment, we have to delegate this hosted zone to an existing hosted zone
     * https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-route53.HostedZone.html#static-fromwbrlookupscope-id-query
     * Gotcha: HostedZone.fromLookup can work but requires explicitly setting region and account ID on the Stack Resource: https://github.com/aws/aws-cdk/issues/5547#issuecomment-569485100
     * Gotcha: HostedZone.fromHostedZoneId/Name doesn't actually get data from AWS, but creates a mock object: https://github.com/aws/aws-cdk/issues/8406#issuecomment-641052225
     * so HostedZone.fromHostedZoneAttributes is the most straightforward way to reference an existing hosted zone.
     */
    // if(!AppConfig.rootDomainHostedZoneId){
    // console.warn('missing required root domain zone id');
    //}
    const rootHostingZone = route53.HostedZone.fromHostedZoneAttributes(this, awsName('parent-hosted-zone'), {
      hostedZoneId: AppConfig.rootDomainHostedZoneId,
      zoneName: AppConfig.rootDomainName,
    });
    // fromLookup requires specifying aws account and region
    // I guess fromLookup is sufficient for zone delegation
    // beware: fromLookup doesn't really "fetch" the zone or its values (ns, etc), just creates a mock object with id and name attributes
    // const rootHostingZone = route53.HostedZone.fromLookup(this, awsName('parent-zone'), {
    //   domainName: AppConfig.rootDomainName
    // });
    // TODO rootHostingZone doesn't seem to actually come from AWS describing resource, so the retrieve method must be changed
    // guide: https://github.com/aws/aws-cdk/issues/8776#issue-647025391
    // undefined for now: console.log(rootHostingZone.nameServers, rootHostingZone.hostedZoneNameServers);
    // const hostedZoneForAPI = new route53.HostedZone(this, awsName('api-hosted-zone'), {
    //   zoneName: currentStageAPIDomainName,
    // });
    // delegate the hosted zone to the parent hosted zone
    // const zoneDelegation = new route53.ZoneDelegationRecord(this, awsName('zone-delegation'), {
    //   zone: rootHostingZone,
    //   // we assume the nameservers are present: https://github.com/aws/aws-cdk/issues/1847#issuecomment-466954662
    //   nameServers: hostedZoneForAPI.hostedZoneNameServers,
    // });
    // retrieve existing validated certificate instead of creating it
    const domainCertificate = acm.Certificate.fromCertificateArn(this, awsName('domain-certificate'), AppConfig.rootDomainCertificateArn);
    // const domainCertificate = new acm.Certificate(this, awsName('api-certificate'), {
    //   domainName: AppConfig.rootDomainName,
    //   validation: acm.CertificateValidation.fromDns(hostedZoneForAPI),
    // });

    /** Api Gateway docs: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-apigateway-readme.html#aws-lambda-backed-apis */
    /** limiting the API with API Keys: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-apigateway-readme.html#usage-plan--api-keys */
    const api = new apigateway.LambdaRestApi(this, awsName('app-db-rest-api'), {
      handler: appDbApiLambda,
      name: awsName('app-db-api'),
      // route API requests from the app domain to this Api Gateway
      // This will define a DomainName resource for you, along with a BasePathMapping from the root of the domain to the deployment stage of the API. This is a common set up.
      domainName: {
        domainName: currentStageAPIDomainName,
        certificate: domainCertificate,
      },
      // we can also specify `proxy: false` and define all the GET/POST/etc routes manually (see the #aws-lambda-backed-apis docs)
    });
    
    /** read this for a guide to using domains: https://gregorypierce.medium.com/cdk-restapi-custom-domains-554175a4b1f6 */
    /** custom domain certificate docs: https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html */
    /** we need to associate the API with the root domain first, otherwise CDK will not publish the template */
    // api.addDomainName(awsName('root-domain-name'), {
    //   domainName: AppConfig.rootDomainName,
    //   certificate: domainCertificate,
    //   // endpointType: apigw.EndpointType.EDGE, // default is REGIONAL
    //   // securityPolicy: apigw.SecurityPolicy.TLS_1_2
    // });
    // define api[-stage].example.com
    // TO UNCOMMENT THIS, comment domainName: {} in api definition above
    // const apiDomain = new apigateway.DomainName(this, awsName('api-domain'), {
    //   domainName: currentStageAPIDomainName,
    //   certificate: domainCertificate,
    //   // endpointType: apigw.EndpointType.EDGE, // default is REGIONAL
    //   // securityPolicy: apigw.SecurityPolicy.TLS_1_2
    // });
    /** add base path mapping (api.example.com/BASE_PATH) */
    // var basePath = props.basePath != undefined? props.basePath : props.name;
    //     basePath = basePath.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
    //     domain.addBasePathMapping( this.api, { basePath: basePath });

    const websiteCnameRecord = new route53.CnameRecord(this, awsName('website-cname-record'), {
      zone: rootHostingZone,
      recordName: stage === AppConfig.productionStageName ? stage : '',
      domainName: websiteBucket.bucketWebsiteDomainName
    });

    /** create a DNS A record for the domain */
    new route53.ARecord(this, awsName('api-domain-alias-record'), {
      zone: rootHostingZone,
      recordName: stagePrefixForAPI(stage),
      target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(api))
    });

  }
}

// not with ES modules (enabled in package.json@type:"module"
//module.exports = { AppDbStack }
