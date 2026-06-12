Monorepos allow you to manage multiple projects in a single directory. They are a great way to organize your projects and make them easier to work with.

Get started with monorepos on Vercel in a few minutes by using one of our monorepo quickstart templates.

1.   Go to the [Vercel Dashboard](https://vercel.com/d?to=%2Fdashboard&title=Open+Dashboard) and ensure your team is selected from the team switcher.
2.   Select the Add New… button, and then choose Project from the list. You'll create a new [project](https://vercel.com/docs/projects/overview) for each directory in your monorepo that you wish to import.
3.   From the Import Git Repository section, select the Import button next to the repository you want to import.
4.   Before you deploy, you'll need to specify the directory within your monorepo that you want to deploy. Click the Edit button next to the [Root Directory setting](https://vercel.com/docs/deployments/configure-a-build#root-directory) to select the directory, or project, you want to deploy. This will configure the root directory of each project to its relevant directory in the repository:

![Image 1: Selecting a Root Directory for one of your new Projects.](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fmonorepo-import-light.png&w=1080&q=75)![Image 2: Selecting a Root Directory for one of your new Projects.](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fmonorepo-import-dark.png&w=1080&q=75)

Selecting a Root Directory for one of your new Projects.

1.   Configure any necessary settings and click the Deploy button to deploy that project.
2.   Repeat steps 2-5 to [import each directory](https://vercel.com/docs/git#deploying-a-git-repository) from your monorepo that you want to deploy.

Once you've created a separate project for each of the directories within your Git repository, every commit will issue a deployment for all connected projects and display the resulting URLs on your pull requests and commits:

![Image 3: An example of Deployment URLs provided for a Deployment through Git.](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fgithub-comment-light.png&w=1920&q=75)![Image 4: An example of Deployment URLs provided for a Deployment through Git.](https://vercel.com/vc-ap-vercel-docs/_next/image?url=https%3A%2F%2F7nyt0uhk7sse4zvn.public.blob.vercel-storage.com%2Fdocs-assets%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Fgithub-comment-dark.png&w=1920&q=75)

An example of Deployment URLs provided for a Deployment through Git.

The number of Vercel Projects connected with the same Git repository is [limited depending on your plan](https://vercel.com/docs/limits#general-limits).

1.   Ensure you're in the root directory of your monorepo. Vercel CLI should not be invoked from the subdirectory.
2.   Run `vercel link` to link multiple Vercel projects at once. To learn more, see the [CLI documentation](https://vercel.com/docs/cli/link#repo-alpha): 
3.   Once linked, subsequent commands such as `vercel dev` will use the selected Vercel Project. To switch to a different Project in the same monorepo, run `vercel link` again and select the new Project.

Alternatively, you can use `git clone` to create multiple copies of your monorepo in different directories and link each one to a different Vercel Project.

See this [example](https://github.com/vercel-support/yarn-ws-monorepo) of a monorepo with Yarn Workspaces.

By default, pushing a commit to your monorepo will create a deployment for each of the connected Vercel projects. However, you can choose to:

*   [Skip unaffected projects](https://vercel.com/docs/monorepos#skipping-unaffected-projects) by only building projects whose files have changed.
*   [Ignore the build step](https://vercel.com/docs/monorepos#ignoring-the-build-step) for projects whose files haven't changed.

Vercel considers a project in a monorepo changed if any of the following conditions are true:

1.   The project source code has changed
2.   Any of the project's internal dependencies have changed.
3.   A change to a package manager lockfile has occurred, that _only_ impacts the dependencies of the project.

Vercel automatically skips builds for projects in a monorepo that are unchanged by the commit.

This setting does not occupy [concurrent build slots](https://vercel.com/docs/deployments/concurrent-builds), unlike the [Ignored Build Step](https://vercel.com/docs/project-configuration/project-settings#ignored-build-step) feature, reducing build queue times.

*   This feature is only available for projects connected to GitHub repositories.
*   The monorepo must be using npm, yarn, pnpm, or Bun workspaces, following JavaScript ecosystem conventions. Packages in the workspace must be included in the workspace definition (`workspaces` key in `package.json` for npm and yarn or `pnpm-workspace.yaml` for pnpm). 
    *   Changes that are not a part of the workspace definition will be considered global changes and deploy all applications in the repository.
    *   We automatically detect your package manager using the lockfile at the repository root. You can also explicitly set a package manager with the `packageManager` field in root `package.json` file.

*   All packages within the workspace must have a unique`name` field in their `package.json` file.
*   Dependencies between packages in the monorepo must be explicitly stated in each package's `package.json` file. This is necessary to determine the dependency graph between packages. 
    *   For example, an end-to-end tests package (`package-e2e`) tests must depend on the package it tests (`package-core`) in the `package.json` of `package-e2e`.

To disable this behavior, [visit the project's Root Directory settings](https://vercel.com/d?to=%2F%5Bteam%5D%2F%5Bproject%5D%2Fsettings%2Fbuild-and-deployment%23root-directory&title=Disable+unaffected+project+skipping).

1.   From the [Dashboard](https://vercel.com/d?to=%2Fdashboard&title=Open+Dashboard), select the project you want to configure and open Settings in the sidebar.
2.   Go to the Build and Deployment page of the project's Settings.
3.   Scroll down to Root Directory
4.   Toggle the Skip deployment switch to Disabled.
5.   Click Save to apply the changes.

If you want to cancel the Build Step for projects if their files didn't change, you can do so with the [Ignored Build Step](https://vercel.com/docs/project-configuration/project-settings#ignored-build-step) project setting. Canceled builds initiated using the ignore build step do count towards your deployment and concurrent build limits and so [skipping unaffected projects](https://vercel.com/docs/monorepos#skipping-unaffected-projects) may be a better option for monorepos with many projects.

If you have created a script to ignore the build step, you can skip the [the script](https://vercel.com/kb/guide/how-do-i-use-the-ignored-build-step-field-on-vercel) when redeploying or promoting your app to production. This can be done through the dashboard when you click on the Redeploy button, and unchecking the Use project's Ignore Build Step checkbox.

When working in a monorepo with multiple applications (such as a frontend and a backend), it can be challenging to manage the connection strings between environments to ensure a seamless experience. Traditionally, referencing one project from another requires manually setting URLs or environment variables for each deployment, in _every_ environment.

With Related Projects, this process is streamlined, enabling teams to:

*   Verify changes in pre-production environments without manually updating URLs or environment variables.
*   Eliminate misconfigurations when referencing internal services across multiple deployments, and environments.

For example, if your monorepo contains:

1.   A frontend project that fetches data from an API
2.   A backend API project that serves the data

Related Projects can ensure that each preview deployment of the frontend automatically references the corresponding preview deployment of the backend, avoiding the need for hardcoded environment variables when testing changes that span both projects.

*   A maximum of 3 projects can be linked together
*   Only supports projects within the same repository
*   CLI deployments are not supported

1.   Specify the projects your app needs to reference in a `vercel.json` configuration file at the root of the app. While every app in your monorepo can list related projects in their own `vercel.json`, you can only specify up to three related projects per app.

This will make the preview, and production hosts of `prj_123` available as an environment variable in the deployment of the `frontend` project.

You can [find your project ID](https://vercel.com/d?to=%2F%5Bteam%5D%2F%5Bproject%5D%2Fsettings%23project-id&title=Find+your+Vercel+project+ID) in the project Settings page in the Vercel dashboard. 
2.   The next deployment will have the `VERCEL_RELATED_PROJECTS` environment variable set containing the urls of the related projects for use.

To access this information, you can use the [`@vercel/related-projects`](https://github.com/vercel/vercel/tree/main/packages/related-projects) npm package:

    1.   Easily reference hosts of related projects

    1.   Retrieve just the related project data: