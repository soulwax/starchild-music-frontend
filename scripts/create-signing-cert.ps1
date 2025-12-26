# Create a Self-Signed Code Signing Certificate for Electron Apps
# Usage: .\create-signing-cert.ps1 -AppName "MyElectronApp"

param(
    [Parameter(Mandatory=$true)]
    [string]$AppName,

    [Parameter(Mandatory=$false)]
    [int]$YearsValid = 5
)

Write-Host "Creating self-signed code signing certificate for: $AppName" -ForegroundColor Cyan

try {
    # Create the certificate
    $cert = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject "CN=$AppName" `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -Provider "Microsoft Enhanced RSA and AES Cryptographic Provider" `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears($YearsValid) `
        -TextExtension @("2.5.29.37={text}1.3.6.1.5.5.7.3.3") # Code Signing EKU

    Write-Host "`nCertificate created successfully!" -ForegroundColor Green
    Write-Host "Certificate Thumbprint: $($cert.Thumbprint)" -ForegroundColor Yellow
    Write-Host "Valid Until: $($cert.NotAfter)" -ForegroundColor Yellow

    Write-Host "`nTo use this certificate in electron-builder, add to package.json:" -ForegroundColor Cyan
    Write-Host @"
{
  "build": {
    "win": {
      "certificateSubjectName": "$AppName"
    }
  }
}
"@ -ForegroundColor White

    Write-Host "`nOr use the thumbprint:" -ForegroundColor Cyan
    Write-Host @"
{
  "build": {
    "win": {
      "certificateSha1": "$($cert.Thumbprint)"
    }
  }
}
"@ -ForegroundColor White

    Write-Host "`nCertificate installed in: Cert:\CurrentUser\Starchild" -ForegroundColor Green
    Write-Host "You can verify it with: certutil -user -store Starchild" -ForegroundColor Gray

} catch {
    Write-Host "`nError creating certificate: $_" -ForegroundColor Red
    Write-Host "Make sure you're running this script as Administrator" -ForegroundColor Yellow
    exit 1
}
