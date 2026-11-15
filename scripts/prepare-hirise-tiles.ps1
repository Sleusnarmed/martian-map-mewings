# Repackage the existing georeferenced HiRISE texture, preserving its alpha edge.
# No new detail is invented. Each level is aligned to the same geographic bounds.
param([string]$Source = 'public/data/wildcat-ridge/hirise-wildcat-blend.png',
      [string]$Output = 'public/data/wildcat-ridge/hirise-tiles')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$image = [System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $Source))
try {
  if ($image.Width -ne 2560 -or $image.Height -ne 2560) { throw 'Expected the existing 2560-square HiRISE crop.' }
  for ($level = 0; $level -le 3; $level++) {
    $side = [int][Math]::Pow(2, $level)
    $scaled = if ($level -eq 3) { [System.Drawing.Bitmap]$image.Clone() } else { [System.Drawing.Bitmap]::new(320 * $side, 320 * $side) }
    $graphics = [System.Drawing.Graphics]::FromImage($scaled)
    try {
      $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
      try {
        $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
        if ($level -ne 3) { $graphics.DrawImage($image, [System.Drawing.Rectangle]::new(0, 0, $scaled.Width, $scaled.Height), 0, 0, $image.Width, $image.Height, [System.Drawing.GraphicsUnit]::Pixel, $attributes) }
      } finally { $attributes.Dispose() }
      for ($x = 0; $x -lt $side; $x++) {
        $directory = Join-Path $Output "$level/$x"
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
        for ($y = 0; $y -lt $side; $y++) {
          $tile = $scaled.Clone([System.Drawing.Rectangle]::new($x * 320, $y * 320, 320, 320), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
          try { $tile.Save((Join-Path $directory "$y.png"), [System.Drawing.Imaging.ImageFormat]::Png) }
          finally { $tile.Dispose() }
        }
      }
    } finally { $graphics.Dispose(); $scaled.Dispose() }
  }
} finally { $image.Dispose() }
Write-Output 'Prepared 85 geographic tiles, 320 px, levels 0-3; finest level preserves the source pixels.'
