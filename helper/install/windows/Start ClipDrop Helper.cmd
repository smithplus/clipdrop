@echo off
setlocal
cd /d "%~dp0\..\..\.."

where node >nul 2>nul || goto missing_node
where yt-dlp >nul 2>nul || goto missing_ytdlp
where ffmpeg >nul 2>nul || goto missing_ffmpeg

node helper\src\cli.js
exit /b %errorlevel%

:missing_node
echo Falta Node.js.
goto missing

:missing_ytdlp
echo Falta yt-dlp.
goto missing

:missing_ffmpeg
echo Falta ffmpeg.

:missing
echo Install the required component and reopen ClipDrop Helper.
pause
exit /b 1
