# Unified Attachment System

The `Attachment` model can belong to any supported domain entity using an explicit `entityType/entityId` pair.

Supported purposes include:

- ORGANIZATION_LOGO
- USER_AVATAR
- EMPLOYEE_PHOTO
- PROJECT_IMAGE
- TOURISM_IMAGE
- ASSET_IMAGE
- PROPERTY_IMAGE
- DOCUMENT
- KPI_EVIDENCE
- FINANCE_EVIDENCE
- PROCUREMENT_DOCUMENT
- LEGAL_DOCUMENT
- RESEARCH_DOCUMENT
- EVALUATION_EVIDENCE

Files are stored outside the public source tree and downloaded through an authorization-checked API endpoint.
