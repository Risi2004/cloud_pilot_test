Render fully supports Docker-based deploys. Your services can:

*   [Pull and run a prebuilt image](https://render.com/docs/deploying-an-image) from a registry such as Docker Hub, or
*   [Build their own image](https://render.com/docs/docker#building-from-a-dockerfile) at deploy time based on the Dockerfile in your project repo.

**Render also provides [native language runtimes](https://render.com/docs/language-support) that don't require Docker.**

If you aren't sure whether to use Docker or a native runtime for your service, see [this section](https://render.com/docs/docker#docker-or-native-runtime).

To pull a prebuilt Docker image from a container registry and run it on Render, see [this article](https://render.com/docs/deploying-an-image).

Render can build your service's Docker image based on the Dockerfile in your project repo. To enable this, apply the following settings in the [Render Dashboard](https://dashboard.render.com/) during service creation:

1.   Set the **Language** field to **Docker** (even if your application uses a language listed in the dropdown):

![Image 1: Selecting the Docker language runtime during service creation](https://render.com/docs-assets/37bedbcf7d6824b252c0b2745a25ca034f08aa0cc86fa985ff4ddaca6f7b7f28/docker-set-language.png)

2.   If your Dockerfile is _not_ in your repo's root directory, specify its path (e.g., `my-subdirectory/Dockerfile`) in the **Dockerfile Path** field:

![Image 2: Specifying the Dockerfile path during service creation](https://render.com/docs-assets/47f234518a2a625735c3002f859459b7ba225faf466e6c4ec7d8331035370111/docker-set-path.png)

3.   If your build process will need to pull any private image dependencies from a container registry (such as Docker Hub), provide a corresponding credential in the **Registry Credential** field under **Advanced**:

![Image 3: Adding a registry credential during service creation](https://render.com/docs-assets/9468ac817504d7bfc6802fe5f94dbaa296b5652744ec11475620dbf6a9c86f83/docker-add-credential.png)

Learn more about [adding registry credentials](https://render.com/docs/deploying-an-image#credentials-for-private-images).

4.   If Render should run a custom command to start your service instead of using the `CMD` instruction in your Dockerfile (this is uncommon), specify it in the **Docker Command** field under **Advanced**:

![Image 4: Specifying a custom command during service creation](https://render.com/docs-assets/6bef9044dbcf9c6b900b7f1eed20c3d3d6506b9bf6df644123094d7bda7d13d0/docker-set-command.png)

**To run multiple commands, provide them to `/bin/sh -c`.**

For example, here's a **Docker Command** for a Django service that runs database migrations and then starts the web server:

If your Docker image includes Bash, you can use `/bin/bash -c` instead of `/bin/sh -c`.

Note that you can't customize the command that Render uses to _build_ your image.

5.   Specify the remainder of your service's configuration as appropriate for your project and click the **Deploy** button.

You're all set! Every time a deploy is triggered for your service, Render uses [BuildKit](https://docs.docker.com/build/buildkit/) to generate an updated image based on your repo's Dockerfile. Render stores your images in a private, secure container registry.

Your Docker-based services support [zero-downtime deploys](https://render.com/docs/deploys#zero-downtime-deploys), just like services that use a native language runtime.

Render provides [native language runtimes](https://render.com/docs/language-support) for **Node.js**, **Python**, **Ruby**, **Go**, **Rust**, and **Elixir**. If your project uses one of these languages and you don't _already_ use Docker, it's usually faster to get started with a native runtime. See [Your First Render Deploy](https://render.com/docs/your-first-deploy).

**You _should_ use Docker for your service in the following cases:**

*   Your project already uses Docker.
*   Your project uses a language that Render doesn't support natively, such as [PHP](https://render.com/docs/deploy-php-laravel-docker) or a JVM-based language (such as Java, Kotlin, or Scala).
*   Your project requires OS-level packages that aren't included in Render's [native runtimes](https://render.com/docs/native-runtimes). 
    *   With Docker, you have complete control over your base operating system and installed packages.

*   You need guaranteed reproducible builds. 
    *   Native runtimes receive regular updates to improve functionality, security, and performance. Although we aim to provide full backward compatibility, using a Dockerfile helps ensure that your production runtime matches your local builds.

Most platform capabilities are supported identically for Docker-based services and native runtime services, including:

*   [Zero-downtime deploys](https://render.com/docs/deploys#zero-downtime-deploys)
*   Setting a [pre-deploy command](https://render.com/docs/deploys#pre-deploy-command) to run database migrations and other tasks before each deploy
*   [Private networking](https://render.com/docs/private-network)
*   Support for [persistent disk storage](https://render.com/docs/disks)
*   [Custom domains](https://render.com/docs/custom-domains)
*   Automatic [Brotli](https://en.wikipedia.org/wiki/Brotli) and [gzip](https://en.wikipedia.org/wiki/Gzip) compression
*   [Infrastructure as code](https://render.com/docs/infrastructure-as-code) support with Render Blueprints

If you set [environment variables](https://render.com/docs/configure-environment-variables) for a Docker-based service, Render automatically translates those values to [Docker build arguments](https://docs.docker.com/build/building/variables/#arg-usage-example) that are available during your image's build process. These values are also available to your service at runtime as standard environment variables.

**In your Dockerfile, do not reference any build arguments that contain sensitive values (such as passwords or API keys).**

Otherwise, those sensitive values might be included in your generated image, which introduces a security risk. If you need to reference sensitive values during a build, instead add a secret file to your build context. For details, see [Using Secrets with Docker](https://render.com/docs/docker-secrets).

*   Render supports parallelized [multi-stage](https://docs.docker.com/develop/develop-images/multistage-build/) builds.
*   Render omits files and directories from your build context based on your `.dockerignore` file.

Render caches all intermediate build layers in your Dockerfile, which significantly speeds up subsequent builds. To further optimize your images and improve build times, follow [these instructions from Docker](https://docs.docker.com/build/building/best-practices/).

Render also maintains a cache of public images pulled from container registries. Because of this, pulling an image with a mutable tag (e.g., `latest`) might result in a build that uses a cached, less recent version of the image. To ensure that you _don't_ use a cached public image, do one of the following:

*   Reference an immutable tag when you deploy (e.g., a specific version like `v1.2.3`)
*   Add a credential to your image. For details, see [Credentials for private images](https://render.com/docs/deploying-an-image#credentials-for-private-images).

See quickstarts for deploying popular open-source applications using their official Docker images:

**Infrastructure components**

*   [ClickHouse](https://render.com/docs/deploy-clickhouse)
*   [Elasticsearch](https://render.com/docs/deploy-elasticsearch)
*   [MongoDB](https://render.com/docs/deploy-mongodb)
*   [MySQL](https://render.com/docs/deploy-mysql)
*   [n8n](https://render.com/docs/deploy-n8n)
*   [Temporal](https://render.com/docs/deploy-temporal)

**Blogging and content management**

*   [Ghost](https://render.com/docs/deploy-ghost)
*   [Wordpress](https://render.com/docs/deploy-wordpress)

**Analytics and business intelligence**

*   [Ackee](https://render.com/docs/deploy-ackee)
*   [Fathom Analytics](https://render.com/docs/deploy-fathom-analytics)
*   [GoatCounter](https://render.com/docs/deploy-goatcounter)
*   [Matomo](https://render.com/docs/deploy-matomo)
*   [Metabase](https://render.com/docs/deploy-metabase)
*   [Open Web Analytics](https://render.com/docs/deploy-open-web-analytics)
*   [Redash](https://render.com/docs/deploy-redash)
*   [Shynet](https://render.com/docs/deploy-shynet)

**Communication and collaboration**

*   [Forem](https://render.com/docs/deploy-forem)
*   [Mattermost](https://render.com/docs/deploy-mattermost)
*   [Zulip](https://render.com/docs/deploy-zulip)