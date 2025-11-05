# 2024 WESMO Website Backend
## Data Acquisition and Visualisation System

### Set up Python Virtual Envrioment
```sudo apt install python3.12-venv```
```python3 -m venv env```  
```source env/bin/activate```  
```sudo pip install -r requirements.txt```

### Install Redis Database
```sudo apt-get install redis```

### Set up Postgresql Database
```sudo apt-get install postgresql```
```sudo -u postgres psql```
```\password password```
```CREATE DATABASE wesmo```

### Set up Supervisor for Backend Scripts
```sudo apt-get install supervisor```

To run the backend of the website (only require if running the race-data dashboard), you need to create 
three config file (below), the contents for the files are in 'supervisord.txt'. Ensure that the virtual envrioment
is active when starting the supervisor.

```sudo nano /etc/supervisor/conf.d/websocket.conf```  
```sudo nano /etc/supervisor/conf.d/mqtt_subscriber.conf```  
```sudo nano /etc/supervisor/conf.d/poll.conf```

```sudo supervisorctl reread```  
```sudo supervisorctl update```  
```sudo supervisorctl start websocket mqtt_subscriber poll```

### Local simulator quick start

The MQTT subscriber now reads its configuration from environment variables so you can
drive the live dashboard without a full database stack. The key variables are:

| Variable | Purpose | Default |
| --- | --- | --- |
| `WESMO_MQTT_BROKER` | MQTT broker host name | `localhost` |
| `WESMO_MQTT_PORT` | MQTT broker TCP port | `1883` |
| `WESMO_RAW_TOPIC` | Raw CAN topic from the simulator | `/wesmo-data` |
| `WESMO_UI_TOPIC` | Processed telemetry topic for the dashboard | `wesmo/telemetry` |
| `WESMO_MQTT_USERNAME` / `WESMO_MQTT_PASSWORD` | Broker credentials | *(unset)* |
| `WESMO_ENABLE_DB` | Set to `0` to skip PostgreSQL during simulation | `1` |

To stream the Raspberry Pi simulator into the React dashboard on a dev machine:

1. Launch a Mosquitto broker that exposes MQTT on `1883` and WebSockets on `9001`.
2. In one shell, run `WESMO_ENABLE_DB=0 python3 mqtt_subscriber.py` from this folder.
3. In another shell, start the simulator with `python3 ../raspberry-pi/run_simulation.py`.
4. From `wesmo-app`, run `REACT_APP_MQTT_URL=ws://localhost:9001 npm start` and open `/dashboard`.

Adjust any of the variables above if your broker uses non-default credentials or
alternate hostnames.
