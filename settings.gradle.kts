rootProject.name = "reactive-platform"

// Container projects
include("libs")
include("libs:backend")
include("libs:backend:platform")
include("libs:backend:shared-model")
include("apps")

// Platform libraries
include("libs:backend:platform:platform-bom")
include("libs:backend:platform:platform-logging")
include("libs:backend:platform:platform-resilience")
include("libs:backend:platform:platform-cache")
include("libs:backend:platform:platform-error")
include("libs:backend:platform:platform-webflux")
include("libs:backend:platform:platform-security")
include("libs:backend:platform:platform-test")
include("libs:backend:platform:platform-audit")

// Shared model libraries
include("libs:backend:shared-model:shared-model-product")
include("libs:backend:shared-model:shared-model-customer")
include("libs:backend:shared-model:shared-model-discount")
include("libs:backend:shared-model:shared-model-fulfillment")

// Applications
include("apps:product-service")
include("apps:cart-service")
include("apps:customer-service")
include("apps:discount-service")
include("apps:fulfillment-service")
include("apps:audit-service")
include("apps:checkout-service")
include("apps:order-service")
include("apps:user-service")
include("apps:merchandise-service")
include("apps:price-service")
