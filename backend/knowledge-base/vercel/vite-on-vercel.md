# Vite on Vercel

Vite is an opinionated build tool that aims to provide a faster and leaner development experience for modern web projects. Vite provides a dev server with rich feature enhancements such as pre-bundling NPM dependencies and hot module replacement, and a build command that bundles your code and outputs optimized static assets for production.

These features make Vite more desirable than out-of-the-box CLIs when building larger projects with frameworks for many developers.

Vite powers popular frameworks like [SvelteKit](https://vercel.com/docs/frameworks/sveltekit) and [Nuxt](https://vercel.com/docs/frameworks/full-stack/nuxt), and is often used in projects built with [Vue](https://vercel.com/kb/guide/deploying-vuejs-to-vercel), [Svelte](https://vercel.com/docs/frameworks/sveltekit), [React](https://vercel.com/docs/frameworks/create-react-app), [Preact](https://vercel.com/kb/guide/deploying-preact-with-vercel), [Nitro](https://vercel.com/docs/frameworks/full-stack/vite-with-nitro), [and more](https://github.com/vitejs/vite/tree/main/packages/create-vite).

To get started with Vite on Vercel:

*   If you already have a project with Vite, install [Vercel CLI](https://vercel.com/docs/cli) and run the `vercel` command from your project's root directory
*   Clone one of our Vite example repos to your favorite git provider and deploy it on Vercel with the button below:

Vercel deployments can [integrate with your git provider](https://vercel.com/docs/git) to [generate preview URLs](https://vercel.com/docs/deployments/environments#preview-environment-pre-production) for each pull request you make to your Vite project.

Vercel provides a set of [System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables) that our platform automatically populates. For example, the `VERCEL_GIT_PROVIDER` variable exposes the Git provider that triggered your project's deployment on Vercel.

These environment variables will be available to your project automatically, and you can enable or disable them in your project settings on Vercel. See [our Environment Variables docs](https://vercel.com/docs/environment-variables) to learn how.

To access Vercel's System Environment Variables in Vite during the build process, prefix the variable name with `VITE`. For example, `VITE_VERCEL_ENV` will return `preview`, `production`, or `development` depending on which environment the app is running in.

The following example demonstrates a Vite config file that sets `VITE_VERCEL_ENV` as a global constant available throughout the app:

If you want to read environment variables from a `.env` file, additional configuration is required. See [the Vite config docs](https://vitejs.dev/config/#using-environment-variables-in-config) to learn more.

To summarize, the benefits of using System Environment Variables with Vite on Vercel include:

*   Access to Vercel deployment information, dynamically or statically, with our preconfigured System Environment Variables
*   Access to automatically-configured environment variables provided by [integrations for your preferred services](https://vercel.com/docs/environment-variables#integration-environment-variables)
*   Searching and filtering environment variables by name and environment in Vercel's dashboard

[Learn more about System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables)

Vercel Functions scale up and down their resource consumption based on traffic demands. This scaling prevents them from failing during peak hours, but keeps them from running up high costs during periods of low activity.

If you're using a framework built on Vite, check that framework's official documentation or [our dedicated framework docs](https://vercel.com/docs/frameworks). Some frameworks built on Vite, such as [SvelteKit](https://vercel.com/docs/frameworks/sveltekit), support Functions natively. We recommend using that framework's method for implementing Functions.

If you're not using a framework or plugin that supports Vercel Functions, you can add Nitro to your Vite project to add a comprehensive backend to your project. Learn more about building [full-stack Vite projects with Nitro](https://vercel.com/docs/frameworks/full-stack/vite-with-nitro#adding-api-routes).

To summarize, Vercel Functions on Vercel:

*   Scales to zero when not in use
*   Scales automatically with traffic increases
*   Support standard [Web APIs](https://developer.mozilla.org/docs/Web/API), such as `URLPattern`, `Response`, and more

[Learn more about Vercel Functions](https://vercel.com/docs/functions)

Server-Side Rendering (SSR) allows you to render pages dynamically on the server. This is useful for pages where the rendered data needs to be unique on every request. For example, checking authentication or looking at the location of an incoming request.

We recommend [using Nitro](https://vercel.com/docs/frameworks/full-stack/vite-with-nitro#server-side-rendering-ssr) to add SSR to your Vite project.

To summarize, SSR with Vite on Vercel:

*   Scales to zero when not in use
*   Scales automatically with traffic increases
*   Has zero-configuration support for [`Cache-Control`](https://vercel.com/docs/cdn-cache) headers, including `stale-while-revalidate`

[Learn more about SSR with Nitro](https://vercel.com/docs/frameworks/full-stack/vite-with-nitro)

If your Vite app is [configured to deploy as a Single Page Application (SPA)](https://vitejs.dev/config/shared-options.html#apptype), deep linking won't work out of the box.

To enable deep linking in SPA Vite apps, create a `vercel.json` file at the root of your project, and add the following code:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

If [`cleanUrls`](https://vercel.com/docs/project-configuration#cleanurls) is set to `true` in your project's `vercel.json`, do not include the file extension in the source or destination path. For example, `/index.html` would be `/`

Deploying your app in Multi-Page App mode is recommended for production builds.

Learn more about [Multi-Page App mode](https://vitejs.dev/guide/build.html#multi-page-app) in the Vite docs.

See [our Frameworks documentation page](https://vercel.com/docs/frameworks) to learn about the benefits available to all frameworks when you deploy on Vercel.

Learn more about deploying Vite projects on Vercel with the following resources:
