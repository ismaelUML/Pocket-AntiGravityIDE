@echo off
setlocal
cd /d "%~dp0\..\.."
title Pocket AntiGravity IDE - Auditoria de Arquitectura y Metricas
mode con: cols=130 lines=48 >nul 2>&1

set "PYTHON_EXE=python"
python --version >nul 2>&1
if errorlevel 1 (
    if exist "venv\Scripts\python.exe" (
        set "PYTHON_EXE=venv\Scripts\python.exe"
    ) else if exist ".venv\Scripts\python.exe" (
        set "PYTHON_EXE=.venv\Scripts\python.exe"
    ) else (
        echo [ERROR] No se encontro Python en PATH ni en entorno virtual.
        echo         Asegurate de tener Python instalado y accesible.
        echo.
        pause
        exit /b 1
    )
)

echo ==============================================================================================================================
echo                            POCKET ANTIGRAVITY IDE - AUDITORIA DETERMINISTA DE CALIDAD Y ARQUITECTURA
echo ==============================================================================================================================
echo.

"%PYTHON_EXE%" tools\metricasV2\audit_project.py .
echo.
echo ==============================================================================================================================
echo                               VERIFICACION DETERMINISTA DE REGRESION DE CALIDAD [SUITE NODE TEST]
echo ==============================================================================================================================
echo.

call npm test
set TEST_STATUS=%ERRORLEVEL%

echo.
if %TEST_STATUS% EQU 0 (
    echo ==============================================================================================================================
    echo                         ESTADO DE SUITE: TODOS LOS TESTS PASARON CON EXITO [0 REGRESIONES DETECTADAS]
    echo ==============================================================================================================================
) else (
    echo ==============================================================================================================================
    echo                         [!] ADVERTENCIA: SE DETECTARON FALLOS EN LA SUITE DE REGRESION [CODIGO: %TEST_STATUS%]
    echo ==============================================================================================================================
)

echo.
pause
