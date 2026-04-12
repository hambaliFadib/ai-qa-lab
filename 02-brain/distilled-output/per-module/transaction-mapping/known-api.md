# Known API

- `GET /rbi/v1/dbs/api/billingitem/get-paging`
  - Use: load Transaction Mapping list
  - Confidence: high

- `GET /rbi/v1/dbs/api/billingitem/get-billing-category`
  - Use: load category options during create
  - Confidence: high

- `POST /rbi/v1/dbs/api/billingitem/generate-code`
  - Use: generate Transaction Mapping code during create
  - Confidence: high

- `GET /rbi/v1/dbs/api/billingitem/get-item-mapping/:id`
  - Use: load mapping detail during the create-related flow
  - Confidence: medium

- `GET /rbi/v1/dbs/api/billingitem/approval-hierarchies-detail/:id`
  - Use: load approval hierarchy detail
  - Confidence: high

- `GET /rbi/v1/dbs/api/billingitem/category-attachment-get`
  - Use: load attachment category data
  - Confidence: high

- `POST /rbi/v1/dbs/api/billingitem/validate-create`
  - Use: validate payload before the final create request
  - Confidence: high

- `POST /rbi/v1/dbs/api/billingitem/create`
  - Use: create Transaction Mapping item
  - Confidence: high

- `POST /rbi/v1/dbs/api/billingitem/attachment-upload`
  - Use: upload attachment after create
  - Confidence: high
