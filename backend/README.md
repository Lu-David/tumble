You need to create a .env file with the following entries populated:

```
USER=
PI_PATH=/home/${USER}/tumble
COMPOSE_FILE=${PI_PATH}/docker-compose.yml
VAPID_PRIVATE_KEY=
VAPID_PUBLIC_KEY=
VAPID_SUB=
```

To develop and test on local:
```
./local_deploy.sh
```

To develop and test on raspberry pi:
```
./remote_deploy.sh
```