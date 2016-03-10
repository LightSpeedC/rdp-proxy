@set HERE=%~dp0
@cd /d %HERE%
@call %HERE%nssm-set-svc-app-name
@set USERNAME=.\Administrator
@set PASSWORD=password
%NSSM% install %SVC% %APP%
sc config %SVC% obj= %USERNAME% password= %PASSWORD%
@pause
net start %SVC%
@pause
