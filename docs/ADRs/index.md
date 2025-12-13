# Architectural Decision Records

Authoritative log of platform-level decisions. Each ADR captures the context, the decision, and its consequences. Review these before proposing conflicting changes.

## Index

- [000 - Use Markdown Architectural Decision Records](./000-use-markdown-architectural-decision-records.md)
- [001 - Adopt Redis Read Cache for Fan-Out Service Calls](./001_read_cache.md)
- [002 - Choose Postgres as the Durable Write Data Store for Cart Service Carts](./002_write_data_store.md)
- [003 - Adopt Queue-First Ingestion with Cassandra/Scylla Audit Store](./003_audit_data_store.md)
- [004 - GraphQL Interface and Real-Time Subscriptions Architecture for Cart Service](./004_graphql_subscriptions_architecture.md)
- [005 - User Service Authentication Strategy](./005_user_service_authentication_strategy.md)
- [006 - Frontend Monorepo Strategy](./006_frontend_monorepo_strategy.md)
- [007 - Frontend UI Framework Selection](./007_frontend_ui_framework.md)
- [008 - Component Library & Design System](./008_component_library_design_system.md)
- [009 - Frontend Testing Strategy](./009_frontend_testing_strategy.md)
- [010 - Scripting Language for Generic Tools and Scripts](./010_scripting_language_for_tools.md)
- [011 - Spring Authorization Server for Platform Authentication](./011_spring_authorization_server.md)
- [012 - Frontend-Backend Domain Model Sharing Strategy](./012_frontend_backend_model_sharing.md)
- [013 - SQLite as Offline POS Data Store](./013_offline_data_store.md)
- [014 - Go and Vanilla ESM for Offline POS Application](./014_offline_pos_technology_stack.md)
- [015 - Async Event-Driven Order Creation](./015_async_event_driven_order_creation.md)
- [016 - Ingress Gateway for Multi-UI Hosting and API Abstraction](./016_ingress_gateway_for_multi_ui_hosting_and_api_abstraction.md)

---

::: info Adding New ADRs
Use the `/create-adr` command to create a new ADR following the MADR 4.0.0 format.
:::
