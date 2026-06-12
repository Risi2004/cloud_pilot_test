Environment variables are key-value pairs configured outside your source code so that each value can change depending on the [Environment](https://vercel.com/docs/deployments/environments). These values are encrypted at rest and visible to any user that has access to the [project](https://vercel.com/docs/projects/overview). It is safe to use both non-sensitive and sensitive data, such as tokens.

Your source code can read these values to change behavior during the [Build Step](https://vercel.com/docs/deployments/configure-a-build) or during [Function](https://vercel.com/docs/functions) execution.

Any change you make to environment variables are not applied to previous deployments, they only apply to new deployments.

Environment variables can either be declared at the team or project level. When declared at the team level, they are available to all projects within the team. When declared at the project level, they are only available to that project.

To learn how to create and manage environment variables, see [Managing environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables).

Developers on all plans using the runtimes stated below can use a total of 64 KB in Environments Variables per-Deployment on Vercel. This [limit](https://vercel.com/docs/limits#environment-variables) is for all variables combined, and so no single variable can be larger than 64 KB. The total size includes any variables configured through the dashboard or the [CLI](https://vercel.com/docs/cli).

With support for 64 KB of environment variables, you can add large values for authentication tokens, JWTs, or certificates.

Deployments using the following runtimes can support environment variables up to 64 KB:

*   Node.js
*   Python
*   Ruby
*   Go
*   [PHP Community Runtime](https://github.com/vercel-community/php)

Vercel also provides support for custom runtimes, through the Build Output API. For information on creating custom runtime support, see the following guides:

While Vercel allows environment variables up to a total of 64KB in size, Edge Functions and Middleware using the `edge` runtime are limited to 5KB per Environment Variable.

For each Environment Variable, you can select one or more Environments to apply the Variable to:

| Environment | Description |
| --- | --- |
| [Production](https://vercel.com/docs/deployments/environments#production-environment) | When selected, the Environment Variable will be applied to your next Production Deployment. To create a Production Deployment, push a commit to the [Production Branch](https://vercel.com/docs/git#production-branch) (usually `main`) or run `vercel --prod`. |
| [Preview](https://vercel.com/docs/environment-variables#preview-environment-variables) | The Environment Variable is applied to your next Preview Deployment. Preview Deployments are created when you push to a branch that is not the [Production Branch](https://vercel.com/docs/git#production-branch) or run `vercel`. |
| [Custom environments](https://vercel.com/docs/deployments/environments#custom-environments) | With custom environments you can choose to [import environment variables](https://vercel.com/docs/custom-environments#import-variables-from-another-environment) from another environment and [detach](https://vercel.com/docs/custom-environments#detaching-an-environment-variable) when you need to update the environment variable for your custom environment |
| [Development](https://vercel.com/docs/environment-variables#development-environment-variables) | The Environment Variable is used when running your project locally with `vercel dev` or your preferred development command. To download Development Environment Variables, run [`vercel env pull`](https://vercel.com/docs/cli/env). |

You need Vercel CLI version 22.0.0 or higher to use the features described in this section.

Preview environment variables are applied to deployments from any Git branch that does not match the [Production Branch](https://vercel.com/docs/git#production-branch). When you add a preview environment variable, you can choose to apply to all non-production branches or you can select a specific branch.

![Image 1: Adding an Environment Variable](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fenvironment-variables%2Fenv-var-section-light.png&w=1920&q=75)![Image 2: Adding an Environment Variable](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fenvironment-variables%2Fenv-var-section-dark.png&w=1920&q=75)

Adding an Environment Variable

Any branch-specific variables will override other preview environment variables with the same name. This means you don't need to replicate all your existing preview environment variables for each branch – you only need to add the values you wish to override.

You need Vercel CLI version 21.0.1 or higher to use the features described in this section.

Environment variables for local development are defined in the `.env.local` file. This is a plain text file that contains `key=value` pairs of environment variables, that you can manually create in your project's root directory to define specific variables.

You can use the `vercel env pull` command to automatically create and populate the `.env` file (which serves the same purpose as `.env.local`) with the environment variables from your Vercel project:

vercel env pull
Downloading Development Environment Variables for Project my-lovely-project
✅ Created .env file [510ms]

This command creates a `.env` file in your project's current directory with the environment variables from your Vercel project's Development environment.

If you're using [`vercel dev`](https://vercel.com/docs/cli/dev), there's no need to run `vercel env pull`, as `vercel dev` automatically downloads the Development Environment Variables into memory. For more information on the `vercel env` command, see the [CLI](https://vercel.com/docs/cli/env) docs.

For more information, see [Environment variables for local development](https://vercel.com/docs/deployments/local-env#environment-variables-for-local-development).

[Integrations](https://vercel.com/docs/integrations) can automatically add environment variables to your Project Settings. In that case, the Integration that added the Variable will be displayed in your project settings:

![Image 3: An Environment Variable added by the MongoDB Integration.](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fenvironment-variables%2Fintegration-env-variable-light.png&w=1920&q=75)![Image 4: An Environment Variable added by the MongoDB Integration.](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fenvironment-variables%2Fintegration-env-variable-dark.png&w=1920&q=75)

An Environment Variable added by the MongoDB Integration.