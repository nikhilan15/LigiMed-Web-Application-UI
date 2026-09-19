# Enhanced LigiMed Implementation Plan

## 1. Project Vision

LigiMed is a role-based pharmaceutical commerce and operations platform connecting pharmacies, wholesale dealers, pharmacists, logistics providers, payment services, and administrators in one secure workflow.

The platform should support the complete medicine procurement lifecycle:

Registration → KYC verification → product discovery → dealer selection → order placement → approval → payment/BNPL → fulfillment → delivery tracking → invoice reconciliation → returns/recall → reporting

The system should not only display information, but should also guide each user through the next valid business action.

---

## 2. Current State of the Repository

The codebase already contains the foundation for a multi-role pharma platform:

### Frontend and app flow
- [src/app/App.tsx](src/app/App.tsx) manages session persistence, authentication state, user role handling, and navigation.
- The app includes role-based dashboard screens such as pharmacy, dealer, and admin flows.
- UI modules already exist for auth, inventory, marketplace, billing, logistics, KYC, and payments.

### Backend and API layer
- [server/index.js](server/index.js) initializes the Express app, CORS, uploads, API routing, and database startup flow.
- The backend is organized around controllers, services, middleware, routes, and database initialization.
- Services already include email, SMS, KYC, storage, and payment-related integrations.

### Testing and deployment
- Playwright tests are present under [e2e](e2e) for the main user journeys.
- Deployment guidance exists in [DEPLOYMENT.md](DEPLOYMENT.md) and the project is configured for Vite + React frontend deployment and Express backend hosting.

This means the project is not starting from zero. It is a partially implemented enterprise application prototype that now needs a disciplined implementation roadmap to move from UI scaffolding to a production-ready operational system.

---

## 3. User Roles and Responsibilities

### Pharmacy
- Register and complete business KYC
- Add and verify pharmacists
- Search medicines and compare dealers
- Create carts and purchase orders
- Request quotations for bulk orders
- Select payment terms
- Track deliveries
- Manage inventory and expiry dates
- Request returns or replacements
- View invoices, payments, and credit limits

### Wholesale Dealer
- Complete business and license verification
- Create and manage product listings
- Configure pricing, discounts, and stock availability
- Accept, reject, or partially fulfill orders
- Manage warehouse inventory
- Generate invoices and packing slips
- Assign shipments to logistics partners
- Process returns and replacements
- Monitor sales and outstanding payments

### Pharmacist
- Submit professional registration details
- Review compliance-sensitive transactions
- Approve controlled medicine requirements
- Monitor expiry and recall notices
- Confirm receipt of delivered medicines

### Admin
- Approve or reject KYC submissions
- Manage users, dealers, pharmacies, products, and categories
- Monitor suspicious transactions and operational risk
- Resolve disputes
- Configure payment, delivery, and commission rules
- Review audit logs and compliance reports

### Logistics Partner
- View assigned shipments
- Update pickup and delivery status
- Upload proof of delivery
- Manage failed deliveries and returns
- Track cold-chain compliance for sensitive shipments

---

## 4. Core Business Workflow

### 4.1 Registration and account creation

#### Pharmacy registration flow
1. User selects Pharmacy as the account type.
2. User enters business name, owner details, phone, email, license info, tax information, and address.
3. System verifies the contact details and creates the account in a pending or draft state.
4. User proceeds to the onboarding checklist.

#### Dealer registration flow
The dealer submits company details, wholesale license, warehouse address, tax details, bank details, and product categories. The account remains restricted until required documents are approved.

#### Onboarding checklist
Each organization should have a visible onboarding progress tracker:
- account created
- phone verified
- email verified
- business documents uploaded
- license submitted
- pharmacist added
- bank details added
- terms accepted
- admin approval completed

Possible account states:
- DRAFT
- PENDING_DOCUMENTS
- UNDER_REVIEW
- ACTION_REQUIRED
- APPROVED
- REJECTED
- SUSPENDED

---

### 4.2 KYC and compliance workflow

The KYC system should support both automated and manual review.

#### Document submission
Users upload business licenses, identity documents, tax certificates, pharmacist registration, bank verification, warehouse proof, and authorized signatory documents.

#### Validation and review
Each document should store:
- document type
- upload date
- expiration date
- verification status
- reviewer comments
- rejection reason
- version history

#### Admin review
Admin users can approve, reject, request resubmission, add notes, or suspend records. KYC status should be visible to the user:
- Not Started
- In Progress
- Submitted
- Under Review
- Action Required
- Verified
- Rejected
- Expired

The system should block product orders or listing activity when a user is not verified.

---

### 4.3 Marketplace and catalog workflow

#### Product catalog
Each product should support:
- brand and generic name
- category and strength
- dosage form and pack size
- manufacturer and batch details
- expiry, MRP, and dealer price
- tax, discount, and MOQ
- stock status and cold-chain flag
- prescription requirement
- storage instruction
- image support

#### Dealer catalog management
Dealers should be able to manage their listings, update pricing, maintain stock, and define delivery terms.

#### Pharmacy product discovery
Pharmacies should be able to search by product, filter by price, availability, delivery time, and dealer rating, compare offers, and save frequently ordered products.

Product approval states should include:
- DRAFT
- PENDING_REVIEW
- APPROVED
- REJECTED
- SUSPENDED
- OUT_OF_STOCK
- DISCONTINUED

---

### 4.4 Cart, quotation, and purchase order workflow

#### Shopping cart
Cart functionality should include:
- quantity validation
- stock availability checks
- minimum order quantity checks
- expiry-date warnings
- prescription validation
- dealer grouping
- tax and delivery calculations
- estimated delivery date
- saved cart support

#### Quotation workflow
For bulk purchases, pharmacies can request quotations from multiple dealers and compare:
- price
- discount
- availability
- delivery timeline
- payment terms
- validity period

Quotation states:
- DRAFT
- SUBMITTED
- RECEIVED
- UNDER_NEGOTIATION
- ACCEPTED
- REJECTED
- EXPIRED
- CANCELLED

#### Purchase order approval
Orders may require pharmacist or manager approval depending on value, category, or risk level.

---

## 5. Order Lifecycle

The application should implement a clear order state machine:

DRAFT → PENDING_APPROVAL → PENDING_DEALER_CONFIRMATION → CONFIRMED → PAYMENT_PENDING → PAYMENT_CONFIRMED → PROCESSING → PACKED → IN_TRANSIT → DELIVERED → CANCELLED / RETURN_REQUESTED / REFUNDED / DISPUTED

### Order placement workflow
1. Pharmacy submits order.
2. System validates KYC, stock, license rules, and credit/payment conditions.
3. Dealer receives the order.
4. Dealer accepts, rejects, or partially accepts it.
5. Payment is authorized or credit is assigned.
6. Dealer prepares shipment.
7. Logistics partner receives shipment assignment.
8. Pharmacy tracks the delivery.
9. Pharmacy confirms receipt.
10. Invoice and payment records are finalized.

### Partial fulfillment
If the dealer cannot fulfill all items, the system must allow split orders, partial confirmation, substitution suggestions, and automatic refund handling for unavailable products.

---

## 6. Inventory Management Workflow

Dealer inventory should support:
- warehouse-level stock
- batch-level stock
- expiry tracking
- reserved stock
- available stock
- damaged stock
- returned stock
- quarantined stock
- reorder thresholds
- stock adjustment history

Pharmacy inventory should support:
- received stock
- internal stock movement
- batch and expiry tracking
- low-stock alerts
- near-expiry alerts
- stock transfer between branches

Inventory calculation should follow:

Available Stock = Physical Stock - Reserved Stock - Quarantined Stock

---

## 7. Logistics and Reverse Logistics

### Shipment statuses
- SHIPMENT_CREATED
- PICKUP_SCHEDULED
- PICKED_UP
- IN_TRANSIT
- DELAYED
- OUT_FOR_DELIVERY
- DELIVERED
- DELIVERY_FAILED
- RETURN_TO_DEALER
- CANCELLED

### Reverse logistics
The platform should support return requests for damaged products, wrong product, wrong quantity, near-expiry stock, temperature breach, or quality issues.

Return states:
- REQUESTED
- UNDER_REVIEW
- APPROVED
- PICKUP_SCHEDULED
- PICKED_UP
- INSPECTION_PENDING
- APPROVED_FOR_REFUND
- REPLACEMENT_SENT
- REFUNDED
- REJECTED
- CLOSED

---

## 8. Billing, Payments, and BNPL

### Invoice workflow
Invoices should be generated from confirmed orders and include:
- invoice number
- pharmacy and dealer details
- product breakdown
- taxes and discounts
- delivery charges
- total payable
- payment status

Invoice states:
- DRAFT
- ISSUED
- PARTIALLY_PAID
- PAID
- OVERDUE
- CANCELLED
- CREDIT_NOTE_ISSUED

### Payment methods
Support online payment, bank transfer, cash on delivery, dealer credit, BNPL, wallet balance, and partial payment.

### BNPL workflow
The pharmacy can request credit access. The system checks KYC status, payment history, outstanding balance, and requested limit before approving or denying the request.

---

## 9. Notifications and Communication

Implement a centralized notification layer that uses in-app, email, SMS, and optionally WhatsApp or push notifications.

### Critical notifications
- OTP verification
- KYC approval request
- order creation and status changes
- payment success/failure
- shipment updates
- return approvals
- refund notifications
- low-stock and near-expiry alerts

---

## 10. Admin and Compliance Operations

### Admin dashboard metrics
- total pharmacies
- verified dealers
- pending KYC cases
- active orders
- delayed shipments
- failed payments
- open disputes
- total sales
- BNPL exposure
- expiring licenses
- return rate

### Risk and audit controls
The platform must log and monitor:
- login activity
- KYC decisions
- order and payment changes
- product price changes
- inventory adjustments
- refunds and returns
- suspicious or duplicate account behavior

Audit records should capture actor, action, entity, old value, new value, timestamp, and source information.

---

## 11. Recommended Technical Architecture

### Frontend
Apply a modular structure that focuses on role-based UI and feature domains:
- auth
- kyc
- marketplace
- inventory
- orders
- logistics
- billing
- payments
- admin

The current React app in [src/app/App.tsx](src/app/App.tsx) is a good starting layer, but the app should evolve toward reusable domains and permission-based route guards.

### Backend
The current Express backend should be expanded into a standard service-oriented structure with:
- validation middleware
- request/response formatting
- centralized error handling
- permission checks
- transaction-safe order and payment processing
- idempotent payment handling
- structured logging

### Data model priorities
At minimum, these domain tables should be designed carefully:
- users
- roles
- permissions
- organizations
- kyc_submissions
- documents
- products
- inventory
- orders
- order_items
- shipments
- invoices
- payments
- returns
- notifications
- audit_logs

---

## 12. Implementation Phases

### Phase 1: Foundation and architecture stabilization
- define user roles and permissions
- align frontend and backend API contracts
- stabilize environment configuration for local and production deployment
- confirm auth and session design

### Phase 2: Authentication and onboarding
- login and logout flows
- registration and KYC intake
- admin review workflow
- account approval states

### Phase 3: Marketplace and catalog
- product discovery
- dealer comparison
- product listing and pricing logic
- cart and quotation flows

### Phase 4: Orders and inventory
- order creation and approval
- stock validation and inventory updates
- batch and expiry tracking
- fulfillment lifecycle

### Phase 5: Logistics and reverse logistics
- shipment assignment and tracking
- proof of delivery
- return requests and refunds

### Phase 6: Billing and payments
- invoice generation
- payment capture
- BNPL approval flow
- reconciliation and reminders

### Phase 7: Admin operations and analytics
- dashboard reporting
- compliance monitoring
- audit and dispute workflows
- risk and fraud alerts

### Phase 8: QA, hardening, and launch
- Playwright coverage for critical flows
- load and security validation
- production monitoring and deployment verification

---

## 13. Testing Strategy

### Unit tests
- price and tax calculations
- stock and MOQ checks
- order state transitions
- permission checks
- BNPL limit checks

### API tests
- registration and login
- KYC submission and approval
- order creation and confirmation
- inventory updates
- payment and webhook handling
- return request processing

### E2E tests
Priority flows should include:
1. pharmacy registration and KYC
2. admin approval
3. dealer product listing
4. pharmacy product search and ordering
5. order confirmation and payment
6. shipment tracking
7. return request flow
8. BNPL application workflow

---

## 14. Release Plan

### Release 1: Foundation
- authentication
- role-based access
- KYC onboarding
- basic admin dashboard

### Release 2: Catalog and orders
- marketplace
- product comparison
- cart and purchase orders

### Release 3: Inventory and fulfillment
- stock management
- inventory updates
- shipment tracking

### Release 4: Billing and payments
- invoice generation
- payment processing
- BNPL support

### Release 5: Returns, admin, and analytics
- returns and refunds
- compliance dashboards
- operational reporting

### Release 6: Production hardening
- security and QA pass
- deployment validation
- monitoring and launch checklist

---

## 15. Success Criteria

The project should be considered production-ready when:
- users can register and log in by role
- KYC and compliance steps are enforced correctly
- pharmacies can compare dealers and place valid orders
- dealers can manage products, pricing, and fulfillment
- order lifecycle states work consistently
- inventory is updated correctly across stock movements
- payments and invoices stay synchronized with orders
- shipments and returns are tracked transparently
- admin users can review compliance and operational risk
- critical flows pass automated test coverage
- staging and production deployments remain reproducible and monitored

---

## 16. Final Recommendation

This project already has the right foundation: a role-based frontend, service-oriented backend, deployment config, and testing setup. The next step is not to reinvent the app, but to turn it into a structured implementation pipeline that closes the gap between the prototype and a real enterprise pharma commerce system.

The highest-priority implementation order is:

1. authentication and KYC
2. catalog and marketplace
3. inventory and order flow
4. fulfillment and logistics
5. payments and invoicing
6. returns, compliance, and admin dashboards
7. testing, security, and production readiness

This sequencing reduces risk, supports clear milestone delivery, and aligns with the actual architecture already present in the repository.


---

## 6. Milestones and Suggested Timeline

### Milestone 1: Foundation (Week 1)
- Environment readiness
- Core app shell and auth flow
- API contract review

### Milestone 2: Marketplace and Catalog (Week 2)
- Dealer listing UI
- Product browsing and filtering
- Basic ordering flow

### Milestone 3: Inventory and Orders (Week 3)
- Stock visibility
- Order workflow completion
- Status tracking

### Milestone 4: Logistics and Payments (Week 4)
- Shipment tracking
- Billing and payment integration
- BNPL flow validation

### Milestone 5: Admin and QA (Week 5)
- Admin dashboard
- Compliance review
- End-to-end validation and deployment cleanup

---

## 7. Risks and Mitigations

### Risk 1: Incomplete role-based logic
Mitigation: Create shared helper logic for user role detection, page routing, and permissions.

### Risk 2: API contract drift
Mitigation: Maintain a documented request/response structure and validate payloads before frontend integration.

### Risk 3: Local and deployment environment mismatch
Mitigation: Centralize environment variables and verify production settings in both Vercel and Render.

### Risk 4: inconsistent UI states
Mitigation: Standardize empty states, loading states, and error boundaries across screens.

### Risk 5: testing gaps in critical workflows
Mitigation: Prioritize end-to-end coverage for login, marketplace, orders, payments, and logistics.

---

## 8. Recommended Next Actions

1. Prioritize the login and onboarding flow and ensure it works end-to-end.
2. Map all major screens to actual backend endpoints and required data contracts.
3. Create a backlog for each domain: Marketplace, Inventory, Orders, Logistics, Payments, Admin.
4. Validate the current Playwright suite and expand it for missing business flows.
5. Finalize deployment configuration and environment variable documentation.

---

## 9. Recommended Deliverable for the Team

The project should treat this as a staged rollout, with the following release order:
1. Auth and registration
2. Marketplace and product discovery
3. Inventory and order flow
4. Logistics and reverse logistics
5. Billing and payment workflows
6. Admin compliance monitoring
7. Production hardening and launch

This approach reduces risk by delivering the most important operational flows first while preserving the architecture needed for larger pharma commerce workflows.

---

## 10. Conclusion

This project has a strong foundation in place, with a modular frontend, backend, and test harness already present. The most important next step is to convert the existing prototype into a structured implementation roadmap with role-based workflow completion, API alignment, and production deployment validation.

The application is already organized around the right business domains. The implementation plan should focus on finishing the end-to-end connected workflows rather than creating a completely new system from scratch.
