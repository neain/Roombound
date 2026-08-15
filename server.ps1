# ============================================================================
# Roombound Local Server
# ============================================================================
#
# PURPOSE
#
# Roombound is a browser-based application. For the initial version of the
# project, it is intended to be usable locally without requiring a permanent
# web host.
#
# The application cannot reliably be run by simply opening index.html with
# a file:/// URL. Chromium-based browsers (including Brave, Chrome, and
# Edge) apply browser security restrictions to pages loaded this way. Among
# other things, this can prevent JavaScript files and other resources from
# being loaded correctly.
#
# This script provides a small local HTTP server so Roombound can instead
# be accessed through:
#
#     http://localhost:8000/
#
# This makes the local copy behave much more like a normally hosted web
# application while still keeping the entire project on the user's machine.
#
# A future version of Roombound may be hosted publicly, but a local server
# remains useful for development and for running the project directly from
# a cloned Git repository.
#
#
# ============================================================================
# HOW TO USE
# ============================================================================
#
# 1. Clone or download the Roombound repository.
#
#
# 2. Open PowerShell in the Roombound directory.
#
#    From File Explorer, this can be done by:
#
#      - Open the Roombound folder.
#      - Click the address bar.
#      - Type "powershell"
#      - Press Enter.
#
#
# 3. Start the local server:
#
#        .\serve.ps1
#
#
# 4. Open a web browser and go to:
#
#        http://localhost:8000/
#
#
# 5. The Roombound application should now be running locally.
#
#
# 6. When finished, return to the PowerShell window and press:
#
#        Ctrl+C
#
#    This stops the local server.
#
#
# ============================================================================
# POWERSHELL EXECUTION POLICY
# ============================================================================
#
# Depending on the user's Windows/PowerShell configuration, PowerShell may
# prevent scripts from running and display an error stating that script
# execution is disabled.
#
# If this happens, run the server with:
#
#        powershell -ExecutionPolicy Bypass -File .\serve.ps1
#
# This bypass applies only to this invocation and does not require changing
# the user's system-wide PowerShell execution policy.
#
#
# ============================================================================
# SERVER DETAILS
# ============================================================================
#
# The server listens on port 8000:
#
#        http://localhost:8000/
#
# The server serves files from the directory containing this script.
#
# Therefore, serve.ps1 should remain in the root of the Roombound repository,
# alongside index.html.
#
# Example:
#
#     Roombound/
#     ├── index.html
#     ├── serve.ps1
#     ├── js/
#     │   └── main.js
#     └── ...
#
# ============================================================================


$Root = $PSScriptRoot
$Port = 8000

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()

Write-Host ""
Write-Host "Roombound local server started." -ForegroundColor Green
Write-Host ""
Write-Host "Serving: $Root"
Write-Host "Open:    http://localhost:$Port/"
Write-Host ""
Write-Host "Press Ctrl+C to stop the server."
Write-Host ""

$mimeTypes = @{
    ".html" = "text/html"
    ".htm"  = "text/html"
    ".js"   = "text/javascript"
    ".css"  = "text/css"
    ".json" = "application/json"
    ".csv"  = "text/csv"
    ".txt"  = "text/plain"
    ".xml"  = "application/xml"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".gif"  = "image/gif"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".webp" = "image/webp"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $relativePath = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)

        if ($relativePath -eq "/") {
            $relativePath = "/index.html"
        }

        $relativePath = $relativePath.TrimStart("/").Replace("/", "\")
        $filePath = Join-Path $Root $relativePath

        # Prevent requests from escaping the Roombound directory.
        $fullRoot = [System.IO.Path]::GetFullPath($Root)
        $fullPath = [System.IO.Path]::GetFullPath($filePath)

        if (-not $fullPath.StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            $response.StatusCode = 403
            $message = "403 Forbidden"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($message)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        if (Test-Path $fullPath -PathType Leaf) {
            try {
                $bytes = [System.IO.File]::ReadAllBytes($fullPath)

                $extension = [System.IO.Path]::GetExtension($fullPath).ToLower()

                if ($mimeTypes.ContainsKey($extension)) {
                    $response.ContentType = $mimeTypes[$extension]
                }
                else {
                    $response.ContentType = "application/octet-stream"
                }

                $response.StatusCode = 200
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
            catch {
                $response.StatusCode = 500
                $message = "500 Internal Server Error"
                $bytes = [System.Text.Encoding]::UTF8.GetBytes($message)
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        }
        else {
            $response.StatusCode = 404
            $message = "404 Not Found"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($message)
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }

        $response.Close()
    }
}
finally {
    $listener.Stop()
    $listener.Close()
}