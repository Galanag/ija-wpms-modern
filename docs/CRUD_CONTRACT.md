# Standard CRUD Contract

Each resource follows:

`GET /resource` list + filters + pagination
`GET /resource/:id` detail
`POST /resource` create
`PATCH /resource/:id` update
`DELETE /resource/:id` archive/delete according to business rule

Responses:

```json
{
  "ok": true,
  "data": {},
  "meta": {}
}
```

Errors:

```json
{
  "ok": false,
  "error": {"code": "VALIDATION_ERROR", "message": "...", "fields": {}}
}
```

Client behavior:

- create/update success invalidates relevant queries
- validation failure keeps modal open
- authorization failure does not alter local state
- archive/delete updates the list immediately after successful mutation
