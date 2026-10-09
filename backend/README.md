# CropCue backend

This is the minimal Spring Boot backend for the `get_insight` button.

## Run

From this directory:

```bash
mvn spring-boot:run
```

The server listens on `http://localhost:8080` by default. Set `PORT` to use a
different port.

## Get an insight

Send the selected field in the request body:

```bash
curl -X POST http://localhost:8080/api/get_insight ^
  -H "Content-Type: application/json" ^
  -d "{\"fieldId\":\"field-01\"}"
```

Response:

```json
{
  "action": "get_insight",
  "fieldId": "field-01",
  "insight": "Review soil moisture before planting and irrigate if the reading is below the recommended range."
}
```
