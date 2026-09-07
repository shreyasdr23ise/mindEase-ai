Add-Type -AssemblyName System.Drawing

$Brand = [System.Drawing.ColorTranslator]::FromHtml("#0FA3B3")
$White = [System.Drawing.Color]::White

function New-HeartPath([float]$cx, [float]$cy, [float]$size) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $r = $size * 0.5
    $c1x = $cx - ($r * 0.65); $c1y = $cy - ($r * 0.42)
    $c2x = $cx + ($r * 0.65); $c2y = $cy - ($r * 0.42)
    $path.AddEllipse($c1x - $r, $c1y - $r, 2 * $r, 2 * $r)
    $path.AddEllipse($c2x - $r, $c2y - $r, 2 * $r, 2 * $r)
    $bottom = $cy + ($r * 1.65)
    $pts = New-Object System.Drawing.PointF[] 3
    $pts[0] = New-Object System.Drawing.PointF (($c1x - ($r * 0.45)), ($c1y + ($r * 0.10)))
    $pts[1] = New-Object System.Drawing.PointF (($c2x + ($r * 0.45)), ($c2y + ($r * 0.10)))
    $pts[2] = New-Object System.Drawing.PointF ($cx, $bottom)
    $path.AddPolygon($pts)
    $path.CloseFigure()
    return $path
}

function New-BrandedImage([int]$w, [int]$h, [bool]$bg, [System.Drawing.Color]$fg, [string]$out, [float]$heartFrac) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)
    if ($bg) { $g.Clear($Brand) }

    $cx = $w / 2.0; $cy = $h / 2.0
    $size = [float]($w * $heartFrac)
    $path = New-HeartPath $cx $cy $size
    $brush = New-Object System.Drawing.SolidBrush($fg)
    $g.FillPath($brush, $path)

    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $brush.Dispose(); $path.Dispose(); $g.Dispose(); $bmp.Dispose()
}

$dir = "D:\mindEase-ai\mobile\assets"
New-BrandedImage 1024 1024 $true  $White "$dir\icon.png"                       0.34
New-BrandedImage 1024 1024 $false $White "$dir\android-icon-foreground.png"    0.30
New-BrandedImage 1024 1024 $true  $White "$dir\android-icon-background.png"    0.30
New-BrandedImage 1024 1024 $false $White "$dir\android-icon-monochrome.png"    0.30
New-BrandedImage 480  480  $false $White "$dir\splash-icon.png"                 0.30
New-BrandedImage 64   64   $true  $White "$dir\favicon.png"                     0.55

Write-Output "Assets generated in $dir"
Get-ChildItem $dir | Select-Object Name, Length