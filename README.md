# Apuntador

Just an open source teleprompter.

## Requirements

- Node JS v20.16.0 or higher

nvm is recomended.

## Quickstart

```sh
npm install
npm run dev
```

Visit: http://localhost:5173/

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Run End-to-End Tests with [Playwright](https://playwright.dev)

```sh
# Install browsers for the first run
npx playwright install

# When testing on CI, must build the project first
npm run build

# Runs the end-to-end tests
npm run test:e2e
# Runs the tests only on Chromium
npm run test:e2e -- --project=chromium
# Runs the tests of a specific file
npm run test:e2e -- tests/example.spec.ts
# Runs the tests in debug mode
npm run test:e2e -- --debug
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## CI/CD

### Workflow configuration

To be able to create a release the GITHUB_TOKEN should have read and write permissions on the repository.

- On the github page go to Settings -> Actions -> General.
- Go to the section "Workflow Permissions" and change tto "Read and write permissions".
- Save the settings.

### Create service account on aws

A service account will be used to access AWS services from github and terraform. By default AdminsitratorAccess is granted but the permissions can be restricted using a custom policy.

```bash
# Create IAM user
aws iam create-user --user-name service-account

# Assing the policy AdministratorAccess to the user
aws iam attach-user-policy --user-name service-account --policy-arn arn:aws:iam::aws:policy/AdministratorAccess

# Create security credentials
aws iam create-access-key --user-name service-account


```

Store the access key and secret access key returne by the last command securely.

### CD variable configuration

To use the manual deployment workflow you need to set some variables and secrets on the repository.

- Go to Settings -> Environments.
- Create as many environments as you wish (dev, staging, prod ...).
- Access every environment and configure the secrets:
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
- Configure every variable as well:
  - AWS_REGION
  - S3_BUCKET

## Infrastructure

Deploy on AWS using Terraform.

### Requirements

- AWS Account and credentials (access key and secret key).
- A working domain.
- AWS cli installed and configured
- Terraform installed

### Steps

Create the files application.backend.conf and configuration.tfvars and set the variables.

```bash
terraform init -backend-config="application.backend.conf"

terraform apply -var-file="application.configuration.tfvars"

```
