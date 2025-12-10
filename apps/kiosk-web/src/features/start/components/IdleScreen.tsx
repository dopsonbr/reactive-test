export function IdleScreen() {
  return (
    <div className="text-center space-y-8 text-muted-foreground">
      <h2 className="text-kiosk-xl font-semibold">
        Fast, Easy, Self-Checkout
      </h2>
      <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="space-y-3">
          <div className="text-6xl">1</div>
          <p className="text-kiosk-base">Scan your items</p>
        </div>
        <div className="space-y-3">
          <div className="text-6xl">2</div>
          <p className="text-kiosk-base">Review & pay</p>
        </div>
        <div className="space-y-3">
          <div className="text-6xl">3</div>
          <p className="text-kiosk-base">You're done!</p>
        </div>
      </div>
      <div className="mt-12 space-y-4">
        <p className="text-kiosk-sm">Accept all major payment methods</p>
        <p className="text-kiosk-sm">Rewards members: scan your loyalty card for points</p>
      </div>
    </div>
  );
}
