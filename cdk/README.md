# Welcome to your CDK JavaScript project!

This is a template project for JavaScript development with CDK.

It contains CDK instructions for common use-cases (database, users, CDN, APIs), configured for the `app-db` project. The resources are defined in ./lib/app-db-stack.js

As its next phase, the app-db-stack.js file will be auto-generated from project source code (it's too early for that; now the next milestone is hosting Clojure@GraalVM lambdas).

The `cdk.json` file tells the CDK Toolkit how to execute your app. The build step is not required when using JavaScript.

# Features

 * per-stage deployments, domains (HTTPS) and resources (dev, staging, prod, etc)
 * Datomic-like dynamoDb database
 * API routes bound to domain names
 * uploads to S3
 * CDN for static assets

# Getting started

 * Hello world guide: https://docs.aws.amazon.com/cdk/latest/guide/hello_world.html
 * Defining AWS resources: https://docs.aws.amazon.com/cdk/latest/guide/resources.html
 
# Setting up a new project

 * before the first deployment, run `cdk bootstrap aws://${accountNumber}/${regionName}` if (mostly) your stack contains AWS Assets (this command is necessary to create resources to hold e.g. lambda .zip files needed for deployment).
 * to make use of your own domains, you have to create a hosted zone from AWS Console, point your external DNS to it, and delegate the CDK-created hosted zone to it.
 * create a new wildcard ACM Certificate and reference it using its Arn (so that CDK doesn't create a new certificate during every deployment), by setting the DOMAIN_CERTIFICATE_ARN env var
 * configure `ROOT_DOMAIN_HOSTED_ZONE_ID` env var (needed in lib/app-db-stack.js)
 * configure `DOMAIN_CERTIFICATE_ARN`

# Gotchas

 * always use the `awsResourceName` function (or `awsName` shorthand) in 'cdk-app-config' for building conflict-free AWS resource names between multiple deployed apps on the same AWS account.
 * always import .js files with full path (`import ... 'file.js'), `type: "module"` import method in package.json requires it.

# Deploying

Configure AWS credentials either in:
 * ~/.aws/credentials (useful when only having one profile)
 * via environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_KEY (useful during CI/CD)
 * via AWS CLI profiles (in ~/.aws/config, add [profile-name] and then `cdk deploy --profile profile-name`)
 * download access keys from "My Security Credentials" from AWS Console

## Useful commands

 * `npm run test`         perform the jest unit tests
 * `cdk deploy`           deploy this stack to your default AWS account/region
 * `cdk diff`             compare deployed stack with current state
 * `cdk synth`            emits the synthesized CloudFormation template
 * `cdk destroy`          removes the stack from AWS

# Project TODO

 * add configuration so that static DNS will work on redeployed Rest Api endpoints: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-apigateway-readme.html#custom-domains
 * `cdk deploy ...` will write the Outputs to the file `cdk.out/app-db-prod-stack.template.json`. use that to perform post-deploy operations like updating endpoints, registering webhooks, etc.
 * for that purpose, you can also use a command like `aws cloudformation describe-stacks --profile luka-personal --stack-name app-db-prod-stack | jq '.Stacks[0].Outputs'`
 * integrate CloudWatch logs into a service (to get the logs out of AWS automatically), e.g. Slack.
 * prepare all env variables in CI/CD and throw if they're not provided
 * unit and integration tests for synthesized stacks
 * from best [practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html): Consider keeping stateful resources (like databases) in a separate stack from stateless resources. You can then turn on termination protection on the stateful stack, and can freely destroy or create multiple copies of the stateless stack without risk of data loss.
 * add metrics and alarms for monitoring usage and business metrics.
 * add [API Gateway v2](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/AWS_ApiGatewayV2.html) support for WebSocket APIs: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-apigatewayv2-readme.html#websocket-api
 * add IAM user groups like dev, tester, etc (only <10 policies (e.g. SQS, S3, Cognito) are allowed per IAM group, so split the groups (<300 per account) to add acesss to >=10 resources, or create an Inline Policy as a quick measure (from https://aws.amazon.com/premiumsupport/knowledge-center/iam-increase-policy-size/)).

# Branch TODO

 * get the existing parent zone from AWS
 * fix that right now the API Gateway is created in the parent zone and not the new api[-stage].example.com zone
 * add ARecords for api[-stage].example.com and delegate the NS to parent zone
 + create an existing ACM certificate in AWS Console and add config to reference it using its Arn
 + [wasn't needed] if `HostedZone.fromLookup` turns out to be needed, add the following text to "Setting up a new project" checklist above:
> fow using own domains, configure AWS account ID and region in bin/cdk.js (because, for using own domain, it's required to have an existing hosted zone and delegate to it, because otherwise NS records would change on redeploy, and looking up an existing hosted zone is only possible in specific regions).
