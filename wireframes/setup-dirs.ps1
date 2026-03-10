$base = "C:\Users\gasfo\OneDrive - Smart Workplace\Documents\code\shop\src"
$dirs = @(
  "types",
  "constants",
  "context",
  "hooks",
  "utils",
  "styles",
  "components\ui",
  "components\modals",
  "components\layout",
  "components\charts",
  "components\features",
  "components\forms",
  "pages\auth",
  "pages\onboarding",
  "pages\dashboard\components",
  "pages\products",
  "pages\pos\components",
  "pages\inventory",
  "pages\suppliers",
  "pages\purchaseOrders",
  "pages\customers",
  "pages\team",
  "pages\settings",
  "pages\admin"
)
foreach ($d in $dirs) {
  $path = Join-Path $base $d
  New-Item -ItemType Directory -Force -Path $path | Out-Null
}
Write-Output "Directory structure created successfully"
