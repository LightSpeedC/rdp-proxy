@set X_SVC="X RDP Proxy Service"
@set X_APP=node %~dp0net-net
@set X_NSSM=%~dp0nssm32
@if "%PROCESSOR_ARCHITECTURE%" == "AMD64" set X_NSSM=%~dp0nssm64
