@set HERE=%~dp0
@cd /d %HERE%
@call %HERE%nssm-set-svc-app-name
%NSSM% install %SVC% %APP%
@pause
net start %SVC%
@pause
