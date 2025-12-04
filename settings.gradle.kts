rootProject.name = "reactive-platform"

// Container projects
include("libs")
include("libs:platform")
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

// Applications
include("apps:product-service")
include("apps:cart-service")
include("apps:audit-service")
