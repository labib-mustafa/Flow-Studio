Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\labib_n4\Documents\Project\Flow-Studio"

' Silently terminate any orphan dev processes if running
WshShell.Run "taskkill /f /im electron.exe /fi ""STATUS eq RUNNING""", 0, True

' Start dev mode with 0 = hidden window (no command prompt/terminal window visible)
WshShell.Run "cmd /c npm run dev", 0, False
