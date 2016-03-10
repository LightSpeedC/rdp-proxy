set HERE=%~dp0
set SVC=XRDPProxyServer
set APP=%HERE%node %HERE%net-net
set NSSM=%HERE%nssm
if "%PROCESSOR_ARCHITECTURE%" == "AMD64" set NSSM=%HERE%nssm64
