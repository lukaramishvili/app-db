
const env = varName => process.env[varName];

const config = {
  /** use this unique name to:
   * avoid resource name conflicts between multiple app deployments on the same AWS account
   */
  appName: 'app-db',
  productionStageName: 'prod',
  rootDomainName: 'app-db.org',
  rootDomainHostedZoneId: env('HOSTED_ZONE_ID') || 'Z05567712LDUM8KYGNQNI',
  rootDomainCertificateArn: env('DOMAIN_CERTIFICATE_ARN') || 'arn:aws:acm:eu-central-1:534420866349:certificate/e6bcdd32-3aa9-428a-90ae-7c456eba9f05',
  stage: env('APP_STAGE') || 'dev',
};
export default config;

/** construct a project- and stage-specific AWS resource name */
export const awsResourceName = (appName, stage, resourceName) => `${appName}-${stage}-${resourceName}`;

/** construct a per-stage domain name */
export const stageDomainName = (stage) => stage === config.productionStageName ? config.rootDomainName : `${stage}.${config.rootDomainName}`;
/** api.example.com or e.g. api-staging.example.com */
export const stagePrefixForAPI = (stage) => stage === config.productionStageName ? `api` : `api-${stage}`;

export const stageDomainNameForAPI = (stage) => `${stagePrefixForAPI(stage)}.${config.rootDomainName}`;
