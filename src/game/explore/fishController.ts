import type { Collider } from './mapTemplates';

export class FishController {
  x = 350;
  target = 350;
  velocity = 0;
  frame = 3;
  bump = 0;
  private reboundX = 350;

  setTarget(x: number) { this.target = x; }

  update(dt: number, limits: { left: number; right: number }, fishY: number, colliders: Collider[]) {
    this.bump = Math.max(0, this.bump - dt);
    const requested = Math.max(limits.left, Math.min(limits.right, this.target));
    const desired = this.bump > 0 ? this.reboundX : requested;
    const desiredVelocity = (desired - this.x) * 5.2;
    this.velocity += (desiredVelocity - this.velocity) * Math.min(1, dt * 7.5);
    this.x += this.velocity * dt;

    if (this.bump === 0) {
      for (const shape of colliders) {
        const dy = (fishY - shape.y) / (shape.ry + 24);
        const dx = (this.x - shape.x) / (shape.rx + 20);
        if (dx * dx + dy * dy < 1) {
          const direction = Math.abs(dx) > 0.08 ? Math.sign(dx) : (this.velocity >= 0 ? 1 : -1);
          const edge = shape.x + direction * (shape.rx + 24) * Math.sqrt(Math.max(0.18, 1 - dy * dy));
          this.x = edge;
          this.reboundX = Math.max(limits.left, Math.min(limits.right, edge + direction * 38));
          this.velocity = direction * Math.max(18, Math.min(54, Math.abs(this.velocity) * 0.3 + 18));
          this.bump = 0.24;
          break;
        }
      }
    }
    this.x = Math.max(limits.left, Math.min(limits.right, this.x));
    const speed = this.velocity;
    const next = speed < -50 ? 0 : speed < -23 ? 1 : speed < -6 ? 2 : speed > 50 ? 6 : speed > 23 ? 5 : speed > 6 ? 4 : 3;
    // A small dead-zone around each frame avoids toggling at the thresholds.
    if (next === 3 || Math.abs(next - this.frame) > 0 || Math.abs(speed) > 12) this.frame = next;
    return this.frame;
  }
}
