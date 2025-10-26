# PowerShell script to press F11 key in Chrome window
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient

Write-Host "Waiting for Chrome window to be ready..."
Start-Sleep -Seconds 2

# Try to activate Chrome window
$wshell = New-Object -ComObject wscript.shell

# Try multiple window titles
$titles = @('localhost', 'Chrome', 'Google Chrome')
$activated = $false

foreach ($title in $titles) {
    if ($wshell.AppActivate($title)) {
        Write-Host "Found Chrome window: $title"
        $activated = $true
        break
    }
}

if (-not $activated) {
    # Try to find any Chrome window
    Get-Process | Where-Object {$_.ProcessName -eq "chrome"} | ForEach-Object {
        if ($_.MainWindowHandle -ne 0) {
            $wshell.AppActivate($_.Id)
            $activated = $true
            Write-Host "Activated Chrome by process ID"
            break
        }
    }
}

if ($activated) {
    Start-Sleep -Milliseconds 500
    
    # Press F11 twice (once to enter, once to ensure)
    Write-Host "Pressing F11..."
    [System.Windows.Forms.SendKeys]::SendWait("{F11}")
    Start-Sleep -Milliseconds 300
    [System.Windows.Forms.SendKeys]::SendWait("{F11}")
    
    Write-Host "Fullscreen activated successfully!"
} else {
    Write-Host "Could not find Chrome window"
}

