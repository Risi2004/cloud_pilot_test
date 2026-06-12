You can (and should!) use **environment variables** to configure your Render services:

![Image 1: List of environment variables in the Render Dashboard](https://render.com/docs-assets/bfa2c8f8594e356d1f5b657c3ec3bd98238d7fc71634dea157a8679907bd6e00/env-vars-dashboard.png)

Environment variables enable you to customize a service's runtime behavior for different environments (such as development, staging, and production). They also protect you from committing secret credentials (such as API keys or database connection strings) to your application source.

In addition to setting environment variables, you can:

*   Upload plaintext [secret files](https://render.com/docs/configure-environment-variables#secret-files) to Render that are available from your service's file system at runtime.
*   Create [environment _groups_](https://render.com/docs/configure-environment-variables#environment-groups) to share a collection of environment variables and secret files across multiple Render services.

Render sets default values for certain environment variables. [See the list](https://render.com/docs/environment-variables).

1.   In the [Render Dashboard](https://dashboard.render.com/), select the service you want to add an environment variable to.

2.   Click **Environment** in the left pane.

3.   Under **Environment Variables**, click **+ Add Environment Variable**.

    *   You can also click **Add from .env** to [add environment variables in bulk](https://render.com/docs/configure-environment-variables#adding-in-bulk-from-a-env-file).

4.   Provide a **Key** and **Value** for each new environment variable.

5.   Save your changes. You can select one of three options from the dropdown:

![Image 2: Save options for environment variables in the Render Dashboard](https://render.com/docs-assets/6d79cb61650c38435ec077468239903983bb5e471c8f8b33ba17868f2a19db6c/env-vars-dropdown.png)

    *   **Save, rebuild, and deploy:** Render triggers a new build for your service and deploys it with the new environment variables.
    *   **Save and deploy:** Render redeploys your service's _existing_ build with the new environment variables.
    *   **Save only:** Render saves the new environment variables _without_ triggering a deploy. Your service will not use the new variables until its next deploy.

That's it! Render saves your environment variables and then kicks off a deploy (unless you selected **Save only**).

If you have a local `.env` file, you can bulk-add its environment variables to your service by clicking **Add from .env** on your service's **Environment** page.

Your file must use valid `.env` syntax. Here are some valid variable declarations:

If you're using Render [Blueprints](https://render.com/docs/infrastructure-as-code) to represent your infrastructure as code, you can declare environment variables for a service directly in your `render.yaml` file.

**Don't commit the values of secret credentials to your `render.yaml` file!** Instead, you can declare [placeholder environment variables](https://render.com/docs/blueprint-spec#prompting-for-secret-values) for secret values that you then populate from the Render Dashboard.

Here are common patterns for declaring environment variables in a Blueprint:

For more details and examples, see the [Blueprint Specification](https://render.com/docs/blueprint-spec#environment-variables).

You can upload **secret files** to Render to make those files available to your service at runtime. These are plaintext files that usually contain one or more secret credentials, such as a private key.

The combined size of all secret files uploaded to any given service or [environment group](https://render.com/docs/configure-environment-variables#environment-groups) cannot exceed 1 MB.

1.   In the [Render Dashboard](https://dashboard.render.com/), select the service you want to add a secret file to.

2.   Click **Environment** in the left pane.

3.   Under **Secret Files**, click **+ Add Secret File**.

    *   You can click the button multiple times to add multiple files.

4.   Provide a **Filename** for the secret file.

    *   At runtime, the secret file is available at `/etc/secrets/<filename>`. 
        *   For non-Docker services, the file is _also_ available in your service's root directory.

    *   To access the secret file from a Docker-based service, see [Accessing secret files at runtime](https://render.com/docs/docker-secrets#accessing-secret-files-at-runtime).

5.   Click the **Contents** field to paste in the file's contents.

6.   Click **Save Changes**.

That's it! Render kicks off a new deploy of your service to make the secret file available.

**Environment groups** are collections of environment variables and/or [secret files](https://render.com/docs/configure-environment-variables#secret-files) that you can link to any number of different services. They're a helpful way to distribute configuration across a [multi-service architecture](https://render.com/docs/multi-service-architecture) using a single source of truth:

1.   In the [Render Dashboard](https://dashboard.render.com/), click **Environment Groups** in the left pane.

2.   Click **+ New Environment Group**. The following form appears:

![Image 3: Env group creation form](https://render.com/docs-assets/7ff1a07824db933a0d65830f0c0789fadb6592c5f172b5330d8311275440b48c/new-env-group.png)

3.   Provide a helpful **Group Name**.

4.   Provide the keys and values for any environment variables you want to add to the group.

5.   Upload any [secret files](https://render.com/docs/configure-environment-variables#secret-files) you want to add to the group.

6.   Click **Create Environment Group**. The newly created group appears in the list on your **Env Groups** page.

After you [create an environment group](https://render.com/docs/configure-environment-variables#creating-an-environment-group), you can link it to any number of different services. You can link multiple environment groups to a single service.

**Important precedence details:**

*   **Avoid variable collisions when linking multiple environment groups.** Render _does not guarantee_ its precedence behavior when multiple linked environment groups define the same environment variable. 
    *   Currently, Render uses the value from the _most recently created_ environment group. **This behavior might change in the future without notice.**

*   If a service defines an environment variable in its individual settings, that value always takes precedence over any linked environment groups that also define the variable. Render _does_ guarantee this behavior.

1.   In the [Render Dashboard](https://dashboard.render.com/), select the service you want to link an environment group to.

2.   Click **Environment** in the left pane.

3.   Under **Linked Environment Groups**, select a group from the dropdown and click **Link**.

That's it! Render kicks off a new deploy of your service to incorporate the values from the linked environment group.

You can modify an existing environment group from your **Env Groups** page in the [Render Dashboard](https://dashboard.render.com/). You can add new values, replace existing values, and so on.

If you make changes to an environment group (including deleting it), Render kicks off a new deploy for every linked service that has autodeploys enabled.

You can create [projects](https://render.com/docs/projects) to organize your services by their application and environment (such as staging or production). You can then scope an environment group to only the services in a single project environment. If you do, you can't link the group to any service _outside_ that environment. This helps ensure that your services use exactly the configuration you expect.

If an environment group _doesn't_ belong to a particular project environment, you can link it to _any_ service in your team—including services that _do_ belong to an environment.

1.   From your environment group's details page, click **Manage > Move group**:

![Image 4: Moving an environment group in the Render Dashboard](https://render.com/docs-assets/dc5751f04b370b23a779c860972687fb09696b903f800cf967e3b31f3406e52b/move-env-group-into-environment.png)

(This option doesn't appear if you haven't created any projects.)

2.   In the dialog that appears, select a project and environment to move to.

3.   Click **Move env group**.

After you move a group to a particular environment, it appears on the associated project's page:

![Image 5: Environment groups on project overview page](https://render.com/docs-assets/722f56819550895820c350a6d813f9188563155cf0b1062a07b6426407b3c29e/projects-environment-groups.png)

Note that you still need to link the group to any applicable services in the environment.

Each programming language provides its own mechanism for reading the value of an environment variable. Below are basic examples of reading the environment variable `DATABASE_URL`.

**Environment variable values are always strings.**

In your application logic, perform any necessary conversions for variable values that represent other data types, such as `"false"` or `"10000"`.

To set environment variables in your local environment, you can use the `export` command in your terminal:

It can be useful to create a local `.env` file at the root of your local project that lists the names and values of environment variables, like so:

Many languages have a library for reading a `.env` file, such as [dotenv](https://www.npmjs.com/package/dotenv) for Node.js and [python-dotenv](https://github.com/theskumar/python-dotenv) for Python.

If you use a `.env` file, you can [bulk-add its environment variables](https://render.com/docs/configure-environment-variables#adding-in-bulk-from-a-env-file) to your Render service.

**Do not commit your `.env` file to source control!** This file often contains secret credentials. To avoid accidentally committing it, add `.env` to your project's `.gitignore` file.