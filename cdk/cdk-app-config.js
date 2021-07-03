
const config = {
  /** use this unique name to:
   * avoid resource name conflicts between multiple app deployments on the same AWS account
   */
  appName: 'app-db',
  productionStageName: 'prod',
  rootDomainName: 'app-db.org',
  rootDomainHostedZoneId: 'Z05567712LDUM8KYGNQNI',
};
export default config;

/** construct a project- and stage-specific AWS resource name */
export const awsResourceName = (appName, stage, resourceName) => `${appName}-${stage}-${resourceName}`;

/** construct a per-stage domain name */
export const stageDomainName = (stage) => stage === config.productionStageName ? config.domainName : `${stage}.${config.rootDomainName}`;
/** api.example.com or e.g. api-staging.example.com */
export const stageDomainNameForAPI = (stage) => `api${stage !== config.productionStageName ? '-' + stage : ''}.${config.rootDomainName}`;
