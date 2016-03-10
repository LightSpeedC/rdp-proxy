@set HERE=%~dp0
@cd /d %HERE%
@call %HERE%nssm-set-svc-app-name
net stop %SVC%
@pause
