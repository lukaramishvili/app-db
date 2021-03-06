# Welcome to your CDK JavaScript project!

This is a blank project for JavaScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app. The build step is not required when using JavaScript.

# Getting started

 * Hello world guide: https://docs.aws.amazon.com/cdk/latest/guide/hello_world.html
 * Defining AWS resources: https://docs.aws.amazon.com/cdk/latest/guide/resources.html

# Gotchas

 * always use the `awsResourceName` function in 'cdk-app-config' for building conflict-free AWS resource names between multiple deployed apps on the same AWS account.
 * always import .js files with full path (`import ... 'file.js'), `type: "module"` import method in package.json requires it.
 * before the first deployment, run `cdk bootstrap aws://${accountNumber}/${regionName}` if (mostly) your stack contains AWS Assets (this command is necessary to create resources to hold e.g. lambda .zip files needed for deployment).

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

# TODO

 * use a command like `aws cloudformation describe-stacks --profile luka-personal --stack-name app-db-prod-stack | jq '.Stacks[0].Outputs'` to get the stack Outputs and perform additional work like registering webhooks, etc. Currently the Outputs (including API URL) are output by the `cdk deploy ..` command.
 * integrate CloudWatch logs into a service (to get the logs out of AWS automatically), e.g. Slack.
 * unit and integration tests for synthesized stacks
 * from best [practices](https://docs.aws.amazon.com/cdk/latest/guide/best-practices.html): Consider keeping stateful resources (like databases) in a separate stack from stateless resources. You can then turn on termination protection on the stateful stack, and can freely destroy or create multiple copies of the stateless stack without risk of data loss.
 * add metrics and alarms for monitoring usage and business metrics.
 * add [API Gateway v2](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/AWS_ApiGatewayV2.html) support for WebSocket APIs: https://docs.aws.amazon.com/cdk/api/latest/docs/aws-apigatewayv2-readme.html#websocket-api
 * add IAM user groups like dev, tester, etc (only <10 policies (e.g. SQS, S3, Cognito) are allowed per IAM group, so split the groups (<300 per account) to add acesss to >=10 resources, or create an Inline Policy as a quick measure (from https://aws.amazon.com/premiumsupport/knowledge-center/iam-increase-policy-size/)).
