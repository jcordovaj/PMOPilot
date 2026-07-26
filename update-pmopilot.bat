@echo off
REM PMOPilot Update Script for Windows
REM Actualiza tu repo GitHub con TODO el backend implementado

echo.
echo ========================================
echo    PMOPILOT UPDATE SCRIPT FOR WINDOWS
echo ========================================
echo.

:menu
echo.
echo SELECCIONA UNA OPCION:
echo 1. Verificar prerequisitos
echo 2. Ver estructura de archivos a copiar
echo 3. Ver instrucciones para commit/push
echo 4. Ver instrucciones para ejecutar localmente
echo 5. Salir
echo.

set /p choice="Elige una opcion (1-5): "

if "%choice%"=="1" goto prerequisitos
if "%choice%"=="2" goto estructura
if "%choice%"=="3" goto commit
if "%choice%"=="4" goto ejecutar
if "%choice%"=="5" goto salir

echo Opcion invalida
goto menu

:prerequisitos
echo.
echo ========================================
echo        VERIFICANDO PRERREQUISITOS
echo ========================================
echo.

REM Verificar que estamos en un repo git
if not exist ".git" (
    echo ERROR: No estas en un repositorio Git
    echo Por favor, ejecuta esto dentro de tu carpeta PMOPilot local
    goto menu
)

REM Verificar git
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git no esta instalado
    goto menu
)

echo OK: Repositorio Git verificado
goto menu

:estructura
echo.
echo ========================================
echo    ESTRUCTURA DE ARCHIVOS A COPIAR
echo ========================================
echo.
echo IMPORTANTE: Este script NO puede modificar tu repositorio directamente.
echo En su lugar, te mostrara QUE ARCHIVOS COPIAR y COMO HACERLO.
echo.
echo PASOS A SEGUIR:
echo 1. COPIAR ARCHIVOS MANUALMENTE
echo    • Copia los archivos listados desde nuestro sandbox a tu maquina local
echo    • Puedes copiar/pegar el contenido o descargar los archivos
echo.
echo 2. HACER COMMIT Y PUSH
echo    • Agrega los archivos: git add .
echo    • Commit: git commit -m "feat: backend completo PMOPilot"
echo    • Push: git push origin main
echo.
echo 3. PROBAR LOCALMENTE
echo    • Ejecutar: .\pmopilot-local.sh start
echo    • Verificar: .\pmopilot-local.sh test
echo.
echo ARCHIVOS A COPIAR (38 archivos):
echo.
echo 📦 ARCHIVOS RAIZ:
echo   • .env.example          # Variables de entorno
echo   • package.json          # Scripts de desarrollo
echo   • pyproject.toml        # Configuracion Python
echo   • README.md             # Documentacion actualizada
echo   • pmopilot-local.sh     # Orquestador principal
echo   • docker-compose.localstack.yml
echo   • LOCAL_ORCHESTRATION.md
echo   • test-automated.py     # Pruebas E2E
echo   • test_backend.py       # Pruebas unitarias
echo.
echo 🐍 BACKEND PYTHON:
echo   • apps/backend/requirements.txt
echo   • apps/backend/persistence/database.py
echo   • apps/backend/src/main.py
echo   • apps/backend/src/core/config.py
echo   • apps/backend/src/core/security.py
echo   • apps/backend/src/core/demo_data.py
echo   • apps/backend/src/models/planning.py
echo   • apps/backend/src/models/semantic_memory.py
echo   • apps/backend/src/services/project_service.py
echo   • apps/backend/src/integrations/gemini.py
echo   • apps/backend/src/integrations/sendgrid.py
echo   • apps/backend/src/integrations/cloudflare.py
echo   • apps/backend/src/integrations/kiro.py
echo.
echo ⚛️ FRONTEND MEJORADO:
echo   • apps/frontend/server.ts          # Proxy actualizado
echo   • apps/frontend/package.json       # Dependencias actualizadas
echo.
echo 🐳 LOCALSTACK:
echo   • localstack-init\01-create-tables.sh
echo.
pause
goto menu

:commit
echo.
echo ========================================
echo    INSTRUCCIONES PARA COMMIT Y PUSH
echo ========================================
echo.
echo PASO 2: SUBIR CAMBIOS A GITHUB
echo.
echo Ejecuta estos comandos en tu terminal local:
echo.
echo # 1. Verificar cambios
echo git status
echo.
echo # 2. Agregar todos los archivos
echo git add .
echo.
echo # 3. Hacer commit
echo git commit -m "feat: implementacion completa backend PMOPilot"
echo.
echo # 4. Hacer push a GitHub
echo git push origin main
echo.
echo # 5. Verificar que se subio
echo git log --oneline -3
echo.
echo ¡LISTO! Ahora tu repo GitHub tiene TODO el backend.
echo.
pause
goto menu

:ejecutar
echo.
echo ========================================
echo    INSTRUCCIONES PARA EJECUTAR LOCALMENTE
echo ========================================
echo.
echo PASO 3: EJECUTAR PMOPILOT EN TU MAQUINA
echo.
echo Una vez que tengas los archivos en tu maquina local:
echo.
echo # 1. Instalar dependencias
echo cd apps\backend && pip install -r requirements.txt
echo cd ..\frontend && npm install
echo cd ..\..
echo.
echo # 2. Usar PowerShell o WSL para el script bash
echo # En PowerShell:
echo .\pmopilot-local.sh start
echo.
echo # 3. Verificar que todo funciona
echo .\pmopilot-local.sh status
echo .\pmopilot-local.sh test
echo.
echo # 4. URLs para acceder:
echo • Frontend:      http://localhost:3000
echo • Backend API:   http://localhost:8000
echo • API Docs:      http://localhost:8000/api/docs
echo • Health Check:  http://localhost:8000/api/health
echo.
echo # 5. Detener servicios
echo .\pmopilot-local.sh stop
echo.
echo ¡FELICIDADES! 🎉
echo Ahora tienes un PMOPilot completo funcionando localmente.
echo.
pause
goto menu

:salir
echo.
echo Saliendo...
exit /b 0