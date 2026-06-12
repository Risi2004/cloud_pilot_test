/

/

/

/

/

/

Create database users to provide clients access to the clusters in your project.

## Note

The MongoDB Atlas Shared Responsibility Model defines the complementary duties of MongoDB and its customers in maintaining a secure and resilient data environment. Under this framework, MongoDB manages the security and operational integrity of the underlying platform, while customers are responsible for the configuration, management, and data policies of their specific deployments. For a detailed breakdown of ownership across security and operational excellence, see [Shared Responsibility Model.](https://www.mongodb.com/resources/products/fundamentals/shared-responsibility)

A database user's access is determined by the roles assigned to the user. When you create a database user, any of the [built-in roles](https://www.mongodb.com/docs/manual/reference/built-in-roles/#std-label-atlas-user-privileges) add the user to all clusters in your Atlas project. To specify which resources a database user can access in your project, you can select the option Restrict Access to Specific Clusters in the Atlas UI or set [specific privileges](https://www.mongodb.com/docs/manual/reference/built-in-roles/#std-label-atlas-specific-privileges) and [custom roles.](https://www.mongodb.com/docs/atlas/security-add-mongodb-roles/#std-label-mongodb-roles/)

Database users are separate from Atlas users. Database users have access to MongoDB databases, while Atlas users have access to the Atlas application itself. Atlas supports creating temporary database users that automatically expire within a user-configurable 7-day period.

Atlas audits the creation, deletion, and updates of both temporary and non-temporary database users in the project's [Activity Feed.](https://www.mongodb.com/docs/atlas/alert-resolutions/#std-label-project-activity-feed/)

## Note

### **Self-Managed Deployments**

The information on this page applies only to deployments hosted in Atlas. To learn how to create database users on self-managed deployments, see [Create a User on Self-Managed Deployments.](https://www.mongodb.com/docs/manual/tutorial/create-users/#std-label-create-users)

The following limitations apply only to deployments hosted in MongoDB Atlas. If any of these limits present a problem for your organization, contact [Atlas support.](https://www.mongodb.com/docs/atlas/support/)

*   You must use the [Atlas CLI](https://www.mongodb.com/docs/atlas/cli/stable/command/atlas-dbusers-create/), [Atlas Administration API](https://www.mongodb.com/docs/atlas/reference/api-resources-spec/v2/#tag/Database-Users), Atlas UI, or a supported [integration](https://www.mongodb.com/docs/atlas/partner-integrations/#std-label-partner-integrations) to manage database users on Atlas clusters. Otherwise, Atlas rolls back any user modifications.

*   You can create a maximum of 100 database users per Atlas project.

Atlas offers the following forms of authentication for database users:

*   **Password:**[SCRAM](https://www.mongodb.com/docs/manual/core/security-scram/#std-label-authentication-scram) is MongoDB's default authentication method. SCRAM requires a password for each user.

The [authentication database](https://www.mongodb.com/docs/manual/core/security-users/#std-label-user-authentication-database) for SCRAM-authenticated users is the `admin` database.

## Note

By default, Atlas supports SCRAM-SHA-256 authentication. If you created a user before MongoDB 4.0, you must update MongoDB 4.0, update their passwords to generate SCRAM-SHA-256 credentials. You may reuse existing passwords. 
**When to use SCRAM:**

You can use SCRAM authentication for human users and application users. For lower environments, SCRAM is a suitable authentication method. For production and higher environments, follow security best practices to keep secrets secure and short-term, such as integrating with Privileged Access Management (PAM) solutions. 
*   **X.509 Certificates:**[X.509 Certificates](https://www.mongodb.com/docs/manual/core/security-x.509/), also known as mutual TLS or mTLS, allow passwordless authentication by using a trusted certificate.

The [authentication database](https://www.mongodb.com/docs/manual/core/security-users/#std-label-user-authentication-database) for X.509-authenticated users is the `$external` database.

If you [enable LDAP authorization](https://www.mongodb.com/docs/atlas/security-ldaps/#std-label-ldaps-authentication-authorization/), you can't connect to your clusters with users that authenticate with an Atlas-managed X.509 certificate. To enable LDAP and connecting to your clusters with X.509 users, see [Set Up Self-Managed X.509 Certificates.](https://www.mongodb.com/docs/atlas/security-self-managed-x509/#std-label-self-managed-x509/)

**When to use X.509:**

X.509 authentication is suitable for secure workload access when workload identity federation (OIDC) or AWS IAM authentication is not feasible, or when mutual authentication is required. 
*   
**OIDC:** OpenID Connect (OIDC) authentication enables passwordless, secretless authentication using external identity providers. Atlas supports the following types of OIDC authentication:

    *   [Workload Identity Federation](https://www.mongodb.com/docs/atlas/workload-oidc/#std-label-oidc-authentication-workload) for applications using external programmatic identities such as Azure Service Principals, Azure Managed Identities, and Google Service Accounts.

The [authentication database](https://www.mongodb.com/docs/manual/core/security-users/#std-label-user-authentication-database) for OIDC-authenticated users is the `$external` database.

OIDC authentication is available only on clusters which use MongoDB version 7.0 and higher.

**When to use OIDC:**

For human users, we recommend that you use Workforce Identity Federation with OIDC.

For application users, we recommend that you use Workload Identity Federation with OIDC for applications that run on GCP or Azure.

*   **AWS IAM:** You can create a database user which uses an [AWS IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html) User or Role ARN for authentication.

The [authentication database](https://www.mongodb.com/docs/manual/core/security-users/#std-label-user-authentication-database) for AWS IAM-authenticated users is the `$external` database.

**When to use AWS IAM:**

We recommend that you use AWS IAM authentication with IAM roles for application users running on AWS. 

To add database users, you must have [`Organization Owner`](https://www.mongodb.com/docs/atlas/reference/user-roles/#mongodb-authrole-Organization-Owner/), [`Organization Stream Processing Admin`](https://www.mongodb.com/docs/atlas/reference/user-roles/#mongodb-authrole-Organization-Stream-Processing-Admin/), [`Project Owner`](https://www.mongodb.com/docs/atlas/reference/user-roles/#mongodb-authrole-Project-Owner/), [`Project Stream Processing Owner`](https://www.mongodb.com/docs/atlas/reference/user-roles/#mongodb-authrole-Project-Stream-Processing-Owner/), or [`Project Database Access Admin`](https://www.mongodb.com/docs/atlas/reference/user-roles/#mongodb-authrole-Project-Database-Access-Admin/) access to Atlas.

Interface

Authentication Method

Select an authentication mechanism and follow the steps to create a new database user using the Atlas UI.

1

1.   If it's not already displayed, select the organization that contains your project from the Organizations menu in the navigation bar.

2.   If it's not already displayed, select your project from the Projects menu in the navigation bar.

3.   In the sidebar, click Database & Network Access under the Security heading.

The [Database & Network Access](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fsecurity%2Fdatabase) page displays.

2

1.   If it isn't already displayed, click the Database Users tab.

2.   Click Add New Database User.

3

In the Authentication Method section of the Add New Database User modal window, select the box labeled Password.

4

Under Password Authentication, there are two text fields.

1.   Enter a username for the new user in the top text field.

2.   Enter a password for the new user in the lower text field.

To use a password auto-generated by Atlas, click the Autogenerate Secure Password button.

5

Select the database user privileges. You can assign privileges to the new user in one or more of the following ways:

*   Select a [built-in role](https://www.mongodb.com/docs/manual/reference/built-in-roles/#std-label-atlas-user-privileges) from the Built-in Role dropdown menu. You can select one built-in role per database user within the Atlas UI. If you delete the default option, you can click Add Built-in Role to select a new built-in role.

*   If you have any [custom roles](https://www.mongodb.com/docs/atlas/security-add-mongodb-roles/#std-label-mongodb-roles/) defined, you can expand the Custom Roles section and select one or more roles from the Custom Roles dropdown menu. Click Add Custom Role to add more custom roles. You can also click the Custom Roles link to see the custom roles for your project.

*   Expand the Specific Privileges section and select one or more [privileges](https://www.mongodb.com/docs/manual/reference/built-in-roles/#std-label-atlas-specific-privileges) from the Specific Privileges dropdown menu. Click Add Specific Privilege to add more privileges. This assigns the user specific privileges on individual databases and collections.

Atlas can apply a built-in role, multiple custom roles, and multiple specific privileges to a single database user.

To remove an applied role or privilege, click Delete next to the role or privilege you wish to delete.

## Note

Atlas doesn't display the Delete icon next to your Built-in Role, Custom Role, or Specific Privilege selection if you selected only one option. You can delete the selected role or privilege once you apply another role or privilege.

For more information on authorization, see [Role-Based Access Control](https://www.mongodb.com/docs/manual/core/authorization/) and [Built-in Roles](https://www.mongodb.com/docs/manual/reference/built-in-roles/) in the MongoDB manual.

6

By default, users can access all the clusters and federated database instances in the project. You can restrict access to specific clusters and federated database instances by doing the following:

1.   Toggle Restrict Access to Specific Clusters/Federated Database Instances to ON.

2.   Select the clusters and federated database instances to grant the user access to from the Grant Access To list.

7

Toggle Temporary User to On and choose a time after which Atlas can delete the user from the Temporary User Duration dropdown. You can select one of the following time periods for the user to exist:

*   6 hours

*   1 day

*   1 week

In the Database Users tab, temporary users display the time remaining until Atlas will delete the user. Once Atlas deletes the user, any client or application that uses the temporary user's credentials loses access to the cluster.

8

To view Atlas database users and X.509 certificates in the

Atlas UI:

1

1.   If it's not already displayed, select the organization that contains your project from the Organizations menu in the navigation bar.

2.   If it's not already displayed, select your project from the Projects menu in the navigation bar.

3.   In the sidebar, click Database & Network Access under the Security heading.

The [Database & Network Access](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fsecurity%2Fdatabase) page displays.

2

1.   If it's not already displayed, click the Database Users tab.

2.   Click Edit for the user to view their privileges, authentication details, and X.509 certificates.

To modify existing users for an Atlas project:

1

1.   If it's not already displayed, select the organization that contains your project from the Organizations menu in the navigation bar.

2.   If it's not already displayed, select your project from the Projects menu in the navigation bar.

3.   In the sidebar, click Database & Network Access under the Security heading.

The [Database & Network Access](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fsecurity%2Fdatabase) page displays.

2

1.   If it's not already displayed, click the Database Users tab.

2.   Click Edit for the user you want to modify.

You can modify the privileges and authentication details assigned to the user. You cannot modify the authentication method.

The following table describes what you can do for each user:

| User Type | Action |
| --- | --- |
| SCRAM authenticated users | Edit a user's password. |
| X.509 certificate authenticated users | Download a new certificate. |
| AWS IAM users | Modify database access privileges. |
| Temporary users | Modify the time period the user exists or make the user a permanent user, provided the user's expiration date has not already passed. | ## Note

You cannot change a permanent user into a temporary user. If you change a temporary user into a permanent user, you cannot make it temporary again.  
3.   Click Update User to save the changes.

To delete existing users for an Atlas project using the Atlas UI:

1

1.   If it's not already displayed, select the organization that contains your project from the Organizations menu in the navigation bar.

2.   If it's not already displayed, select your project from the Projects menu in the navigation bar.

3.   In the sidebar, click Database & Network Access under the Security heading.

The [Database & Network Access](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fsecurity%2Fdatabase) page displays.