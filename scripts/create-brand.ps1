Add-Type -AssemblyName System.Drawing
$assetRoot = Join-Path $PSScriptRoot '..\assets'
function Write-Mark([string]$path, [bool]$foreground) {
  $bitmap = [System.Drawing.Bitmap]::new(1024, 1024)
  $canvas = [System.Drawing.Graphics]::FromImage($bitmap)
  $canvas.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $dark = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#101310'))
  $lime = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml('#C6F36A'))
  if ($foreground) { $canvas.Clear([System.Drawing.Color]::Transparent) } else { $canvas.Clear($dark.Color) }
  $canvas.FillEllipse($lime, 162, 162, 700, 700)
  $canvas.TranslateTransform(512, 512)
  $canvas.RotateTransform(-30)
  $canvas.TranslateTransform(-512, -512)
  $canvas.FillRectangle($dark, 290, 476, 444, 72)
  $canvas.FillRectangle($dark, 300, 355, 72, 314)
  $canvas.FillRectangle($dark, 392, 405, 52, 214)
  $canvas.FillRectangle($dark, 652, 355, 72, 314)
  $canvas.FillRectangle($dark, 580, 405, 52, 214)
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Dispose(); $bitmap.Dispose(); $dark.Dispose(); $lime.Dispose()
}
Write-Mark (Join-Path $assetRoot 'icon.png') $false
Write-Mark (Join-Path $assetRoot 'android-icon-foreground.png') $true
Write-Mark (Join-Path $assetRoot 'android-icon-monochrome.png') $true
Write-Mark (Join-Path $assetRoot 'favicon.png') $false
