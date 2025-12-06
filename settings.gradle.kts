rootProject.name = "reactive-platform"

// Container projects
include("libs")
include("libs:platform")
include("libs:shared-model")
include("apps")

// Platform libraries
include("libs:platform:platform-bom")
include("libs:platform:platform-logging")
include("libs:platform:platform-resilience")
include("libs:platform:platform-cache")
include("libs:platform:platform-error")
include("libs:platform:platform-webflux")
include("libs:platform:platform-security")
include("libs:platform:platform-test")
include("libs:platform:platform-audit")

// Shared model libraries
include("libs:shared-model:shared-model-product")
include("libs:shared-model:shared-model-customer")
include("libs:shared-model:shared-model-discount")
include("libs:shared-model:shared-model-fulfillment")

// Applications
include("apps:product-service")
include("apps:cart-service")
include("apps:customer-service")
include("apps:discount-service")
include("apps:fulfillment-service")
include("apps:audit-service")
include("apps:checkout-service")
include("apps:order-service")
