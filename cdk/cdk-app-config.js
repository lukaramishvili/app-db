export default {
    /** use this unique name to:
     * avoid resource name conflicts between multiple app deployments on the same AWS account
     */
    appName: 'AppDb',
};

/** build a project- and stage-specific AWS resource name */
export const awsResourceName = (appName, stage, resourceName) => `${appName}-${stage}-${resourceName}`;
