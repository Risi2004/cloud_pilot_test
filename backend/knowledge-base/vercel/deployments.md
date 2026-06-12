A deployment on Vercel is the result of a successful build of your project. Each time you deploy, Vercel generates a unique URL so you and your team can preview changes in a live [environment](https://vercel.com/docs/deployments/environments).

Vercel supports multiple ways to create a deployment:

*   [Git](https://vercel.com/docs/deployments#git)
*   [Vercel Drop](https://vercel.com/docs/deployments#vercel-drop)
*   [Vercel CLI](https://vercel.com/docs/deployments#vercel-cli)
*   [Deploy Hooks](https://vercel.com/docs/deployments#deploy-hooks)
*   [Vercel REST API](https://vercel.com/docs/deployments#vercel-rest-api)

The most common way to create a deployment is by pushing code to a connected [Git repository](https://vercel.com/docs/git). When you [import a Git repository to Vercel](https://vercel.com/docs/git#deploying-a-git-repository), each commit or pull request (on supported Git providers) automatically triggers a new deployment.

Vercel supports the following providers:

You can also [create deployments from a Git reference](https://vercel.com/docs/git#creating-a-deployment-from-a-git-reference) using the Vercel Dashboard if you need to deploy specific commits or branches manually.

[Vercel Drop](https://vercel.com/docs/drop) lets you deploy a file or folder by dragging it into your browser. You don't need Git, the CLI, or any local setup.

1.   Go to [vercel.com/drop](https://vercel.com/drop).
2.   Drag a project folder onto the page.
3.   Choose a team and project name, then select Deploy.

Vercel detects your framework and builds it, or deploys your files as-is when there's no framework. Vercel Drop is useful for static sites, build output, and prototypes. For the full walkthrough, see [Deploying with Vercel Drop](https://vercel.com/docs/drop).

You can deploy your Projects directly from the command line using [Vercel CLI](https://vercel.com/docs/cli). This method works whether your project is connected to Git or not.

1.   Install Vercel CLI:

1.   Initial Deployment:

In your project's root directory, run:

This links your local directory to your Vercel Project and creates a [Production Deployment](https://vercel.com/docs/deployments/environments#production-environment). A `.vercel` directory is added to store Project and Organization IDs.

Vercel CLI can also integrate with custom CI/CD workflows or third-party pipelines. Learn more about the different [environments on Vercel](https://vercel.com/docs/deployments/environments).

[Deploy Hooks](https://vercel.com/docs/deploy-hooks) let you trigger deployments with a unique URL. You must have a connected Git repository to use this feature, but the deployment doesn't require a new commit.

1.   From your Project settings, create a Deploy Hook
2.   Vercel generates a unique URL for each Project
3.   Make an HTTP `GET` or `POST` request to this URL to trigger the deployment

Refer to the [Deploy Hooks documentation](https://vercel.com/docs/deploy-hooks) for more information.

The [Vercel REST API](https://vercel.com/docs/rest-api) lets you create deployments by making an HTTP `POST` request to the deployment endpoint. In this workflow:

1.   Generate a SHA for each file you want to deploy
2.   Upload those files to Vercel
3.   Send a request to create a new deployment with those file references

This method is especially useful for custom workflows, multi-tenant applications, or integrating with third-party services not officially supported by Vercel. For more details, see the [API reference](https://vercel.com/docs/rest-api/reference/endpoints/deployments/create-a-new-deployment) and [How do I generate an SHA for uploading a file](https://vercel.com/kb/guide/how-do-i-generate-an-sha-for-uploading-a-file-to-the-vercel-api).

Vercel provides three default environments: Local, Preview, and Production.

1.   Local Development: developing and testing code changes on your local machine
2.   Preview: deploying for further testing, QA, or collaboration without impacting your live site
3.   Production: deploying the final changes to your user-facing site with the production domain

Learn more about [environments](https://vercel.com/docs/deployments/environments).

Vercel’s dashboard provides a centralized way to view, manage, and gain insights into your deployments.

When you select a deployment from your Project → Deployments page, you can Open Resources in the sidebar to view and search:

*   Middleware: Any configured [matchers](https://vercel.com/docs/routing-middleware/api#match-paths-based-on-custom-matcher-config).
*   Static Assets: Files (HTML, CSS, JS) and their sizes.
*   Functions: The type, runtime, size, and regions.

You can use the three dot (…) menu for a given function to jump to that function in Logs, Analytics, Speed Insights, or the Observability section in the sidebar.

![Image 1: Example of a deployment resources page with a search applied.](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fdeployments%2Fdeployment-resources-page-light.png&w=3840&q=75)![Image 2: Example of a deployment resources page with a search applied.](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fdeployments%2Fdeployment-resources-page-dark.png&w=3840&q=75)

Example of a deployment resources page with a search applied.

You can also see a summary of these resources by expanding the Deployment Summary section on a Deployment Details page. To visit the Deployment Details page for a deployment, select it from your Project → Deployments page.

![Image 3: Example of an open deployment summary.](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fdeployments%2Fdeploy-outputs-light.png&w=3840&q=75)![Image 4: Example of an open deployment summary.](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fdeployments%2Fdeploy-outputs-dark.png&w=3840&q=75)

Example of an open deployment summary.

You’ll also see your build time, detected framework, and any relevant logs or errors.

On your Project Overview page, you can see the latest production deployment, including the generated URL and commit details, and deployment logs for debugging.

From the Deployments section in the sidebar, you can:

*   Redeploy: Re-run the build for a specific commit or configuration.
*   Inspect: View logs and build outputs.
*   Assign a Custom Domain: Point custom domains to any deployment.
*   Promote to Production: Convert a preview deployment to production (if needed).

For more information on interacting with your deployments, see [Managing Deployments](https://vercel.com/docs/deployments/managing-deployments).

For step-by-step workflows using the Vercel CLI to manage deployments, see: