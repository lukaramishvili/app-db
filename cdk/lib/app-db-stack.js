import cdk from '@aws-cdk/core';
import * as s3 from'@aws-cdk/aws-s3';

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

    new s3.Bucket(this, 'FileStorageBucket', {
      versioned: true,
      // uncomment for auto-deleting the bucket after redeployment  
      // removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects: true,// otherwise S3 won't delete non-empty buckets
    });
  }
}

//module.exports = { AppDbStack }