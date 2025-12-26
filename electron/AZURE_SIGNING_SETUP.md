# Azure Code Signing Setup Guide

Complete step-by-step guide to set up Windows code signing for your Electron app using Azure Key Vault.

## Prerequisites

- Active Azure subscription
- Azure CLI installed ([download here](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
- Code signing certificate (or ability to purchase one)
- Windows 10+ with Windows SDK (includes `signtool.exe`)

## Step 1: Get a Code Signing Certificate

You need a valid code signing certificate from a trusted Certificate Authority (CA).

### Option A: Purchase a New Certificate

**Recommended CAs:**

1. **DigiCert** - Most trusted, ~$474/year for OV Code Signing, ~$599/year for EV
2. **Sectigo (formerly Comodo)** - Budget-friendly, ~$179/year for OV
3. **GlobalSign** - Mid-range, ~$299/year for OV

**Certificate Types:**

- **OV (Organization Validation)**: Standard code signing, delivered as .pfx file
- **EV (Extended Validation)**: Highest trust, requires HSM (Azure Key Vault supports this)

**Steps to purchase:**

1. Choose a CA (DigiCert recommended for least Windows warnings)
2. Select "Code Signing Certificate" or "EV Code Signing"
3. Complete organization validation (provide business documents)
4. Download certificate as `.pfx` or `.p12` format with private key

### Option B: Use Existing Certificate

If you already have a code signing certificate, ensure it's in `.pfx` or `.p12` format with the private key included.

## Step 2: Set Up Azure Key Vault

### 2.1 Login to Azure CLI

```powershell
# Login to Azure
az login

# Verify you're on the correct subscription
az account show

# If not, set the correct subscription
az account set --subscription "Your Subscription Name"
```

### 2.2 Create Resource Group (if needed)

```powershell
# Create a new resource group for Key Vault
az group create --name "darkfloor-signing-rg" --location "eastus"
```

### 2.3 Create Azure Key Vault

```powershell
# Create Key Vault (must be globally unique name)
az keyvault create --name "darkfloor-signing-kv" --resource-group "darkfloor-signing-rg" --location "eastus" --enable-rbac-authorization false
```

**Important:** Replace `darkfloor-signing-kv` with a unique name (only letters, numbers, hyphens; 3-24 characters).

**Note the output**, especially:

- **Vault URI**: `https://darkfloor-signing-kv.vault.azure.net` (you'll need this)

## Step 3: Upload Certificate to Key Vault

### 3.1 Import Certificate

```powershell
# Import your .pfx certificate to Key Vault
az keyvault certificate import --vault-name "darkfloor-signing-kv"  --name "starchild-codesign-cert" --file "C:\path\to\your\certificate.pfx"  --password "your_certificate_password"
```

**Replace:**

- `darkfloor-signing-kv` with your Key Vault name
- `starchild-codesign-cert` with your preferred certificate name (letters, numbers, hyphens only)
- `C:\path\to\your\certificate.pfx` with actual certificate path
- `your_certificate_password` with your certificate's password (if it has one)

### 3.2 Verify Certificate Upload

```powershell
# List certificates in Key Vault
az keyvault certificate list --vault-name "darkfloor-signing-kv"

# Show certificate details
az keyvault certificate show \
  --vault-name "darkfloor-signing-kv" \
  --name "starchild-codesign-cert"
```

You should see your certificate details, expiration date, and thumbprint.

## Step 4: Create Azure Service Principal

A service principal is an identity that your Electron build process will use to access the Key Vault.

### 4.1 Create Service Principal

```powershell
# Create service principal with Contributor role
az ad sp create-for-rbac --name "starchild-electron-signing-sp" --role Contributor --scopes /subscriptions/YOUR_SUBSCRIPTION_ID
```

**To get your subscription ID:**

```powershell
az account show --query id --output tsv
```

**The output will look like this (SAVE THESE VALUES):**

```json
{
  "appId": "12345678-1234-1234-1234-123456789abc",
  "displayName": "starchild-electron-signing-sp",
  "password": "super-secret-password-here",
  "tenant": "87654321-4321-4321-4321-abcdef123456"
}
```

**Important values:**

- `appId` → This is your **AZURE_KEY_VAULT_CLIENT_ID**
- `password` → This is your **AZURE_KEY_VAULT_CLIENT_SECRET**
- `tenant` → This is your **AZURE_KEY_VAULT_TENANT_ID**

## Step 5: Grant Service Principal Access to Key Vault

The service principal needs permission to read certificates and secrets from Key Vault.

```powershell
# Grant certificate and secret permissions
az keyvault set-policy \
  --name "darkfloor-signing-kv" \
  --spn "12345678-1234-1234-1234-123456789abc" \
  --certificate-permissions get list \
  --secret-permissions get list
```

**Replace:**

- `darkfloor-signing-kv` with your Key Vault name
- `12345678-1234-1234-1234-123456789abc` with your service principal's `appId` from Step 4.1

### 5.1 Verify Permissions

```powershell
# Check access policies
az keyvault show --name "darkfloor-signing-kv" --query "properties.accessPolicies"
```

You should see your service principal in the list with certificate and secret permissions.

## Step 6: Configure Environment Variables

Add these variables to your `.env.local` file (NEVER commit this file to git).

### 6.1 Create/Update `.env.local`

```bash
# Azure Key Vault Code Signing Configuration
AZURE_KEY_VAULT_URI=https://darkfloor-signing-kv.vault.azure.net
AZURE_KEY_VAULT_CERTIFICATE=starchild-codesign-cert
AZURE_KEY_VAULT_CLIENT_ID=12345678-1234-1234-1234-123456789abc
AZURE_KEY_VAULT_CLIENT_SECRET=super-secret-password-here
AZURE_KEY_VAULT_TENANT_ID=87654321-4321-4321-4321-abcdef123456

# Optional: Custom timestamp server (default: http://timestamp.digicert.com)
WINDOWS_TIMESTAMP_URL=http://timestamp.digicert.com

# Other environment variables (if you already have these)
AUTH_SECRET=your_auth_secret
AUTH_DISCORD_ID=your_discord_id
# ... etc
```

**Replace with your actual values:**

- `darkfloor-signing-kv` → Your Key Vault name
- `starchild-codesign-cert` → Your certificate name in Key Vault
- `12345678-...` → Service principal `appId`
- `super-secret-password-here` → Service principal `password`
- `87654321-...` → Service principal `tenant`

### 6.2 Verify `.env.local` is Gitignored

```powershell
# Check .gitignore
cat .gitignore | Select-String ".env.local"
```

If it's not there, add it:

```bash
echo ".env.local" >> .gitignore
```

## Step 7: Install Azure Sign Tool (Optional but Recommended)

```powershell
# Install Azure Sign Tool globally (required for Azure Key Vault signing)
dotnet tool install --global AzureSignTool
```

**If you don't have .NET SDK:**
Download from: <https://dotnet.microsoft.com/download>

**Verify installation:**

```powershell
azuresigntool --version
```

## Step 8: Test the Setup

### 8.1 Build with Signing

```powershell
# Clean previous builds
npm run electron:clean:win

# Build with signing
npm run electron:build:win
```

**Watch for signing output:**

```plaintext
🔐 Signing: Starchild Setup.exe
   Using Azure Key Vault signing
✅ Code signing successful
```

### 8.2 Verify the Signature

```powershell
# Verify using signtool (Windows SDK)
signtool verify /pa /v "dist\Starchild_setup.exe"

# Or using PowerShell
Get-AuthenticodeSignature "dist\Starchild_setup.exe" | Format-List
```

**Expected output:**

```yaml
Status        : Valid
StatusMessage : Signature verified.
SignerCertificate : [Subject]
                      CN=Your Organization Name
                      ...
```

### 8.3 Test Installation

1. Right-click the installer → Properties → Digital Signatures tab
2. You should see your organization name
3. Install the app - should not trigger SmartScreen warnings (after certificate reputation builds)

## Step 9: CI/CD Setup (GitHub Actions)

### 9.1 Add Secrets to GitHub

Go to your repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

- `AZURE_KEY_VAULT_URI`
- `AZURE_KEY_VAULT_CERTIFICATE`
- `AZURE_KEY_VAULT_CLIENT_ID`
- `AZURE_KEY_VAULT_CLIENT_SECRET`
- `AZURE_KEY_VAULT_TENANT_ID`

### 9.2 Create Workflow File

Create `.github/workflows/build-windows.yml`:

```yaml
name: Build and Sign Windows App

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

jobs:
  build-windows:
    runs-on: windows-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build Electron App
        env:
          AZURE_KEY_VAULT_URI: ${{ secrets.AZURE_KEY_VAULT_URI }}
          AZURE_KEY_VAULT_CERTIFICATE: ${{ secrets.AZURE_KEY_VAULT_CERTIFICATE }}
          AZURE_KEY_VAULT_CLIENT_ID: ${{ secrets.AZURE_KEY_VAULT_CLIENT_ID }}
          AZURE_KEY_VAULT_CLIENT_SECRET: ${{ secrets.AZURE_KEY_VAULT_CLIENT_SECRET }}
          AZURE_KEY_VAULT_TENANT_ID: ${{ secrets.AZURE_KEY_VAULT_TENANT_ID }}
          CI: true
        run: npm run electron:build:win

      - name: Upload signed installer
        uses: actions/upload-artifact@v4
        with:
          name: windows-installer-signed
          path: |
            dist/*.exe
            dist/*.nupkg
          retention-days: 30
```

## Troubleshooting

### Issue: "The specified Azure Key Vault could not be found"

**Solution:**

- Verify the Key Vault URI is correct: `https://your-vault-name.vault.azure.net`
- Check that Key Vault exists: `az keyvault show --name "your-vault-name"`

### Issue: "Access denied to Key Vault"

**Solution:**

- Verify service principal has permissions:

  ```powershell
  az keyvault set-policy --name "your-vault" --spn "your-client-id" \
    --certificate-permissions get list --secret-permissions get list
  ```

- Check you're using the correct tenant ID

### Issue: "Certificate not found in Key Vault"

**Solution:**

- List certificates: `az keyvault certificate list --vault-name "your-vault"`
- Verify certificate name matches exactly (case-sensitive)

### Issue: "SignTool not found"

**Solution:**

- Install Windows SDK: <https://developer.microsoft.com/en-us/windows/downloads/windows-sdk/>
- Add to PATH: `C:\Program Files (x86)\Windows Kits\10\bin\10.0.22621.0\x64`

### Issue: "Timestamp server unreachable"

**Solution:**
Try alternative timestamp servers in `.env.local`:

```bash
# DigiCert (default)
WINDOWS_TIMESTAMP_URL=http://timestamp.digicert.com

# Sectigo
WINDOWS_TIMESTAMP_URL=http://timestamp.sectigo.com

# GlobalSign
WINDOWS_TIMESTAMP_URL=http://timestamp.globalsign.com
```

## Cost Breakdown

### One-Time Costs

- **Code Signing Certificate**: $179-$599/year depending on CA and type
  - Sectigo OV: ~$179/year
  - DigiCert OV: ~$474/year
  - DigiCert EV: ~$599/year (recommended for zero SmartScreen warnings)

### Recurring Azure Costs (Monthly)

- **Azure Key Vault**: $0.03 per 10,000 operations
  - Estimated cost: ~$0.10/month for typical usage
- **Storage**: Negligible (certificate storage is free)
- **Total Azure Cost**: < $2/year

**Total Annual Cost**: ~$180-$600 (certificate) + ~$2 (Azure) = **$182-$602/year**

## Security Best Practices

1. ✅ **Never commit** `.env.local` to git
2. ✅ **Rotate service principal secrets** every 90 days
3. ✅ **Use separate Key Vaults** for dev/staging/prod
4. ✅ **Enable Key Vault logging** for audit trails
5. ✅ **Set certificate expiration alerts** (90 days before)
6. ✅ **Use managed identities** in Azure-hosted CI/CD (instead of service principals)
7. ✅ **Restrict Key Vault access** to only necessary IPs (if using Azure-hosted builds)

## Maintenance

### Certificate Renewal

When your certificate is about to expire:

1. Purchase/renew certificate from CA
2. Import new certificate to Key Vault:

   ```powershell
   az keyvault certificate import \
     --vault-name "darkfloor-signing-kv" \
     --name "starchild-codesign-cert-2025" \
     --file "C:\path\to\new-cert.pfx" \
     --password "new_password"
   ```

3. Update `AZURE_KEY_VAULT_CERTIFICATE` in `.env.local` and GitHub secrets
4. Test signing with new certificate
5. Delete old certificate after successful testing

### Monitoring

```powershell
# Check certificate expiration
az keyvault certificate show \
  --vault-name "darkfloor-signing-kv" \
  --name "starchild-codesign-cert" \
  --query "attributes.expires"

# View recent Key Vault operations (requires diagnostic settings)
az monitor activity-log list --resource-group "darkfloor-signing-rg"
```

## Additional Resources

- [Azure Key Vault Documentation](https://docs.microsoft.com/en-us/azure/key-vault/)
- [Code Signing Best Practices](https://docs.microsoft.com/en-us/windows-hardware/drivers/install/code-signing-best-practices)
- [@electron/windows-sign GitHub](https://github.com/electron/windows-sign)
- [DigiCert Code Signing Guide](https://www.digicert.com/kb/code-signing/code-signing-certificate-installation.htm)

## Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review Azure Key Vault logs
3. Verify all environment variables are set correctly
4. Test service principal access manually with Azure CLI
5. Check [electron/sign.js](./sign.js) for error messages
